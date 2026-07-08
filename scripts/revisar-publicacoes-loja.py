from __future__ import annotations

import argparse
import json
import re
import shutil
from collections import Counter
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from pathlib import Path
from typing import Any

from anuncios_core import (
    check_link,
    classify_product,
    image_exists,
    image_is_placeholder,
    link_is_direct_product,
    normalize_text,
    optimize_image_from_url,
    slugify,
    title_similarity,
    today_iso,
    write_json,
)


PRICE_RE = re.compile(r"^R\$\s?\d{1,3}(?:\.\d{3})*,\d{2}$|^Sob consulta$")

NEW_STORES: list[dict[str, Any]] = [
    {
        "id": "impacto-montaria",
        "slug": "montaria",
        "route": "/loja/montaria",
        "name": "IMPACTO MONTARIA",
        "commercialName": "Montaria Prime",
        "floor": "ala-externa",
        "category": "Auto, Ferramentas e Esporte",
        "type": "products",
        "theme": "sport",
        "icon": "CAV",
        "color": "#8b5e34",
        "gradient": "linear-gradient(135deg,#fff8ed,#ffffff 46%,#e8f4ec)",
        "description": "Selas, arreios, cabecadas, peitorais e acessorios selecionados para cavalgada, rodeio e equitacao.",
        "subcategories": [
            "Selas",
            "Arreios",
            "Cabecadas",
            "Peitorais",
            "Freios e redeas",
            "Estribos",
            "Protecao para cavalo",
            "Cavalgada",
            "Equitacao",
            "Rodeio",
        ],
        "section": "Montaria, selaria e cavalgada",
        "active": True,
        "coverImage": "public/images/anuncios/sela-australiana-preta-para-cavalo-com-conjunto-completo-1d79daf2.webp",
    },
    {
        "id": "grife-prime",
        "slug": "grife-prime",
        "route": "/loja/grife-prime",
        "name": "GRIFE PRIME",
        "commercialName": "Moda, Country e Acessorios",
        "floor": "terreo",
        "category": "Moda e Calçados",
        "type": "products",
        "theme": "fashion",
        "icon": "GP",
        "color": "#9f6a2e",
        "gradient": "linear-gradient(135deg,#fff4e8,#ffffff 48%,#efe7dc)",
        "description": "Boutique premium para moda feminina, moda country, botas, cintos, chapeus, bolsas e acessorios.",
        "subcategories": [
            "Moda feminina",
            "Moda country",
            "Botas e botinas",
            "Cintos",
            "Chapeus",
            "Camisas",
            "Bolsas",
            "Mochilas",
            "Acessorios",
            "Looks premium",
        ],
        "section": "Moda premium e achados de estilo",
        "active": True,
        "coverImage": "public/images/anuncios/mochila-impermeavel-d3c5d583.webp",
    },
]


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def purchase_link(product: dict[str, Any]) -> str:
    return str(
        product.get("linkCompra")
        or product.get("affiliateLink")
        or product.get("linkAfiliado")
        or product.get("linkComissionado")
        or product.get("linkOriginal")
        or product.get("urlProduto")
        or product.get("url")
        or ""
    ).strip()


def product_image(product: dict[str, Any]) -> str:
    return str(
        product.get("image")
        or product.get("imagemPrincipal")
        or product.get("fotoPrincipal")
        or product.get("imagem")
        or ""
    ).strip()


def is_active(product: dict[str, Any]) -> bool:
    return str(product.get("status") or "").lower() == "ativo" and product.get("aprovadoParaPublicacao") is not False


def is_external_store(product: dict[str, Any]) -> bool:
    return product.get("type") == "external-store" or product.get("actionType") == "external-store"


def append_pending(product: dict[str, Any], message: str) -> None:
    pending = product.get("pendencias")
    if not isinstance(pending, list):
        pending = []
    if message not in pending:
        pending.append(message)
    product["pendencias"] = pending


def clean_title(value: str) -> str:
    value = str(value or "")
    value = re.sub(r"\s*\|\s*(Amazon|Mercado Livre|MercadoLibre).*", "", value, flags=re.I)
    value = re.sub(r"\s*:\s*Amazon\.com\.br.*", "", value, flags=re.I)
    return re.sub(r"\s+", " ", value).strip()


