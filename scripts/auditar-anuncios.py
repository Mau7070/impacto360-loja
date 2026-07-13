from __future__ import annotations

import argparse
import re
from collections import defaultdict
from pathlib import Path
from typing import Any

from anuncios_core import (
    canonical_link,
    classify_product,
    image_exists,
    image_is_placeholder,
    link_is_direct_product,
    load_json,
    normalize_text,
    today_iso,
    write_json,
)


def purchase_link(product: dict[str, Any]) -> str:
    return str(
        product.get("linkCompra")
        or product.get("linkAfiliado")
        or product.get("affiliateLink")
        or product.get("linkComissionado")
        or product.get("linkPlataforma")
        or product.get("link_original_afiliado")
        or product.get("linkOriginal")
        or product.get("urlProduto")
        or product.get("url")
        or ""
    ).strip()


def product_image(product: dict[str, Any]) -> str:
    for field in (
        "fotoPrincipal",
        "imagemPrincipal",
        "imagem",
        "image",
        "imageUrl",
        "thumbnail",
        "foto",
        "productImage",
        "src",
    ):
        value = product.get(field)
        if value:
            return str(value).strip()
    for field in ("galeria", "fotosExtras", "images"):
        values = product.get(field)
        if isinstance(values, list):
            for value in values:
                if value:
                    return str(value).strip()
    return str(
        product.get("image")
        or product.get("imagemPrincipal")
        or product.get("imagem")
        or ""
    ).strip()


def is_active(product: dict[str, Any]) -> bool:
    return str(product.get("status", "")).lower() == "ativo"


def public_link_is_usable(link: str) -> bool:
    value = str(link or "").strip()
    if not value or value == "COLOCAR_LINK_AQUI" or value.startswith("COLOCAR_"):
        return False
    lowered = value.lower()
    if re.search(r"placeholder|sem[-_ ]?(foto|imagem)|url_|link_", lowered):
        return False
    if "mercadolivre.com.br/loja/" in lowered or "lista.mercadolivre.com.br" in lowered:
        return False
    return value.lower().startswith(("http://", "https://"))


def is_public_offer(product: dict[str, Any]) -> bool:
    status = normalize_text(
        next(
            (
                str(product.get(field, "")).strip()
                for field in ("status", "statusPublicacao", "auditoriaPublicacao")
                if str(product.get(field, "")).strip()
            ),
            "",
        )
    )
    blocked = any(
        marker in status
        for marker in (
            "rascunho",
            "duplicado",
            "inativo",
            "excluido",
            "removido",
            "oculto",
            "bloqueado",
        )
    )
    return not blocked and public_link_is_usable(purchase_link(product))


def quality_score(root: Path, product: dict[str, Any]) -> int:
    score = 0
    if purchase_link(product):
        score += 5
    image = product_image(product)
    if image and not image_is_placeholder(image) and image_exists(root, image):
        score += 5
    if str(product.get("description") or product.get("descricaoCurta") or "").strip():
        score += 2
    if str(product.get("price") or product.get("preco") or "").strip():
        score += 1
    if is_active(product):
        score += 1
    return score


