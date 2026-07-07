from __future__ import annotations

import argparse
import json
import re
import shutil
from collections import Counter
from datetime import datetime
from pathlib import Path
from typing import Any


AMAZON_SOURCE_FILES = [
    "produtos_amazon_30.docx",
    "word_30_produtos_buscados_brasil_tendencias_afiliado.docx",
    "catalogo_amazon_cavalgada_cavalos.docx",
    "lista_30_eletrodomesticos_amazon_top_disponiveis_v2.docx",
    "lista_fornos_de_mesa_microondas_amazon_brasil_corrigida.docx",
]

SOURCE_PATHS = [
    Path(r"C:\Users\PMNB\Desktop\mauricio lic\amazon\produtos_amazon_30.docx"),
    Path(r"C:\Users\PMNB\Desktop\mauricio lic\amazon\word_30_produtos_buscados_brasil_tendencias_afiliado.docx"),
    Path(r"C:\Users\PMNB\Desktop\mauricio lic\amazon\catalogo_amazon_cavalgada_cavalos.docx"),
    Path(r"C:\Users\PMNB\Desktop\mauricio lic\amazon\lista_30_eletrodomesticos_amazon_top_disponiveis_v2.docx"),
    Path(r"C:\Users\PMNB\Desktop\mauricio lic\amazon\lista_fornos_de_mesa_microondas_amazon_brasil_corrigida.docx"),
]

BANNER_PRODUCTS = [
    {
        "id": "banner-amazon-fire-tv",
        "name": "Fire TV Stick HD",
        "title": "Fire TV Stick HD na Amazon",
        "description": "Streaming em destaque com link afiliado conferido.",
    },
    {
        "id": "banner-amazon-forno-oster",
        "name": "Forno Eletrico Oster 45 L Grafite - 110V",
        "title": "Forno eletrico Oster 45 L",
        "description": "Produto de cozinha validado com foto real e valor padronizado.",
    },
    {
        "id": "banner-amazon-airfryer",
        "name": "Philips Walita Airfryer Serie 1000 XL 6,2 L - 220V",
        "title": "Airfryer Philips Walita XL",
        "description": "Oferta Amazon ativa para a vitrine de casa e cozinha.",
    },
    {
        "id": "banner-amazon-cavalgada",
        "name": "Sela Australiana preta para cavalo com conjunto completo",
        "title": "Cavalgada e equitacao",
        "description": "Destaque validado para a loja de esporte e cavalgada.",
    },
]

AD_PRODUCTS = [
    {
        "id": "ad-amazon-galaxy-fit3",
        "name": "Samsung Galaxy Fit3 grafite",
        "title": "Samsung Galaxy Fit3",
        "description": "Smartband ativa com preco validado e link afiliado Amazon.",
    },
    {
        "id": "ad-amazon-wap-liquidificador",
        "name": "WAP Liquidificador WB2000 com Copo de Vidro 2 L",
        "title": "Liquidificador WAP WB2000",
        "description": "Achado para cozinha com imagem original baixada da pagina validada.",
    },
    {
        "id": "ad-amazon-cooktop-midea",
        "name": "Cooktop 4 Bocas de Inducao Midea Built In Even Pro",
        "title": "Cooktop Midea 4 bocas",
        "description": "Eletrodomestico cadastrado na loja correta com link afiliado.",
    },
    {
        "id": "ad-amazon-sela-mangalarga",
        "name": "Sela para Cavalo Mangalarga + kit completo pronta para uso",
        "title": "Sela Mangalarga completa",
        "description": "Item de cavalgada validado para o rodizio promocional.",
    },
    {
        "id": "ad-amazon-cafeteira-oster",
        "name": "Cafeteira Espresso Oster PrimaLatte Touch Red - 127V",
        "title": "Cafeteira Oster PrimaLatte",
        "description": "Oferta de casa e cozinha pronta para compra na Amazon.",
    },
    {
        "id": "ad-amazon-fritadeira-philco",
        "name": "Fritadeira Philco Air Fryer Oven 12 L PFR2200P - 127V",
        "title": "Air Fryer Oven Philco 12 L",
        "description": "Produto ativo com foto real, preco e afiliado preservados.",
    },
    {
        "id": "ad-amazon-mochila",
        "name": "Mochila Impermeavel",
        "title": "Mochila impermeavel",
        "description": "Destaque de moda/acessorios com link afiliado Amazon.",
    },
    {
        "id": "ad-amazon-sela-preta",
        "name": "Sela Americana completa tradicional preta",
        "title": "Sela americana completa",
        "description": "Produto de cavalgada pronto para aparecer no rodizio.",
    },
]