def ensure_stores(stores: list[dict[str, Any]]) -> dict[str, int]:
    existing = {store.get("id"): store for store in stores}
    inserted = 0
    for new_store in NEW_STORES:
        if new_store["id"] in existing:
            existing[new_store["id"]].update(new_store)
            continue
        if new_store["id"] == "grife-prime":
            insert_after = next((index for index, store in enumerate(stores) if store.get("id") == "impacto-moda"), len(stores) - 1)
        else:
            insert_after = next((index for index, store in enumerate(stores) if store.get("id") == "impacto-sport"), len(stores) - 1)
        stores.insert(insert_after + 1, dict(new_store))
        inserted += 1
    return {"created": inserted, "total": len(stores)}


def classify_for_store(product: dict[str, Any]) -> dict[str, str]:
    action_type = str(product.get("actionType") or "").lower()
    if action_type in {"quote", "service", "external-store"}:
        return {
            "storeId": str(product.get("storeId") or "impacto-ofertas"),
            "category": str(product.get("category") or product.get("categoria") or "Outros"),
            "subcategoria": str(product.get("subcategoria") or product.get("category") or product.get("categoria") or "Outros"),
        }

    text = normalize_text(
        " ".join(
            str(product.get(key) or "")
            for key in ("name", "description", "descricaoCurta", "category", "subcategoria", "source")
        )
    )
    riding_markers = (
        "sela",
        "selaria",
        "cabecada",
        "cabresto",
        "peitoral",
        "redea",
        "freio",
        "estribo",
        "caneleira",
        "boots horse",
        "cavalgada",
        "cavalo",
        "mangalarga",
        "equitacao",
    )
    country_fashion = (
        "cinto country",
        "chapeu country",
        "camisa country",
        "botina",
        "bota country",
        "bota texana",
        "texana",
        "rodeo",
        "cowboy",
    )
    country_fashion_terms = ("camisa", "bota", "botina", "cinto", "chapeu", "chapéu", "fivela", "kit")
    prime_fashion = (
        "catalogo moda feminina",
        "moda feminina",
        "vestido",
        "blusa",
        "camisa polo",
        "camisa feminina",
        "regata",
        "jaqueta feminina",
        "calca feminina",
        "saia",
        "short feminino",
        "bolsa",
        "look",
        "plus size",
        "moda casual",
    )
    is_country_fashion = any(marker in text for marker in country_fashion) or (
        "country" in text and any(term in text for term in country_fashion_terms)
    )
    if any(marker in text for marker in riding_markers) and not is_country_fashion:
        return {
            "storeId": "impacto-montaria",
            "category": "Montaria",
            "subcategoria": "Selaria e cavalgada",
        }
    if is_country_fashion or any(marker in text for marker in prime_fashion):
        return {
            "storeId": "grife-prime",
            "category": "Moda e Acessorios",
            "subcategoria": "Country premium" if is_country_fashion else "Moda premium",
        }
    return classify_product(
        str(product.get("name") or ""),
        str(product.get("description") or product.get("descricaoCurta") or ""),
        str(product.get("category") or product.get("categoria") or ""),
    )


def image_destination(root: Path, product: dict[str, Any]) -> tuple[str, Path]:
    current = product_image(product).replace("\\", "/").lstrip("/")
    if current.startswith("public/images/anuncios/"):
        return current, root / current
    filename = f"{slugify(str(product.get('name') or product.get('id') or 'produto'))}-{str(product.get('id') or 'produto')[-8:]}.webp"
    relative = f"public/images/anuncios/{filename}"
    return relative, root / relative


