from __future__ import annotations

import argparse
import importlib.util
import json
import re
import shutil
import sys
from collections import Counter
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from docx import Document


ROOT = Path.cwd()
SCRIPTS_DIR = ROOT / "scripts"
sys.path.insert(0, str(SCRIPTS_DIR))

from anuncios_core import (  # noqa: E402
    canonical_link,
    check_link,
    classify_product,
    image_is_placeholder,
    link_is_direct_product,
    load_json,
    normalize_text,
    optimize_image_from_url,
    parse_brazilian_price,
    parse_rating,
    slugify,
    stable_product_id,
    title_similarity,
    today_iso,
    write_json,
)


IMPORTER_PATH = SCRIPTS_DIR / "importar-anuncios.py"
SPEC = importlib.util.spec_from_file_location("impacto_importar_anuncios", IMPORTER_PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f"Nao foi possivel carregar {IMPORTER_PATH}")
impacto_importer = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = impacto_importer
SPEC.loader.exec_module(impacto_importer)


ROTATION_GROUP = "catalogos-para-amanha-2026-07-13"
CATALOG_SOURCE = "catalogos-para-amanha"
PACKAGE_DIR = ROOT / "pacote-github-pages-pronto"


@dataclass
class CatalogRow:
    title: str
    affiliate_link: str
    direct_link: str
    source_file: str
    source_table: str
    source: str
    category: str = ""
    brand: str = ""
    price: str = "Preco no anuncio"
    notes: str = ""
    row_number: str = ""

    @property
    def key(self) -> str:
        return canonical_link(self.affiliate_link) or normalize_text(self.title)


def cell_urls(document: Document, cell: Any) -> list[str]:
    links = impacto_importer.cell_hyperlinks(document, cell)
    links.extend(re.findall(r"https?://[^\s<>]+", cell.text or ""))
    return list(dict.fromkeys(link.strip().rstrip(".,;)") for link in links if link.strip()))


def first_url(document: Document, cell: Any) -> str:
    urls = cell_urls(document, cell)
    return urls[0] if urls else ""


def header_map(row: Any) -> dict[str, int]:
    return {normalize_text(cell.text): index for index, cell in enumerate(row.cells)}


def marketplace_from_row(source_text: str, link: str) -> str:
    text = normalize_text(f"{source_text} {link}")
    if "amazon" in text or "link.amazon" in link.lower() or "amazon." in link.lower():
        return "Amazon"
    if "mercado livre" in text or "meli.la" in link.lower() or "mercadolivre" in link.lower():
        return "Mercado Livre"
    return impacto_importer.marketplace_from_link(link)


def button_label(source: str) -> str:
    if source == "Amazon":
        return "Comprar na Amazon"
    if source == "Mercado Livre":
        return "Comprar no Mercado Livre"
    return "Ver oferta"


def has_real_affiliate_link(value: str) -> bool:
    value = str(value or "").strip()
    if not re.match(r"https?://", value, flags=re.I):
        return False
    if re.search(r"cole aqui|colocar|placeholder|sem[-_ ]?link|link_de_afiliado", value, flags=re.I):
        return False
    return True