def audit(root: Path, apply_fixes: bool = False) -> dict[str, Any]:
    products_path = root / "dados" / "products.json"
    stores_path = root / "dados" / "stores.json"
    products: list[dict[str, Any]] = load_json(products_path, [])
    stores: list[dict[str, Any]] = load_json(stores_path, [])
    store_ids = {str(store.get("id")) for store in stores}

    issues: dict[str, list[dict[str, Any]]] = defaultdict(list)
    links: dict[str, list[dict[str, Any]]] = defaultdict(list)
    titles: dict[str, list[dict[str, Any]]] = defaultdict(list)
    images: dict[str, list[dict[str, Any]]] = defaultdict(list)
    corrected_store = 0
    inactivated = 0
    duplicate_inactivated = 0

    for product in products:
        product_id = str(product.get("id", ""))
        title = str(product.get("name") or product.get("nome") or "").strip()
        description = str(
            product.get("description")
            or product.get("descricaoCurta")
            or product.get("descricao")
            or ""
        ).strip()
        link = purchase_link(product)
        image = product_image(product)
        store_id = str(product.get("storeId", "")).strip()
        price = str(product.get("price") or product.get("preco") or "").strip()
        status = str(product.get("status", "")).lower()
        summary = {"id": product_id, "title": title, "storeId": store_id, "status": status}

        if not title or len(normalize_text(title).split()) < 2:
            issues["titulo_generico_ou_incompleto"].append(summary)
        description_is_generic = (
            not description
            or any(
                marker in normalize_text(description)
                for marker in (
                    "informacao pendente",
                    "descricao pendente",
                    "revisar antes de publicar",
                )
            )
        )
        if description_is_generic:
            issues["sem_descricao_ou_descricao_generica"].append(summary)
            if apply_fixes and title and link_is_direct_product(link):
                description = (
                    f"{title} selecionado para a vitrine do Shopping Impacto360. "
                    "Confira preço, variações, frete, garantia e condições diretamente no anúncio."
                )
                product["description"] = description
                product["descricaoCurta"] = description
                product["descricaoDetalhada"] = description
        if not price:
            issues["sem_preco"].append(summary)
        if not link:
            issues["sem_link"].append(summary)
        elif not link_is_direct_product(link):
            issues["link_nao_direto_ou_placeholder"].append({**summary, "link": link})
        else:
            links[canonical_link(link)].append(product)
        if not image or image_is_placeholder(image):
            issues["sem_foto"].append(summary)
        elif not image_exists(root, image):
            issues["foto_arquivo_inexistente"].append({**summary, "image": image})
        else:
            images[image.lower()].append(product)
        if store_id not in store_ids:
            issues["loja_inexistente"].append(summary)
        predicted = classify_product(title, description, str(product.get("category") or ""))
        if (
            predicted["storeId"] != "impacto-ofertas"
            and store_id
            and predicted["storeId"] != store_id
        ):
            issues["loja_categoria_incorreta"].append(
                {**summary, "lojaSugerida": predicted["storeId"]}
            )
            if apply_fixes:
                product["storeId"] = predicted["storeId"]
                product["category"] = predicted["category"]
                product["categoria"] = predicted["category"]
                product["subcategoria"] = predicted["subcategoria"]
                corrected_store += 1
        if not product.get("actionType") and not product.get("buttonLabel"):
            issues["sem_botao_compra"].append(summary)
            if apply_fixes and link:
                product["actionType"] = "buy"
                product["buttonLabel"] = "Comprar"
        if apply_fixes and is_active(product):
            badge = normalize_text(str(product.get("badge") or ""))
            if badge in {"", "revisar", "revisao", "pendente", "rascunho"}:
                product["badge"] = "Oferta verificada"
        if is_active(product) and (
            not link_is_direct_product(link)
            or not image
            or image_is_placeholder(image)
            or not image_exists(root, image)
        ):
            issues["ativo_reprovado"].append(summary)
            if apply_fixes:
                product["status"] = "revisao_manual"
                product["aprovadoParaPublicacao"] = False
                inactivated += 1
        title_key = normalize_text(title)
        if title_key and link_is_direct_product(link):
            titles[title_key].append(product)

    duplicate_groups: list[dict[str, Any]] = []
    seen_groups: set[tuple[str, ...]] = set()
    for reason, groups in (("link", links), ("titulo", titles)):
        for key, grouped in groups.items():
            if not key or len(grouped) < 2:
                continue
            ids = tuple(sorted(str(product.get("id")) for product in grouped))
            if ids in seen_groups:
                continue
            seen_groups.add(ids)
            ordered = sorted(grouped, key=lambda product: quality_score(root, product), reverse=True)
            duplicate_groups.append(
                {
                    "reason": reason,
                    "key": key,
                    "keep": ordered[0].get("id"),
                    "duplicates": [product.get("id") for product in ordered[1:]],
                }
            )
            if apply_fixes:
                for duplicate in ordered[1:]:
                    if duplicate.get("status") != "duplicado":
                        duplicate["status"] = "duplicado"
                        duplicate["aprovadoParaPublicacao"] = False
                        duplicate["duplicadoDe"] = ordered[0].get("id")
                        duplicate_inactivated += 1

    image_conflicts = []
    for image, grouped in images.items():
        titles_in_group = {normalize_text(product.get("name") or "") for product in grouped}
        if len(grouped) > 1 and len(titles_in_group) > 1:
            image_conflicts.append(
                {
                    "image": image,
                    "products": [
                        {"id": product.get("id"), "title": product.get("name")}
                        for product in grouped
                    ],
                }
            )

    if apply_fixes:
        write_json(products_path, products)

    active_products = [product for product in products if is_active(product)]
    public_offers = [product for product in products if is_public_offer(product)]
    report = {
        "executedAt": today_iso(),
        "appliedSafeFixes": apply_fixes,
        "totals": {
            "products": len(products),
            "stores": len(stores),
            "active": len(active_products),
            "inactiveOrReview": len(products) - len(active_products),
            "publicOffers": len(public_offers),
            "pendingOrBlocked": len(products) - len(public_offers),
            "issues": sum(len(entries) for entries in issues.values()),
            "duplicateGroups": len(duplicate_groups),
            "imageConflicts": len(image_conflicts),
            "storesCorrected": corrected_store,
            "inactivatedForMissingData": inactivated,
            "duplicatesInactivated": duplicate_inactivated,
        },
        "issueCounts": {key: len(value) for key, value in sorted(issues.items())},
        "issues": dict(issues),
        "duplicates": duplicate_groups,
        "imageConflicts": image_conflicts,
        "acceptance": {
            "activeWithoutPhoto": sum(
                1
                for product in active_products
                if image_is_placeholder(product_image(product))
                or not image_exists(root, product_image(product))
            ),
            "activeWithoutLink": sum(
                1
                for product in active_products
                if not link_is_direct_product(purchase_link(product))
            ),
        },
    }
    return report