def validate_product(product: dict[str, Any], root: Path, apply: bool) -> dict[str, Any]:
    product_id = str(product.get("id") or "")
    name = str(product.get("name") or "")
    link = purchase_link(product)
    image = product_image(product)
    result: dict[str, Any] = {
        "id": product_id,
        "name": name,
        "storeId": product.get("storeId"),
        "statusBefore": product.get("status"),
        "action": "ignored",
        "link": link,
        "issues": [],
    }
    if not is_active(product):
        return result

    if not link or not link_is_direct_product(link):
        result["action"] = "review"
        result["issues"].append("link ausente ou nao direto")
        if apply:
            mark_review(product, "link ausente ou nao direto")
        return result

    if not image or image_is_placeholder(image) or not image_exists(root, image):
        result["action"] = "review"
        result["issues"].append("imagem local ausente")
        if apply:
            mark_review(product, "imagem local ausente")
        return result

    if is_external_store(product):
        result["action"] = "kept_external_store"
        return result

    check = check_link(link, expected_title=name).as_dict()
    checked_title = clean_title(str(check.get("title") or ""))
    match = title_similarity(name, checked_title)
    result["online"] = {
        "ok": check.get("ok"),
        "statusCode": check.get("statusCode"),
        "title": checked_title,
        "image": check.get("image"),
        "finalUrl": check.get("finalUrl"),
        "error": check.get("error"),
        "match": match,
    }

    generic_title = normalize_text(checked_title) in {"amazon com br", "mercado livre", "mercadolivre"}
    if check.get("ok") and checked_title and not generic_title and not match["safe"]:
        result["action"] = "review"
        result["issues"].append("titulo do link diverge do produto")
        if apply:
            mark_review(product, "foto/link divergente: titulo do link nao corresponde ao produto")
            product["auditoriaPublicacao"] = {
                "checkedAt": today_iso(),
                "status": "revisao_manual",
                "reason": "titulo do link diverge do produto",
                "resolvedTitle": checked_title,
                "resolvedImage": check.get("image") or "",
                "finalUrl": check.get("finalUrl") or "",
                "match": match,
            }
        return result

    if check.get("ok") and match["safe"] and check.get("image"):
        result["action"] = "image_updated" if apply else "would_update_image"
        if apply:
            relative, destination = image_destination(root, product)
            try:
                optimize_image_from_url(str(check["image"]), destination)
                product["image"] = relative
                product["imagemPrincipal"] = relative
                product["fotoPrincipal"] = relative
                product["galeria"] = [relative]
                product["statusImagem"] = "imagem atualizada pelo link original"
                product["linkStatus"] = "link confirmado"
                product["auditoriaPublicacao"] = {
                    "checkedAt": today_iso(),
                    "status": "confirmado",
                    "resolvedTitle": checked_title,
                    "resolvedImage": check.get("image") or "",
                    "finalUrl": check.get("finalUrl") or "",
                    "match": match,
                }
            except Exception as error:  # noqa: BLE001
                result["action"] = "image_update_failed"
                result["issues"].append(str(error))
                append_pending(product, f"falha ao atualizar imagem: {error}")
        return result

    previous = product.get("validacaoOnline") if isinstance(product.get("validacaoOnline"), dict) else {}
    if previous.get("ok") and image_exists(root, image):
        result["action"] = "kept_previous_validation"
        return result

    result["action"] = "needs_manual_confirmation"
    result["issues"].append(check.get("error") or "link nao retornou produto confirmavel")
    if apply:
        product["auditoriaPublicacao"] = {
            "checkedAt": today_iso(),
            "status": "necessita_conferencia",
            "reason": check.get("error") or "link nao retornou produto confirmavel",
            "resolvedTitle": checked_title,
            "resolvedImage": check.get("image") or "",
            "finalUrl": check.get("finalUrl") or "",
            "match": match,
        }
        append_pending(product, "necessita conferencia manual de foto/link")
    return result


def mark_review(product: dict[str, Any], reason: str) -> None:
    product["status"] = "revisao_manual"
    product["aprovadoParaPublicacao"] = False
    product["badge"] = "Revisar"
    product["linkStatus"] = "revisao manual"
    product["statusImagem"] = "foto/link precisa conferencia"
    append_pending(product, reason)


def valid_for_rotation(root: Path, product: dict[str, Any]) -> bool:
    link = purchase_link(product)
    image = product_image(product)
    return (
        is_active(product)
        and link.startswith("http")
        and bool(image)
        and not image_is_placeholder(image)
        and image_exists(root, image)
    )


def product_label(product: dict[str, Any]) -> str:
    if product.get("buttonLabel"):
        return str(product["buttonLabel"])
    source = str(product.get("source") or product.get("origem") or "")
    if "Amazon" in source:
        return "Comprar na Amazon"
    if "Mercado Livre" in source:
        return "Comprar no Mercado Livre"
    if product.get("actionType") == "external-store":
        return "Abrir loja"
    return "Ver oferta"


def short_description(product: dict[str, Any], store_name: str) -> str:
    price = str(product.get("price") or product.get("preco") or "Consulte o valor").strip()
    category = str(product.get("category") or product.get("categoria") or store_name).strip()
    return f"{category} em {store_name}. Valor: {price}. Link preservado da loja parceira."