def parse_catalog(path: Path) -> list[CatalogRow]:
    document = Document(path)
    rows: list[CatalogRow] = []
    for table_index, table in enumerate(document.tables, start=1):
        if not table.rows:
            continue
        headers = header_map(table.rows[0])

        if "produto identificado nas imagens" in headers:
            title_i = headers["produto identificado nas imagens"]
            category_i = headers.get("categoria")
            direct_i = headers.get("link direto mercado livre")
            affiliate_i = headers.get("espaco para link de afiliado")
            note_i = headers.get("observacao")
            for row in table.rows[1:]:
                cells = row.cells
                if affiliate_i is None or direct_i is None or title_i >= len(cells):
                    continue
                title = cells[title_i].text.strip()
                if not title:
                    continue
                affiliate = first_url(document, cells[affiliate_i]) if affiliate_i < len(cells) else ""
                direct = first_url(document, cells[direct_i]) if direct_i < len(cells) else ""
                category = cells[category_i].text.strip() if category_i is not None and category_i < len(cells) else ""
                notes = cells[note_i].text.strip() if note_i is not None and note_i < len(cells) else ""
                rows.append(
                    CatalogRow(
                        title=title,
                        affiliate_link=affiliate,
                        direct_link=direct,
                        source_file=path.name,
                        source_table=f"Tabela {table_index}",
                        source="Mercado Livre",
                        category=category,
                        price=parse_brazilian_price(" ".join(cell.text for cell in cells)),
                        notes=notes,
                        row_number=cells[0].text.strip() if cells else "",
                    )
                )
            continue

        if "modelo" in headers and "link de afiliado" in headers:
            model_i = headers["modelo"]
            memory_i = headers.get("memoria")
            color_i = headers.get("cor")
            price_i = headers.get("preco a vista")
            reputation_i = headers.get("seguranca reputacao")
            direct_i = headers.get("link direto")
            affiliate_i = headers.get("link de afiliado")
            for row in table.rows[1:]:
                cells = row.cells
                if affiliate_i is None or direct_i is None or model_i >= len(cells):
                    continue
                title_parts = [cells[model_i].text.strip()]
                if memory_i is not None and memory_i < len(cells):
                    title_parts.append(cells[memory_i].text.strip())
                if color_i is not None and color_i < len(cells):
                    title_parts.append(cells[color_i].text.strip())
                title = " ".join(part for part in title_parts if part)
                if not title:
                    continue
                affiliate = first_url(document, cells[affiliate_i]) if affiliate_i < len(cells) else ""
                direct = first_url(document, cells[direct_i]) if direct_i < len(cells) else ""
                price = cells[price_i].text.strip() if price_i is not None and price_i < len(cells) else ""
                notes = cells[reputation_i].text.strip() if reputation_i is not None and reputation_i < len(cells) else ""
                rows.append(
                    CatalogRow(
                        title=title,
                        affiliate_link=affiliate,
                        direct_link=direct,
                        source_file=path.name,
                        source_table=f"Tabela {table_index}",
                        source="Mercado Livre",
                        category="Celulares",
                        brand="Apple",
                        price=parse_brazilian_price(price),
                        notes=notes,
                        row_number=cells[0].text.strip() if cells else "",
                    )
                )
            continue

        if "produto" in headers and "link de afiliado" in headers:
            store_i = headers.get("loja")
            title_i = headers["produto"]
            category_i = headers.get("categoria")
            brand_i = headers.get("marca")
            direct_i = headers.get("link direto")
            affiliate_i = headers.get("link de afiliado")
            note_i = headers.get("observacao")
            for row in table.rows[1:]:
                cells = row.cells
                if affiliate_i is None or direct_i is None or title_i >= len(cells):
                    continue
                title = cells[title_i].text.strip()
                if not title:
                    continue
                affiliate = first_url(document, cells[affiliate_i]) if affiliate_i < len(cells) else ""
                direct = first_url(document, cells[direct_i]) if direct_i < len(cells) else ""
                store_text = cells[store_i].text.strip() if store_i is not None and store_i < len(cells) else ""
                category = cells[category_i].text.strip() if category_i is not None and category_i < len(cells) else ""
                brand = cells[brand_i].text.strip() if brand_i is not None and brand_i < len(cells) else ""
                notes = cells[note_i].text.strip() if note_i is not None and note_i < len(cells) else ""
                rows.append(
                    CatalogRow(
                        title=title,
                        affiliate_link=affiliate,
                        direct_link=direct,
                        source_file=path.name,
                        source_table=f"Tabela {table_index}",
                        source=marketplace_from_row(store_text, affiliate or direct),
                        category=category,
                        brand=brand,
                        price=parse_brazilian_price(" ".join(cell.text for cell in cells)),
                        notes=notes,
                        row_number=cells[0].text.strip() if cells else "",
                    )
                )
    return rows


def link_title_is_safe(expected: str, checked: dict[str, Any]) -> bool:
    if not checked.get("ok"):
        return False
    checked_title = str(checked.get("title") or "")
    return bool(checked_title) and bool(title_similarity(expected, checked_title)["safe"])