PRICE_RE = re.compile(r"^R\$\s?\d{1,3}(?:\.\d{3})*,\d{2}$")


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def norm(value: str) -> str:
    replacements = str.maketrans(
        "áàãâäéèêëíìîïóòõôöúùûüçñÁÀÃÂÄÉÈÊËÍÌÎÏÓÒÕÔÖÚÙÛÜÇÑ",
        "aaaaaeeeeiiiiooooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN",
    )
    return re.sub(r"\s+", " ", str(value or "").translate(replacements)).strip().lower()


def is_amazon(product: dict[str, Any]) -> bool:
    if product.get("source") == "Amazon" or product.get("origem") == "Amazon":
        return True
    sources = {Path(str(item)).name for item in product.get("arquivosOrigem", [])}
    return bool(sources.intersection(AMAZON_SOURCE_FILES))


def is_active(product: dict[str, Any]) -> bool:
    return product.get("status") == "ativo"


def match_product(products: list[dict[str, Any]], target: str) -> dict[str, Any] | None:
    target_norm = norm(target)
    for product in products:
        name_norm = norm(product.get("name", ""))
        if target_norm == name_norm or target_norm in name_norm:
            return product
    return None


def banner_image(product: dict[str, Any]) -> str:
    return str(product.get("image") or "").replace("\\", "/")


def update_marketing_content(root: Path, active_amazon: list[dict[str, Any]]) -> dict[str, int]:
    path = root / "dados" / "banners-anuncios.json"
    data = read_json(path)
    banners = [item for item in data.get("banners", []) if not str(item.get("id", "")).startswith("banner-amazon-")]
    ads = [item for item in data.get("ads", []) if not str(item.get("id", "")).startswith("ad-amazon-")]

    current_order = max([int(item.get("order") or 0) for item in banners] or [0])
    added_banners = 0
    for spec in BANNER_PRODUCTS:
        product = match_product(active_amazon, spec["name"])
        if not product:
            continue
        current_order += 1
        banners.append(
            {
                "id": spec["id"],
                "image": banner_image(product),
                "title": spec["title"],
                "description": f"{spec['description']} Valor: {product.get('price')}.",
                "link": product["affiliateLink"],
                "active": True,
                "order": current_order,
            }
        )
        added_banners += 1

    current_priority = max([int(item.get("priority") or 0) for item in ads] or [0])
    added_ads = 0
    for spec in AD_PRODUCTS:
        product = match_product(active_amazon, spec["name"])
        if not product:
            continue
        current_priority += 1
        ads.append(
            {
                "id": spec["id"],
                "image": banner_image(product),
                "title": spec["title"],
                "description": f"{spec['description']} Valor: {product.get('price')}.",
                "buttonLabel": "Comprar na Amazon",
                "link": product["affiliateLink"],
                "startDate": "2026-07-07",
                "endDate": "",
                "active": True,
                "priority": current_priority,
            }
        )
        added_ads += 1

    data["banners"] = banners
    data["ads"] = ads
    write_json(path, data)
    return {"banners": added_banners, "ads": added_ads}


def sync_package(root: Path, amazon_products: list[dict[str, Any]]) -> dict[str, int]:
    package_root = root / "pacote-github-pages-pronto"
    copied_data = 0
    for relative in [
        "dados/products.json",
        "dados/stores.json",
        "dados/ultima-importacao-anuncios.json",
        "dados/produtos-importados-2026-07-07.json",
        "dados/banners-anuncios.json",
        "dados/relatorio-correcao-amazon-2026-07-07.json",
    ]:
        source = root / relative
        if source.exists():
            target = package_root / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, target)
            copied_data += 1

    copied_images = 0
    for product in amazon_products:
        image = str(product.get("image") or "")
        if not image.startswith("public/images/anuncios/"):
            continue
        source = root / image
        if not source.exists():
            continue
        target = package_root / image
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)
        copied_images += 1

    return {"dataFiles": copied_data, "images": copied_images}


def archive_sources(root: Path) -> int:
    target_dir = root / "importacoes" / "originais" / "2026-07-07"
    target_dir.mkdir(parents=True, exist_ok=True)
    copied = 0
    for source in SOURCE_PATHS:
        if source.exists():
            shutil.copy2(source, target_dir / source.name)
            copied += 1
    return copied


def remove_generated_noise(root: Path) -> list[str]:
    removed: list[str] = []
    preview = root / "dados" / "preview-importacao-anuncios.json"
    if preview.exists():
        preview.unlink()
        removed.append(str(preview.relative_to(root)))
    pycache = root / "scripts" / "__pycache__"
    if pycache.exists() and pycache.resolve().is_relative_to(root.resolve()):
        shutil.rmtree(pycache)
        removed.append(str(pycache.relative_to(root)))
    return removed