def build_rotation(root: Path, products: list[dict[str, Any]], stores: list[dict[str, Any]]) -> dict[str, Any]:
    store_names = {
        store.get("id"): store.get("commercialName") or store.get("name") or store.get("id")
        for store in stores
    }
    active = [product for product in products if valid_for_rotation(root, product)]
    active.sort(key=lambda product: (str(product.get("storeId") or ""), str(product.get("name") or "")))

    banners: list[dict[str, Any]] = []
    seen_store: set[str] = set()
    for product in active:
        store_id = str(product.get("storeId") or "")
        if store_id in seen_store:
            continue
        seen_store.add(store_id)
        banners.append(rotation_item(product, store_names, prefix="banner", order=len(banners) + 1))

    ads = [
        rotation_item(product, store_names, prefix="ad", order=index + 1)
        for index, product in enumerate(active)
    ]
    return {
        "settings": {
            "bannerRotationMs": 6500,
            "adRotationMs": 5200,
        },
        "banners": banners,
        "ads": ads,
    }


def rotation_item(product: dict[str, Any], store_names: dict[str, str], prefix: str, order: int) -> dict[str, Any]:
    store_name = str(store_names.get(product.get("storeId"), product.get("storeId") or "Impacto 360"))
    item = {
        "id": f"{prefix}-{product.get('id')}",
        "image": product_image(product).replace("\\", "/").lstrip("/"),
        "title": str(product.get("name") or "Oferta selecionada")[:120],
        "description": short_description(product, store_name)[:220],
        "link": purchase_link(product),
        "active": True,
    }
    if prefix == "banner":
        item["order"] = order
    else:
        item["buttonLabel"] = product_label(product)
        item["startDate"] = "2026-07-08"
        item["endDate"] = ""
        item["priority"] = order
    return item


def organize_products(products: list[dict[str, Any]]) -> list[dict[str, Any]]:
    changes: list[dict[str, Any]] = []
    for product in products:
        before = {
            "storeId": product.get("storeId"),
            "category": product.get("category"),
            "subcategoria": product.get("subcategoria"),
        }
        classified = classify_for_store(product)
        if before["storeId"] != classified["storeId"]:
            changes.append(
                {
                    "id": product.get("id"),
                    "name": product.get("name"),
                    "from": before["storeId"],
                    "to": classified["storeId"],
                }
            )
        product["storeId"] = classified["storeId"]
        product["category"] = classified["category"]
        product["categoria"] = classified["category"]
        product["subcategoria"] = classified["subcategoria"]
    return changes


def sync_package(root: Path, products: list[dict[str, Any]]) -> dict[str, int]:
    package = root / "pacote-github-pages-pronto"
    data_files = [
        "dados/products.json",
        "dados/stores.json",
        "dados/banners-anuncios.json",
        "dados/relatorio-revisao-publicacoes-2026-07-08.json",
        "dados/relatorio-auditoria-anuncios.json",
        "dados/relatorio-auditoria-anuncios.md",
    ]
    copied_data = 0
    for relative in data_files:
        source = root / relative
        if source.exists():
            target = package / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, target)
            copied_data += 1
    copied_images = 0
    for product in products:
        image = product_image(product).replace("\\", "/").lstrip("/")
        if not image.startswith("public/images/anuncios/"):
            continue
        source = root / image
        if not source.exists():
            continue
        target = package / image
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)
        copied_images += 1
    return {"dataFiles": copied_data, "images": copied_images}