def check_pair(row: CatalogRow) -> dict[str, Any]:
    affiliate_check = check_link(row.affiliate_link, row.title).as_dict()
    direct_check: dict[str, Any] = {}
    if row.direct_link and canonical_link(row.direct_link) != canonical_link(row.affiliate_link):
        direct_check = check_link(row.direct_link, row.title).as_dict()

    affiliate_safe = link_title_is_safe(row.title, affiliate_check)
    direct_safe = link_title_is_safe(row.title, direct_check) if direct_check else False
    image_url = ""
    if direct_safe and direct_check.get("image"):
        image_url = str(direct_check["image"])
    elif affiliate_safe and affiliate_check.get("image"):
        image_url = str(affiliate_check["image"])

    merged = dict(direct_check if direct_safe else affiliate_check)
    if image_url:
        merged["image"] = image_url
    if direct_check.get("price") and not merged.get("price"):
        merged["price"] = direct_check["price"]
    if affiliate_check.get("price") and not merged.get("price"):
        merged["price"] = affiliate_check["price"]
    merged["affiliateCheck"] = affiliate_check
    merged["directCheck"] = direct_check
    merged["affiliateSafe"] = affiliate_safe
    merged["directSafe"] = direct_safe
    merged["ok"] = bool(affiliate_safe and image_url)
    if not merged["ok"]:
        merged["error"] = merged.get("error") or "link afiliado nao confirmou produto e imagem com seguranca"
    return merged


def existing_maps(products: list[dict[str, Any]]) -> tuple[dict[str, dict[str, Any]], dict[str, dict[str, Any]]]:
    by_link: dict[str, dict[str, Any]] = {}
    by_title: dict[str, dict[str, Any]] = {}
    for product in products:
        link = canonical_link(
            product.get("affiliateLink")
            or product.get("linkCompra")
            or product.get("linkOriginal")
            or ""
        )
        if link:
            by_link.setdefault(link, product)
        title = normalize_text(product.get("name") or product.get("nome") or "")
        if title:
            by_title.setdefault(title, product)
    return by_link, by_title


def product_is_publishable(product: dict[str, Any], root: Path) -> bool:
    status = normalize_text(product.get("status") or product.get("statusPublicacao") or "")
    if re.search(r"rascunho|revisao|pendente|duplicado|inativo|oculto|bloqueado", status):
        return False
    if product.get("aprovadoParaPublicacao") is False:
        return False
    link = str(product.get("affiliateLink") or product.get("linkCompra") or "").strip()
    image = str(product.get("image") or product.get("imagemPrincipal") or "").strip().lstrip("/")
    return bool(link_is_direct_product(link)) and bool(image) and not image_is_placeholder(image) and (root / image).exists()


def validate_batch(products: list[dict[str, Any]], ids: list[str], root: Path, stores: list[dict[str, Any]]) -> dict[str, Any]:
    store_ids = {str(store.get("id")) for store in stores}
    by_id = {str(product.get("id")): product for product in products}
    selected = [by_id[product_id] for product_id in ids if product_id in by_id]
    active_selected = [product for product in selected if product_is_publishable(product, root)]
    link_counts = Counter(
        canonical_link(product.get("affiliateLink") or product.get("linkCompra") or "")
        for product in products
        if product_is_publishable(product, root)
    )
    duplicate_active_links = [link for link, count in link_counts.items() if link and count > 1]
    missing_store = [
        product.get("id")
        for product in active_selected
        if str(product.get("storeId")) not in store_ids
    ]
    return {
        "batchProductIds": ids,
        "checked": len(selected),
        "active": len(active_selected),
        "inactive": len(selected) - len(active_selected),
        "missingStore": missing_store,
        "duplicateActiveLinks": duplicate_active_links,
        "ok": not missing_store and not duplicate_active_links,
    }