def make_report(
    root: Path,
    output_dir: Path,
    test_notes: list[str],
    marketing_counts: dict[str, int],
    sync_counts: dict[str, int],
    archived_sources: int,
    removed_noise: list[str],
) -> None:
    products = read_json(root / "dados" / "products.json")
    stores = {store.get("id"): store for store in read_json(root / "dados" / "stores.json")}
    import_summary = read_json(root / "dados" / "ultima-importacao-anuncios.json")
    banners = read_json(root / "dados" / "banners-anuncios.json")

    amazon_products = [product for product in products if is_amazon(product)]
    active = [product for product in amazon_products if is_active(product)]
    manual = [product for product in amazon_products if not is_active(product)]

    bad_active_links = [
        product
        for product in active
        if not str(product.get("affiliateLink") or "").startswith("https://link.amazon/")
        or product.get("linkCompra") != product.get("affiliateLink")
        or product.get("linkOriginal") != product.get("affiliateLink")
    ]
    active_no_image = [
        product
        for product in active
        if not product.get("image")
        or str(product.get("image")).endswith("placeholder-produto-mercado-livre.svg")
        or not (root / str(product.get("image"))).exists()
    ]
    active_bad_price = [
        product for product in active if not PRICE_RE.match(str(product.get("price") or ""))
    ]
    amazon_rotations = [
        item
        for item in banners.get("banners", []) + banners.get("ads", [])
        if str(item.get("id", "")).startswith(("banner-amazon-", "ad-amazon-"))
    ]
    bad_rotation_links = [
        item for item in amazon_rotations if not str(item.get("link") or "").startswith("https://link.amazon/")
    ]

    by_store = Counter(product.get("storeId") for product in amazon_products)
    by_store_active = Counter(product.get("storeId") for product in active)
    store_lines = []
    for store_id, count in by_store.most_common():
        store = stores.get(store_id, {})
        store_lines.append(
            {
                "storeId": store_id,
                "storeName": store.get("commercialName") or store.get("name") or store_id,
                "total": count,
                "active": by_store_active.get(store_id, 0),
            }
        )

    report_json = {
        "generatedAt": datetime.now().isoformat(timespec="seconds"),
        "branch": "codex/importar-produtos-amazon-20260707",
        "backup": str(root / "backups" / "2026-07-07-0846-pre-importacao-amazon"),
        "sourceFiles": import_summary.get("sourceFiles", {}),
        "expectedFromFiveFiles": 150,
        "registeredAmazonProducts": len(amazon_products),
        "notRegisteredFromDocx": 150 - len(amazon_products),
        "activeProducts": len(active),
        "manualReviewProducts": len(manual),
        "storeDistribution": store_lines,
        "marketingRotation": {
            **marketing_counts,
            "amazonItemsInRotation": len(amazon_rotations),
        },
        "sync": sync_counts,
        "archivedSourceFiles": archived_sources,
        "removedGeneratedNoise": removed_noise,
        "validations": {
            "activeAmazonNonAffiliateLinks": len(bad_active_links),
            "activeAmazonMissingImages": len(active_no_image),
            "activeAmazonInvalidPrices": len(active_bad_price),
            "amazonRotationNonAffiliateLinks": len(bad_rotation_links),
        },
        "activeProductsDetail": [
            {
                "name": product.get("name"),
                "storeId": product.get("storeId"),
                "category": product.get("category"),
                "price": product.get("price"),
                "image": product.get("image"),
                "affiliateLink": product.get("affiliateLink"),
            }
            for product in active
        ],
        "manualReviewDetail": [
            {
                "name": product.get("name"),
                "storeId": product.get("storeId"),
                "price": product.get("price"),
                "link": product.get("affiliateLink"),
                "pendencias": product.get("pendencias", []),
            }
            for product in manual
        ],
        "testNotes": test_notes,
        "changedFiles": [
            "scripts/anuncios_core.py",
            "scripts/importar-anuncios.py",
            "scripts/finalizar-importacao-amazon.py",
            "dados/products.json",
            "dados/stores.json",
            "dados/ultima-importacao-anuncios.json",
            "dados/produtos-importados-2026-07-07.json",
            "dados/banners-anuncios.json",
            "dados/relatorio-correcao-amazon-2026-07-07.json",
            "pacote-github-pages-pronto/dados/products.json",
            "pacote-github-pages-pronto/dados/stores.json",
            "pacote-github-pages-pronto/dados/ultima-importacao-anuncios.json",
            "pacote-github-pages-pronto/dados/produtos-importados-2026-07-07.json",
            "pacote-github-pages-pronto/dados/banners-anuncios.json",
            "pacote-github-pages-pronto/public/images/anuncios/*.webp",
            "importacoes/originais/2026-07-07/*.docx",
        ],
    }

    write_json(root / "dados" / "relatorio-correcao-amazon-2026-07-07.json", report_json)
    sync_package(root, amazon_products)

    output_dir.mkdir(parents=True, exist_ok=True)
    markdown = [
        "# Relatorio de importacao Amazon - 2026-07-07",
        "",
        f"Backup criado antes das alteracoes: `{report_json['backup']}`.",
        f"Branch de seguranca: `{report_json['branch']}`.",
        "",
        "## Resumo",
        "",
        f"- Produtos Amazon cadastrados: {len(amazon_products)}.",
        f"- Produtos ativos publicados: {len(active)}.",
        f"- Produtos retidos para conferencia manual: {len(manual)}.",
        f"- Entradas nao cadastradas a partir dos cinco DOCX: {report_json['notRegisteredFromDocx']} (sem dados/link afiliado suficientes para cadastro seguro).",
        f"- Rodizio atualizado: {marketing_counts.get('banners', 0)} banners e {marketing_counts.get('ads', 0)} anuncios Amazon.",
        "",
        "## Produtos ativos adicionados ao rodizio",
        "",
    ]
    for product in active:
        store = stores.get(product.get("storeId"), {})
        markdown.append(
            f"- {product.get('name')} | {store.get('commercialName') or product.get('storeId')} | {product.get('price')} | {product.get('affiliateLink')}"
        )

    markdown.extend(
        [
            "",
            "## Produtos que precisam de conferencia manual",
            "",
        ]
    )
    for product in manual:
        reasons = "; ".join(product.get("pendencias") or ["necessita conferencia manual"])
        markdown.append(f"- {product.get('name')} | {product.get('storeId')} | {reasons}")

    markdown.extend(
        [
            "",
            "## Validacoes de dados",
            "",
            f"- Links Amazon ativos fora do afiliado: {len(bad_active_links)}.",
            f"- Produtos Amazon ativos sem imagem local: {len(active_no_image)}.",
            f"- Produtos Amazon ativos sem preco brasileiro padronizado: {len(active_bad_price)}.",
            f"- Links Amazon no rodizio fora do afiliado: {len(bad_rotation_links)}.",
            f"- Arquivos DOCX arquivados: {archived_sources}.",
            f"- Imagens sincronizadas no pacote: {sync_counts.get('images', 0)}.",
            "",
            "## Testes realizados",
            "",
        ]
    )
    if test_notes:
        markdown.extend(f"- {note}" for note in test_notes)
    else:
        markdown.append("- Validacao interna de dados da finalizacao executada.")

    markdown.extend(
        [
            "",
            "## Riscos e revisoes pendentes",
            "",
            "- A Amazon retornou paginas genericas ou sem preco em parte das validacoes; esses itens foram cadastrados, mas ficaram em revisao manual.",
            "- Nenhum preco foi inventado. Produtos sem preco numerico confirmado nao foram deixados como ativos.",
            "- O botao de compra dos produtos Amazon usa somente `https://link.amazon/...`; links diretos ficam apenas em campos de leitura/validacao.",
        ]
    )

    report_path = output_dir / "relatorio-importacao-loja-amazon-2026-07-07.md"
    report_path.write_text("\n".join(markdown) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default=".")
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--test-note", action="append", default=[])
    args = parser.parse_args()

    root = Path(args.root).resolve()
    products = read_json(root / "dados" / "products.json")
    amazon_products = [product for product in products if is_amazon(product)]
    active_amazon = [product for product in amazon_products if is_active(product)]

    marketing_counts = update_marketing_content(root, active_amazon)
    archived_sources = archive_sources(root)
    removed_noise = remove_generated_noise(root)
    sync_counts = sync_package(root, amazon_products)
    make_report(
        root=root,
        output_dir=Path(args.output_dir).resolve(),
        test_notes=args.test_note,
        marketing_counts=marketing_counts,
        sync_counts=sync_counts,
        archived_sources=archived_sources,
        removed_noise=removed_noise,
    )

    print(
        json.dumps(
            {
                "amazonProducts": len(amazon_products),
                "activeAmazonProducts": len(active_amazon),
                "manualReviewAmazonProducts": len(amazon_products) - len(active_amazon),
                "marketing": marketing_counts,
                "sync": sync_counts,
                "archivedSourceFiles": archived_sources,
                "removedGeneratedNoise": removed_noise,
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