def write_markdown_report(root: Path, report: dict[str, Any]) -> None:
    output = Path(r"C:\Users\PMNB\Documents\Codex\2026-07-01\atue-como-desenvolvedor-s-nior-e-2\outputs")
    output.mkdir(parents=True, exist_ok=True)
    lines = [
        "# Relatorio de revisao das publicacoes - 2026-07-08",
        "",
        f"Branch: `{report['branch']}`",
        f"Backup: `{report['backup']}`",
        "",
        "## Resumo",
        "",
        f"- Produtos analisados: {report['totals']['products']}",
        f"- Produtos ativos antes: {report['totals']['activeBefore']}",
        f"- Produtos ativos depois: {report['totals']['activeAfter']}",
        f"- Fotos atualizadas pelo link: {report['totals']['imagesUpdated']}",
        f"- Publicacoes retiradas da vitrine ativa por divergencia forte: {report['totals']['movedToReview']}",
        f"- Produtos com conferencia manual registrada: {report['totals']['manualConfirmation']}",
        f"- Lojas criadas/atualizadas: {', '.join(store['id'] for store in NEW_STORES)}",
        f"- Itens no rodizio da tela inicial: {report['rotation']['ads']} anuncios e {report['rotation']['banners']} banners.",
        "",
        "## Reorganizacao por loja",
        "",
    ]
    for store_id, count in report["storeDistributionAfter"].items():
        lines.append(f"- {store_id}: {count} produtos ativos")
    lines.extend(["", "## Publicacoes retiradas da vitrine ativa", ""])
    for item in report["reviewedProducts"][:120]:
        lines.append(f"- {item.get('name')} | {item.get('id')} | {', '.join(item.get('issues') or [])}")
    if len(report["reviewedProducts"]) > 120:
        lines.append(f"- ... mais {len(report['reviewedProducts']) - 120} itens no JSON detalhado.")
    lines.extend(["", "## Observacoes", ""])
    lines.append("- Produtos nao foram apagados definitivamente; divergentes foram movidos para revisao manual.")
    lines.append("- O rodizio foi gerado somente com produtos ativos, imagem local existente e link HTTP valido.")
    lines.append("- O pacote `pacote-github-pages-pronto` foi sincronizado com os dados principais.")
    (output / "relatorio-revisao-publicacoes-2026-07-08.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Revisa publicacoes, lojas e rodizio do Shopping Impacto 360.")
    parser.add_argument("--root", type=Path, default=Path.cwd())
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--workers", type=int, default=8)
    parser.add_argument("--skip-online", action="store_true")
    args = parser.parse_args()

    root = args.root.resolve()
    products_path = root / "dados" / "products.json"
    stores_path = root / "dados" / "stores.json"
    banners_path = root / "dados" / "banners-anuncios.json"
    products: list[dict[str, Any]] = read_json(products_path)
    stores: list[dict[str, Any]] = read_json(stores_path)

    active_before = [product for product in products if is_active(product)]
    store_info = ensure_stores(stores)
    store_changes = organize_products(products)

    validation_results: list[dict[str, Any]] = []
    if args.skip_online:
        validation_results = [
            {"id": product.get("id"), "name": product.get("name"), "action": "skipped_online"}
            for product in active_before
        ]
    else:
        with ThreadPoolExecutor(max_workers=max(1, args.workers)) as executor:
            futures = {
                executor.submit(validate_product, product, root, args.apply): product
                for product in active_before
            }
            for future in as_completed(futures):
                validation_results.append(future.result())

    if args.apply:
        rotation = build_rotation(root, products, stores)
        write_json(products_path, products)
        write_json(stores_path, stores)
        write_json(banners_path, rotation)
    else:
        rotation = build_rotation(root, products, stores)

    active_after = [product for product in products if is_active(product)]
    action_counts = Counter(str(result.get("action")) for result in validation_results)
    reviewed = [
        result
        for result in validation_results
        if result.get("action") == "review"
    ]
    report = {
        "generatedAt": datetime.now().isoformat(timespec="seconds"),
        "date": today_iso(),
        "applied": args.apply,
        "branch": "codex/revisao-publicacoes-lojas-20260708",
        "backup": str(root / "backups" / "2026-07-08-analise-publicacoes-pre-alteracao"),
        "totals": {
            "products": len(products),
            "activeBefore": len(active_before),
            "activeAfter": len(active_after),
            "imagesUpdated": action_counts.get("image_updated", 0),
            "movedToReview": action_counts.get("review", 0),
            "manualConfirmation": action_counts.get("needs_manual_confirmation", 0),
            "keptPreviousValidation": action_counts.get("kept_previous_validation", 0),
        },
        "stores": store_info,
        "storeChanges": store_changes,
        "storeDistributionAfter": dict(Counter(str(product.get("storeId")) for product in active_after)),
        "actionCounts": dict(action_counts),
        "reviewedProducts": reviewed,
        "manualConfirmationProducts": [
            result for result in validation_results if result.get("action") == "needs_manual_confirmation"
        ],
        "rotation": {
            "banners": len(rotation.get("banners", [])),
            "ads": len(rotation.get("ads", [])),
        },
        "validationResults": validation_results,
    }

    if args.apply:
        write_json(root / "dados" / "relatorio-revisao-publicacoes-2026-07-08.json", report)
        sync = sync_package(root, products)
        report["sync"] = sync
        write_json(root / "dados" / "relatorio-revisao-publicacoes-2026-07-08.json", report)
        sync_package(root, products)
        write_markdown_report(root, report)
    else:
        write_json(root / "dados" / "preview-revisao-publicacoes-2026-07-08.json", report)

    print(
        json.dumps(
            {
                "applied": args.apply,
                "products": len(products),
                "activeBefore": len(active_before),
                "activeAfter": len(active_after),
                "actionCounts": dict(action_counts),
                "storeChanges": len(store_changes),
                "rotation": report["rotation"],
            },
            ensure_ascii=False,
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