def replace_inline_array(html: str, variable_name: str, value: Any) -> str:
    marker = f"let {variable_name} ="
    marker_index = html.find(marker)
    if marker_index == -1:
        raise RuntimeError(f"Variavel {variable_name} nao encontrada.")
    array_start = html.find("[", marker_index)
    if array_start == -1:
        raise RuntimeError(f"Array {variable_name} nao encontrado.")

    in_string = False
    escape_next = False
    depth = 0
    for index in range(array_start, len(html)):
        char = html[index]
        if in_string:
            if escape_next:
                escape_next = False
            elif char == "\\":
                escape_next = True
            elif char == '"':
                in_string = False
            continue
        if char == '"':
            in_string = True
            continue
        if char == "[":
            depth += 1
        elif char == "]":
            depth -= 1
            if depth == 0:
                return f"{html[:array_start]}{json.dumps(value, ensure_ascii=False, indent=2)}{html[index + 1:]}"
    raise RuntimeError(f"Fim do array {variable_name} nao encontrado.")


def sync_package_and_html(root: Path) -> None:
    package_data = PACKAGE_DIR / "dados"
    package_data.mkdir(parents=True, exist_ok=True)
    for file_name in ("products.json", "stores.json", "banners-anuncios.json", "importedMercadoLivreProducts.json"):
        source = root / "dados" / file_name
        if source.exists():
            shutil.copy2(source, package_data / file_name)

    products = load_json(root / "dados" / "products.json", [])
    imported = load_json(root / "dados" / "importedMercadoLivreProducts.json", [])
    for html_file in (root / "index.html", root / "impacto360.html", PACKAGE_DIR / "index.html"):
        if not html_file.exists():
            continue
        html = html_file.read_text(encoding="utf-8")
        html = replace_inline_array(html, "importedMercadoLivreProducts", imported)
        html = replace_inline_array(html, "products", products)
        html = html.replace("];\r\n", "];\n")
        html_file.write_text(html, encoding="utf-8")


def update_imported_mercado_livre(root: Path, imported_products: list[dict[str, Any]]) -> None:
    path = root / "dados" / "importedMercadoLivreProducts.json"
    current = load_json(path, [])
    by_id = {str(product.get("id")): product for product in current}
    for product in imported_products:
        if product.get("source") == "Mercado Livre" or product.get("origem") == "Mercado Livre":
            by_id[str(product["id"])] = product
    write_json(path, list(by_id.values()))


