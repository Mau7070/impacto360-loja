from __future__ import annotations

import argparse
import csv
import json
import re
import shutil
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Iterable

from docx import Document
from docx.oxml.ns import qn

from anuncios_core import (
    canonical_link,
    check_link,
    classify_product,
    clean_url,
    extract_first_url,
    image_is_placeholder,
    load_json,
    link_is_direct_product,
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


W_HYPERLINK = qn("w:hyperlink")
R_ID = qn("r:id")
R_EMBED = qn("r:embed")


@dataclass
class ImportedItem:
    title: str
    link: str
    source_file: str
    description: str = ""
    hinted_category: str = ""
    price: str = "Preço no anúncio"
    rating: float | None = None
    embedded_image: bytes | None = None
    embedded_extension: str = ".png"
    embedded_image_safe: bool = False
    source_notes: list[str] = field(default_factory=list)

    def key(self) -> str:
        return canonical_link(self.link) or normalize_text(self.title)


def paragraph_hyperlinks(document: Document, paragraph: Any) -> list[str]:
    result: list[str] = []
    for node in paragraph._p.iter(W_HYPERLINK):
        relationship_id = node.get(R_ID)
        if relationship_id and relationship_id in document.part.rels:
            target = clean_url(document.part.rels[relationship_id].target_ref)
            if target:
                result.append(target)
    return result


def cell_hyperlinks(document: Document, cell: Any) -> list[str]:
    links: list[str] = []
    for paragraph in cell.paragraphs:
        links.extend(paragraph_hyperlinks(document, paragraph))
        links.extend(re.findall(r"https?://[^\s<>]+", paragraph.text))
    return list(dict.fromkeys(clean_url(link) for link in links if clean_url(link)))


def preferred_link(links: Iterable[str], fallback_text: str = "") -> str:
    candidates = list(dict.fromkeys(clean_url(link) for link in links if clean_url(link)))
    candidates.extend(
        link
        for link in re.findall(r"https?://[^\s<>]+", fallback_text or "")
        if clean_url(link) not in candidates
    )
    for candidate in candidates:
        if "meli.la/" in candidate.lower():
            return clean_url(candidate)
    return clean_url(candidates[0]) if candidates else extract_first_url(fallback_text)


def cell_image(document: Document, cell: Any) -> tuple[bytes | None, str]:
    for blip in cell._tc.iter(qn("a:blip")):
        relationship_id = blip.get(R_EMBED)
        if not relationship_id or relationship_id not in document.part.rels:
            continue
        part = document.part.rels[relationship_id].target_part
        extension = Path(str(getattr(part, "partname", "image.png"))).suffix or ".png"
        return part.blob, extension
    return None, ".png"


def title_without_number(value: str) -> str:
    return re.sub(r"^\s*\d+\s*[.)-]\s*", "", value or "").strip()


def metadata_value(text: str, label: str) -> str:
    match = re.search(rf"{re.escape(label)}\s*:\s*([^\n]+)", text, re.IGNORECASE)
    return match.group(1).strip() if match else ""


def extract_four_column_catalog(path: Path) -> list[ImportedItem]:
    document = Document(path)
    if not document.tables:
        return []
    table = max(document.tables, key=lambda candidate: len(candidate.rows))
    items: list[ImportedItem] = []
    for row in table.rows[1:]:
        if len(row.cells) < 4:
            continue
        details = row.cells[2].text.strip()
        if not details:
            continue
        title = details.splitlines()[0].strip()
        links = cell_hyperlinks(document, row.cells[3])
        link = preferred_link(links, row.cells[3].text)
        if not title or not link:
            continue
        image, extension = cell_image(document, row.cells[1])
        category = metadata_value(details, "Categoria")
        items.append(
            ImportedItem(
                title=title,
                link=link,
                source_file=path.name,
                description=details,
                hinted_category=category,
                price=parse_brazilian_price(details),
                rating=parse_rating(details),
                embedded_image=image,
                embedded_extension=extension,
                embedded_image_safe=bool(image),
                source_notes=["Foto incorporada ao lado do produto no catálogo."],
            )
        )
    return items


def extract_lanterns(path: Path) -> list[ImportedItem]:
    document = Document(path)
    items: list[ImportedItem] = []
    for table in document.tables:
        if len(table.rows) != 1 or len(table.columns) != 2:
            continue
        image_cell, detail_cell = table.rows[0].cells
        text = detail_cell.text.strip()
        if not re.match(r"^\d+\.", text):
            continue
        title = title_without_number(text.splitlines()[0])
        links = cell_hyperlinks(document, detail_cell)
        link = preferred_link(links, text)
        if not link:
            continue
        image, extension = cell_image(document, image_cell)
        items.append(
            ImportedItem(
                title=title,
                link=link,
                source_file=path.name,
                description=text,
                hinted_category="Lanternas UV",
                price=parse_brazilian_price(text),
                rating=parse_rating(text),
                embedded_image=image,
                embedded_extension=extension,
                embedded_image_safe=bool(image),
                source_notes=["Foto incorporada no bloco individual da lanterna."],
            )
        )
    return items[:10]


def extract_tvs(path: Path) -> list[ImportedItem]:
    document = Document(path)
    numbered_titles = [
        title_without_number(paragraph.text)
        for paragraph in document.paragraphs
        if re.match(r"^\s*\d+\.", paragraph.text)
    ]
    items: list[ImportedItem] = []
    for index, table in enumerate(document.tables):
        if index >= len(numbered_titles) or not table.rows or len(table.rows[0].cells) < 2:
            continue
        image_cell, detail_cell = table.rows[0].cells
        detail = detail_cell.text.strip()
        links = cell_hyperlinks(document, detail_cell)
        link = preferred_link(links, detail)
        if not link:
            continue
        image, extension = cell_image(document, image_cell)
        items.append(
            ImportedItem(
                title=numbered_titles[index],
                link=link,
                source_file=path.name,
                description=detail,
                hinted_category="Smart TVs",
                price="Preço no anúncio",
                embedded_image=image,
                embedded_extension=extension,
                embedded_image_safe=False,
                source_notes=[
                    "O próprio arquivo classifica as fotos como ilustrativas/representativas; não publicar sem validação online."
                ],
            )
        )
    return items


def extract_battery_toys(path: Path) -> list[ImportedItem]:
    document = Document(path)
    quick_table = max(document.tables, key=lambda candidate: len(candidate.rows))
    short_links_by_number: dict[str, str] = {}
    for table in document.tables:
        if table._tbl is quick_table._tbl:
            continue
        for row in table.rows:
            for cell in row.cells:
                text = cell.text.strip()
                number_match = re.match(r"^\s*(\d+)\.", text)
                if not number_match:
                    continue
                link = preferred_link(cell_hyperlinks(document, cell), text)
                if "meli.la/" in link.lower():
                    short_links_by_number[number_match.group(1)] = link
    items: list[ImportedItem] = []
    for row in quick_table.rows[1:]:
        if len(row.cells) < 3:
            continue
        number = row.cells[0].text.strip()
        title = row.cells[1].text.strip()
        links = cell_hyperlinks(document, row.cells[2])
        link = short_links_by_number.get(number) or preferred_link(links, row.cells[2].text)
        if not title or not link:
            continue
        items.append(
            ImportedItem(
                title=title,
                link=link,
                source_file=path.name,
                description="Brinquedo a bateria/recarregável selecionado no catálogo enviado.",
                hinted_category="Brinquedos a bateria",
                price="Preço no anúncio",
                embedded_image_safe=False,
                source_notes=[
                    "O próprio arquivo informa que as imagens são ilustrações por categoria; imagem real será buscada no anúncio."
                ],
            )
        )
    return items


def extract_docx(path: Path) -> list[ImportedItem]:
    name = normalize_text(path.name)
    if "lanternas uv" in name:
        return extract_lanterns(path)
    if "tvs mercado livre" in name:
        return extract_tvs(path)
    if "50 brinquedos a bateria" in name:
        return extract_battery_toys(path)
    return extract_four_column_catalog(path)


def extract_json(path: Path) -> list[ImportedItem]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    records = payload if isinstance(payload, list) else payload.get("products", payload.get("produtos", []))
    result = []
    for record in records:
        title = str(record.get("name") or record.get("nome") or record.get("title") or "").strip()
        link = str(
            record.get("affiliateLink")
            or record.get("linkCompra")
            or record.get("link")
            or record.get("url")
            or ""
        ).strip()
        if title and link:
            result.append(
                ImportedItem(
                    title=title,
                    link=link,
                    source_file=path.name,
                    description=str(record.get("description") or record.get("descricao") or ""),
                    hinted_category=str(record.get("category") or record.get("categoria") or ""),
                    price=str(record.get("price") or record.get("preco") or "Preço no anúncio"),
                )
            )
    return result


def extract_csv_file(path: Path) -> list[ImportedItem]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        records = list(csv.DictReader(handle))
    temporary = path.with_suffix(".json")
    temporary.write_text(json.dumps(records, ensure_ascii=False), encoding="utf-8")
    try:
        return extract_json(temporary)
    finally:
        temporary.unlink(missing_ok=True)


def extract_plain_text(path: Path) -> list[ImportedItem]:
    result = []
    for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        link = extract_first_url(line)
        title = re.sub(r"https?://[^\s<>]+", "", line).strip(" -|;\t")
        if title and link:
            result.append(ImportedItem(title=title, link=link, source_file=path.name))
    return result


def extract_file(path: Path) -> list[ImportedItem]:
    suffix = path.suffix.lower()
    if suffix == ".docx":
        return extract_docx(path)
    if suffix == ".json":
        return extract_json(path)
    if suffix in {".csv", ".tsv"}:
        return extract_csv_file(path)
    if suffix in {".txt", ".html", ".htm"}:
        return extract_plain_text(path)
    raise ValueError(f"Formato não suportado: {path.name}")


def richness(item: ImportedItem) -> int:
    return (
        len(item.description)
        + (1000 if item.embedded_image_safe and item.embedded_image else 0)
        + (200 if item.rating is not None else 0)
        + (100 if item.price != "Preço no anúncio" else 0)
    )


def merge_items(items: Iterable[ImportedItem]) -> list[ImportedItem]:
    merged: dict[str, ImportedItem] = {}
    for item in items:
        key = item.key()
        if not key:
            continue
        if key not in merged:
            merged[key] = item
            continue
        current = merged[key]
        preferred, other = (item, current) if richness(item) > richness(current) else (current, item)
        preferred.source_notes = list(dict.fromkeys(preferred.source_notes + other.source_notes))
        preferred.source_file = " | ".join(
            dict.fromkeys(part.strip() for part in f"{preferred.source_file}|{other.source_file}".split("|"))
        )
        if not preferred.embedded_image and other.embedded_image:
            preferred.embedded_image = other.embedded_image
            preferred.embedded_extension = other.embedded_extension
            preferred.embedded_image_safe = other.embedded_image_safe
        merged[key] = preferred
    return list(merged.values())


def ensure_toy_store(stores: list[dict[str, Any]]) -> bool:
    if any(store.get("id") == "impacto-brinquedos" for store in stores):
        return False
    stores.append(
        {
            "id": "impacto-brinquedos",
            "slug": "brinquedos",
            "route": "/loja/brinquedos",
            "name": "IMPACTO BRINQUEDOS",
            "commercialName": "Brinquedos",
            "floor": "segundo-andar",
            "category": "Brinquedos",
            "type": "products",
            "theme": "toys",
            "icon": "TOY",
            "color": "#ee7b2d",
            "gradient": "linear-gradient(135deg,#fff5df,#ffffff 46%,#e7f7ff)",
            "description": (
                "Brinquedos selecionados, ofertas infantis, brinquedos educativos, "
                "carrinhos, bonecas, drones, helicópteros e brinquedos a bateria."
            ),
            "subcategories": [
                "Brinquedos educativos",
                "Bonecas",
                "Carrinhos",
                "Drones infantis",
                "Helicópteros",
                "Jogos",
                "Blocos de montar",
                "Brinquedos a bateria",
                "Faz de conta",
                "Robôs e dinossauros",
            ],
            "section": "Brincar, aprender e imaginar",
            "active": True,
        }
    )
    return True


def existing_index(products: list[dict[str, Any]]) -> tuple[dict[str, dict[str, Any]], dict[str, dict[str, Any]]]:
    by_link: dict[str, dict[str, Any]] = {}
    by_title: dict[str, dict[str, Any]] = {}
    for product in products:
        link = canonical_link(
            product.get("affiliateLink")
            or product.get("linkCompra")
            or product.get("linkOriginal")
            or product.get("linkPrincipalFonte")
            or ""
        )
        if link:
            by_link.setdefault(link, product)
        title = normalize_text(product.get("name") or product.get("nome") or "")
        if title:
            by_title.setdefault(title, product)
    return by_link, by_title


def build_product(
    item: ImportedItem,
    check: dict[str, Any],
    root: Path,
    image_relative: str,
    existing: dict[str, Any] | None = None,
) -> dict[str, Any]:
    product = dict(existing or {})
    classification = classify_product(item.title, item.description, item.hinted_category)
    match = title_similarity(item.title, check.get("title", ""))
    valid_online = (
        link_is_direct_product(item.link)
        and bool(check.get("ok"))
        and bool(match["safe"])
    )
    status = "ativo" if valid_online and image_relative else "revisao_manual"
    price = check.get("price") or item.price or product.get("price") or "Preço no anúncio"
    rating = check.get("rating") if check.get("rating") is not None else item.rating
    product_id = product.get("id") or stable_product_id(
        "importado-ml", item.title, item.link
    )
    description = item.description.strip() or (
        f"Produto selecionado no arquivo {item.source_file}. "
        "Confira preço, frete, garantia e condições diretamente no anúncio."
    )
    pendencias: list[str] = []
    if not check.get("ok"):
        pendencias.append("link não confirmado online")
    if check.get("title") and not match["safe"]:
        pendencias.append("título do link diverge do produto")
    if not image_relative:
        pendencias.append("imagem real não confirmada")
    if price == "Preço no anúncio":
        pendencias.append("preço dinâmico no anúncio")

    product.update(
        {
            "id": product_id,
            "storeId": classification["storeId"],
            "name": item.title,
            "description": description,
            "descricaoCurta": description,
            "descricaoDetalhada": description,
            "price": price,
            "image": image_relative or "public/placeholder-produto-mercado-livre.svg",
            "imagemPrincipal": image_relative or "public/placeholder-produto-mercado-livre.svg",
            "galeria": [image_relative] if image_relative else [],
            "badge": "Oferta verificada" if status == "ativo" else "Revisar",
            "affiliateLink": item.link,
            "linkCompra": item.link,
            "linkOriginal": item.link,
            "linkResolvidoApenasLeitura": check.get("directProductUrl") or check.get("finalUrl") or "",
            "category": classification["category"],
            "categoria": classification["category"],
            "subcategoria": classification["subcategoria"],
            "source": "Mercado Livre",
            "origem": "Mercado Livre",
            "status": status,
            "aprovadoParaPublicacao": status == "ativo",
            "editable": True,
            "actionType": "buy",
            "buttonLabel": "Comprar no Mercado Livre",
            "rating": rating,
            "nota": rating,
            "origemImportacao": item.source_file,
            "arquivosOrigem": [part.strip() for part in item.source_file.split("|")],
            "statusImagem": "imagem real confirmada" if image_relative else "imagem manual necessária",
            "linkStatus": "link confirmado" if valid_online else "revisão manual",
            "pendencias": pendencias,
            "observacaoImportacao": " ".join(item.source_notes),
            "validacaoOnline": {
                **check,
                "titleMatch": match,
                "checkedAt": today_iso(),
            },
            "ultimaRevisao": today_iso(),
        }
    )
    return product


def main() -> int:
    parser = argparse.ArgumentParser(description="Importa anúncios e aplica filtros de qualidade.")
    parser.add_argument("inputs", nargs="+", type=Path)
    parser.add_argument("--root", type=Path, default=Path.cwd())
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--offline", action="store_true")
    parser.add_argument("--workers", type=int, default=6)
    args = parser.parse_args()

    root = args.root.resolve()
    products_path = root / "dados" / "products.json"
    stores_path = root / "dados" / "stores.json"
    products: list[dict[str, Any]] = load_json(products_path, [])
    stores: list[dict[str, Any]] = load_json(stores_path, [])

    extracted: list[ImportedItem] = []
    extraction_counts: dict[str, int] = {}
    for input_path in args.inputs:
        resolved = input_path.resolve()
        items = extract_file(resolved)
        extracted.extend(items)
        extraction_counts[resolved.name] = len(items)
    merged = merge_items(extracted)

    checks: dict[str, dict[str, Any]] = {}
    if args.offline:
        for item in merged:
            checks[item.key()] = {
                "requestedUrl": item.link,
                "ok": True,
                "title": item.title,
                "image": "",
                "error": "validação online ignorada",
            }
    else:
        with ThreadPoolExecutor(max_workers=max(1, args.workers)) as executor:
            pending = {
                executor.submit(check_link, item.link, item.title): item
                for item in merged
            }
            for future in as_completed(pending):
                item = pending[future]
                checks[item.key()] = future.result().as_dict()
                status = "OK" if checks[item.key()].get("ok") else "REVISAR"
                print(f"[{status}] {item.title[:72]}")

    selected_by_title: dict[str, ImportedItem] = {}
    for item in merged:
        title_key = normalize_text(item.title)
        current = selected_by_title.get(title_key)
        if current is None:
            selected_by_title[title_key] = item
            continue

        def candidate_score(candidate: ImportedItem) -> tuple[int, int, int]:
            candidate_check = checks[candidate.key()]
            similarity = title_similarity(candidate.title, candidate_check.get("title", ""))
            return (
                int(bool(candidate_check.get("ok")) and bool(similarity["safe"])),
                int(bool(candidate_check.get("image"))),
                richness(candidate),
            )

        if candidate_score(item) > candidate_score(current):
            item.source_notes = list(dict.fromkeys(item.source_notes + current.source_notes))
            item.source_file = " | ".join(
                dict.fromkeys(
                    part.strip()
                    for part in f"{item.source_file}|{current.source_file}".split("|")
                )
            )
            selected_by_title[title_key] = item
        else:
            current.source_notes = list(dict.fromkeys(current.source_notes + item.source_notes))
            current.source_file = " | ".join(
                dict.fromkeys(
                    part.strip()
                    for part in f"{current.source_file}|{item.source_file}".split("|")
                )
            )
    merged = list(selected_by_title.values())

    by_link, by_title = existing_index(products)
    imported_products: list[dict[str, Any]] = []
    added = 0
    updated = 0
    active = 0
    manual = 0
    image_errors: list[dict[str, str]] = []

    for item in merged:
        check = checks[item.key()]
        match = title_similarity(item.title, check.get("title", ""))
        image_relative = ""
        if check.get("ok") and match["safe"] and check.get("image"):
            filename = f"{slugify(item.title)}-{stable_product_id('ml', item.title, item.link)[-8:]}.webp"
            image_relative = f"public/images/anuncios/{filename}"
            destination = root / image_relative
            if args.apply:
                try:
                    optimize_image_from_url(check["image"], destination)
                except Exception as error:  # noqa: BLE001
                    image_errors.append({"title": item.title, "error": str(error)})
                    image_relative = ""
        elif item.embedded_image_safe and item.embedded_image and match["safe"]:
            filename = f"{slugify(item.title)}-{stable_product_id('docx', item.title, item.link)[-8:]}.webp"
            image_relative = f"public/images/anuncios/{filename}"
            if args.apply:
                from io import BytesIO
                from PIL import Image

                destination = root / image_relative
                destination.parent.mkdir(parents=True, exist_ok=True)
                with Image.open(BytesIO(item.embedded_image)) as image:
                    if image.mode not in ("RGB", "RGBA"):
                        image = image.convert("RGB")
                    if image.mode == "RGBA":
                        background = Image.new("RGB", image.size, "white")
                        background.paste(image, mask=image.getchannel("A"))
                        image = background
                    image.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
                    image.save(destination, format="WEBP", quality=82, method=6)

        existing = by_link.get(item.key()) or by_title.get(normalize_text(item.title))
        product = build_product(item, check, root, image_relative, existing)
        imported_products.append(product)
        if product["status"] == "ativo":
            active += 1
        else:
            manual += 1
        if existing:
            updated += 1
            products[products.index(existing)] = product
        else:
            added += 1
            products.append(product)

    store_created = ensure_toy_store(stores)
    report = {
        "executedAt": today_iso(),
        "sourceFiles": extraction_counts,
        "rawExtracted": len(extracted),
        "uniqueAfterDeduplication": len(merged),
        "productsAdded": added,
        "productsUpdated": updated,
        "activeImported": active,
        "manualReviewImported": manual,
        "toyStoreCreated": store_created,
        "imageErrors": image_errors,
        "manualReview": [
            {
                "id": product["id"],
                "title": product["name"],
                "link": product["affiliateLink"],
                "pendencias": product["pendencias"],
            }
            for product in imported_products
            if product["status"] != "ativo"
        ],
    }

    if args.apply:
        write_json(products_path, products)
        write_json(stores_path, stores)
        write_json(root / "dados" / "ultima-importacao-anuncios.json", report)
        write_json(root / "dados" / "produtos-importados-2026-06-23.json", imported_products)
        print(f"Aplicado: {added} adicionados, {updated} atualizados, {active} ativos, {manual} para revisão.")
    else:
        preview = root / "dados" / "preview-importacao-anuncios.json"
        write_json(preview, {"report": report, "products": imported_products})
        print(f"Prévia salva em {preview}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