def write_markdown(path: Path, report: dict[str, Any]) -> None:
    totals = report["totals"]
    lines = [
        "# Relatório de auditoria de anúncios",
        "",
        f"Data: {report['executedAt']}",
        "",
        "## Resumo",
        "",
        f"- Anúncios analisados: {totals['products']}",
        f"- Anúncios ativos: {totals['active']}",
        f"- Inativos/revisão: {totals['inactiveOrReview']}",
        f"- Ofertas públicas por link válido: {totals['publicOffers']}",
        f"- Pendentes/bloqueados da vitrine: {totals['pendingOrBlocked']}",
        f"- Grupos duplicados: {totals['duplicateGroups']}",
        f"- Conflitos de imagem compartilhada: {totals['imageConflicts']}",
        "",
        "## Problemas encontrados",
        "",
    ]
    for key, count in report["issueCounts"].items():
        lines.append(f"- {key.replace('_', ' ')}: {count}")
    lines.extend(
        [
            "",
            "## Critérios de publicação",
            "",
            f"- Ativos sem foto válida: {report['acceptance']['activeWithoutPhoto']}",
            f"- Ativos sem link: {report['acceptance']['activeWithoutLink']}",
            "",
            "Os registros com dúvida de correspondência permanecem em revisão manual; nenhum dado foi apagado.",
            "",
        ]
    )
    path.write_text("\n".join(lines), encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Audita anúncios do Shopping Impacto360.")
    parser.add_argument("--root", type=Path, default=Path.cwd())
    parser.add_argument("--fix-safe", action="store_true")
    args = parser.parse_args()
    root = args.root.resolve()
    report = audit(root, apply_fixes=args.fix_safe)
    write_json(root / "dados" / "relatorio-auditoria-anuncios.json", report)
    write_markdown(root / "dados" / "relatorio-auditoria-anuncios.md", report)
    print(json_summary(report))
    return 0


def json_summary(report: dict[str, Any]) -> str:
    totals = report["totals"]
    return (
        f"Analisados: {totals['products']} | ativos: {totals['active']} | "
        f"publicos por link: {totals['publicOffers']} | "
        f"problemas: {totals['issues']} | duplicados: {totals['duplicateGroups']} | "
        f"ativos sem foto: {report['acceptance']['activeWithoutPhoto']} | "
        f"ativos sem link: {report['acceptance']['activeWithoutLink']}"
    )


if __name__ == "__main__":
    raise SystemExit(main())