def main() -> int:
    parser = argparse.ArgumentParser(description="Importa os catalogos DOCX da pasta para amanha com validacao por lotes.")
    parser.add_argument("inputs", nargs="+", type=Path)
    parser.add_argument("--root", type=Path, default=Path.cwd())
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--workers", type=int, default=5)
    parser.add_argument("--batch-size", type=int, default=20)
    args = parser.parse_args()

    root = args.root.resolve()
    products_path = root / "dados" / "products.json"
    stores_path = root / "dados" / "stores.json"
    products: list[dict[str, Any]] = load_json(products_path, [])
    stores: list[dict[str, Any]] = load_json(stores_path, [])
    by_link, by_title = existing_maps(products)

    rows: list[CatalogRow] = []
    source_counts: dict[str, int] = {}
    for input_path in args.inputs:
        parsed = parse_catalog(input_path.resolve())
        rows.extend(parsed)
        source_counts[input_path.name] = len(parsed)

    affiliate_counts = Counter(row.key for row in rows if has_real_affiliate_link(row.affiliate_link))
    accepted: list[CatalogRow] = []
    pending: list[dict[str, Any]] = []
    seen_affiliates: set[str] = set()
    for row in rows:
        if not has_real_affiliate_link(row.affiliate_link):
            pending.append({"title": row.title, "sourceFile": row.source_file, "reason": "sem link de afiliado real", "directLink": row.direct_link})
            continue
        if affiliate_counts[row.key] > 1 and row.key in seen_affiliates:
            pending.append({"title": row.title, "sourceFile": row.source_file, "reason": "link de afiliado duplicado em outro produto", "affiliateLink": row.affiliate_link, "directLink": row.direct_link})
            continue
        seen_affiliates.add(row.key)
        existing = by_link.get(row.key)
        if existing and not title_similarity(row.title, existing.get("name") or existing.get("nome") or "")["safe"]:
            pending.append({"title": row.title, "sourceFile": row.source_file, "reason": "link ja existe no catalogo com outro titulo", "affiliateLink": row.affiliate_link, "existingProductId": existing.get("id"), "existingTitle": existing.get("name")})
            continue
        accepted.append(row)

    imported_products: list[dict[str, Any]] = []
    batch_reports: list[dict[str, Any]] = []
    products_added = 0
    products_updated = 0
    active_count = 0
    image_errors: list[dict[str, Any]] = []

    for batch_start in range(0, len(accepted), args.batch_size):
        batch = accepted[batch_start:batch_start + args.batch_size]
        print(f"LOTE {batch_start // args.batch_size + 1}: validando {len(batch)} produtos")
        checks: dict[str, dict[str, Any]] = {}
        with ThreadPoolExecutor(max_workers=max(1, args.workers)) as executor:
            futures = {executor.submit(check_pair, row): row for row in batch}
            for future in as_completed(futures):
                row = futures[future]
                try:
                    checks[row.key] = future.result()
                except Exception as error:  # noqa: BLE001
                    checks[row.key] = {"ok": False, "error": f"{type(error).__name__}: {error}"}

        batch_ids: list[str] = []
        for row in batch:
            check = checks[row.key]
            existing = by_link.get(row.key) or by_title.get(normalize_text(row.title))
            can_publish = bool(check.get("ok"))
            image_relative = ""
            if can_publish and check.get("image"):
                prefix = "importado-amazon" if row.source == "Amazon" else "importado-ml"
                product_id = existing.get("id") if existing else stable_product_id(prefix, row.title, row.affiliate_link)
                filename = f"{slugify(row.title)}-{product_id[-8:]}.webp"
                image_relative = f"public/images/anuncios/{filename}"
                if args.apply:
                    try:
                        optimize_image_from_url(str(check["image"]), root / image_relative)
                        package_image = PACKAGE_DIR / image_relative
                        package_image.parent.mkdir(parents=True, exist_ok=True)
                        shutil.copy2(root / image_relative, package_image)
                    except Exception as error:  # noqa: BLE001
                        image_errors.append({"title": row.title, "image": check.get("image"), "error": str(error)})
                        image_relative = ""
                        can_publish = False

            description_parts = [
                row.title,
                f"Categoria: {row.category}" if row.category else "",
                f"Marca: {row.brand}" if row.brand else "",
                "Oferta selecionada para o catalogo Impacto 360 Afiliado.",
                "Confira preco, tamanho, cor, frete, estoque e garantia diretamente no parceiro antes de comprar.",
            ]
            hinted_category = row.category
            if row.source == "Amazon" and normalize_text(row.category).find("chinelo") >= 0:
                hinted_category = f"loja calcados prioridade {row.category}"
            elif normalize_text(row.source_file).find("calcados") >= 0:
                hinted_category = f"loja calcados prioridade {row.category}"

            item = impacto_importer.ImportedItem(
                title=row.title,
                link=row.affiliate_link,
                source_file=f"{row.source_file} | {row.source_table}",
                description=" ".join(part for part in description_parts if part),
                hinted_category=hinted_category,
                price=check.get("price") or row.price,
                rating=parse_rating(row.notes),
                source_notes=[
                    "Importado dos catalogos enviados em 2026-07-13.",
                    "Link de afiliado preservado; foto importada do link validado.",
                ],
                validation_link=row.direct_link or row.affiliate_link,
                source_product_link=row.direct_link,
                source=row.source,
                button_label=button_label(row.source),
                product_id_prefix="importado-amazon" if row.source == "Amazon" else "importado-ml",
                allow_validated_title=False,
            )
            product = impacto_importer.build_product(item, check, root, image_relative, existing)
            product.update(
                {
                    "affiliateLink": row.affiliate_link,
                    "linkCompra": row.affiliate_link,
                    "linkOriginal": row.affiliate_link,
                    "linkAfiliado": row.affiliate_link,
                    "linkComissionado": row.affiliate_link,
                    "linkPlataforma": row.affiliate_link,
                    "source": row.source,
                    "origem": row.source,
                    "destaqueHome": True,
                    "homeRotation": True,
                    "rotacaoTelaInicial": True,
                    "rotationGroup": ROTATION_GROUP,
                    "origemImportacao": CATALOG_SOURCE,
                    "arquivoOrigemCatalogo": row.source_file,
                    "catalogoParaAmanha": True,
                    "validacaoOnline": {
                        **product.get("validacaoOnline", {}),
                        "affiliateCheck": check.get("affiliateCheck"),
                        "directCheck": check.get("directCheck"),
                        "affiliateSafe": check.get("affiliateSafe"),
                        "directSafe": check.get("directSafe"),
                        "batchValidation": ROTATION_GROUP,
                    },
                }
            )
            if can_publish and image_relative:
                product["status"] = "ativo"
                product["statusPublicacao"] = "ativo"
                product["aprovadoParaPublicacao"] = True
                product["productIsVisible"] = True
                product["badge"] = "Oferta verificada"
                product["pendencias"] = [p for p in product.get("pendencias", []) if p != "preco dinamico no anuncio"]
                active_count += 1
            else:
                product["status"] = "revisao_manual"
                product["statusPublicacao"] = "revisao_manual"
                product["aprovadoParaPublicacao"] = False
                product["productIsVisible"] = False
                product["badge"] = "Revisar"
                product.setdefault("pendencias", [])
                if "link afiliado nao confirmado com produto/imagem" not in product["pendencias"]:
                    product["pendencias"].append("link afiliado nao confirmado com produto/imagem")
                pending.append({"title": row.title, "sourceFile": row.source_file, "reason": product["pendencias"], "affiliateLink": row.affiliate_link, "directLink": row.direct_link})

            if args.apply:
                if existing:
                    products[products.index(existing)] = product
                    products_updated += 1
                else:
                    products.append(product)
                    products_added += 1
                by_link[row.key] = product
                by_title[normalize_text(row.title)] = product

            imported_products.append(product)
            batch_ids.append(str(product["id"]))

        if args.apply:
            batch_report = validate_batch(products, batch_ids, root, stores)
        else:
            batch_report = {"batchProductIds": batch_ids, "checked": len(batch_ids), "ok": True, "dryRun": True}
        batch_report["batch"] = batch_start // args.batch_size + 1
        batch_reports.append(batch_report)
        print(
            f"CHECK LOTE {batch_report['batch']}: "
            f"checados={batch_report.get('checked')} ativos={batch_report.get('active', 0)} "
            f"ok={batch_report.get('ok')}"
        )
        if args.apply and not batch_report.get("ok"):
            raise RuntimeError(f"Falha na validacao do lote {batch_report['batch']}: {batch_report}")

    report = {
        "executedAt": today_iso(),
        "rotationGroup": ROTATION_GROUP,
        "sourceFiles": source_counts,
        "rowsExtracted": len(rows),
        "acceptedForValidation": len(accepted),
        "productsAdded": products_added,
        "productsUpdated": products_updated,
        "activeImportedOrUpdated": active_count,
        "pendingCount": len(pending),
        "pending": pending,
        "imageErrors": image_errors,
        "batchReports": batch_reports,
        "importedProductIds": [product.get("id") for product in imported_products],
    }

    if args.apply:
        write_json(products_path, products)
        write_json(stores_path, stores)
        update_imported_mercado_livre(root, imported_products)
        impacto_importer.update_home_rotation(root, imported_products)
        sync_package_and_html(root)
        write_json(root / "dados" / "ultima-importacao-catalogos-para-amanha.json", report)
        write_json(root / "dados" / f"produtos-importados-catalogos-para-amanha-{today_iso()}.json", imported_products)
        print(
            f"Aplicado: {products_added} adicionados, {products_updated} atualizados, "
            f"{active_count} ativos/atualizados, {len(pending)} pendentes."
        )
    else:
        write_json(root / "dados" / "preview-importacao-catalogos-para-amanha.json", {"report": report, "products": imported_products})
        print(f"Previa salva em {root / 'dados' / 'preview-importacao-catalogos-para-amanha.json'}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
