from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Any

from anuncios_core import (
    check_link,
    image_is_placeholder,
    link_is_direct_product,
    load_json,
    optimize_image_from_url,
    slugify,
    stable_product_id,
    title_similarity,
    today_iso,
    write_json,
)


def purchase_link(product: dict[str, Any]) -> str:
    return str(
        product.get("affiliateLink")
        or product.get("linkCompra")
        or product.get("linkAfiliado")
        or product.get("linkComissionado")
        or product.get("linkOriginal")
        or ""
    ).strip()


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Substitui imagens por fotos confirmadas no link do anúncio."
    )
    parser.add_argument("--root", type=Path, default=Path.cwd())
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--workers", type=int, default=6)
    parser.add_argument("--only-placeholders", action="store_true")
    args = parser.parse_args()
    root = args.root.resolve()
    products_path = root / "dados" / "products.json"
    products: list[dict[str, Any]] = load_json(products_path, [])

    candidates = []
    for product in products:
        link = purchase_link(product)
        if not link_is_direct_product(link):
            continue
        current_image = str(product.get("image") or product.get("imagemPrincipal") or "")
        if args.only_placeholders and not image_is_placeholder(current_image):
            continue
        candidates.append(product)

    checks: dict[str, dict[str, Any]] = {}
    with ThreadPoolExecutor(max_workers=max(1, args.workers)) as executor:
        pending = {
            executor.submit(
                check_link,
                purchase_link(product),
                str(product.get("name") or product.get("nome") or ""),
            ): product
            for product in candidates
        }
        for future in as_completed(pending):
            product = pending[future]
            checks[str(product.get("id"))] = future.result().as_dict()

    corrected = 0
    mismatches = 0
    unavailable = 0
    image_errors: list[dict[str, str]] = []
    for product in candidates:
        product_id = str(product.get("id"))
        title = str(product.get("name") or product.get("nome") or "")
        check = checks[product_id]
        match = title_similarity(title, check.get("title", ""))
        product["validacaoOnline"] = {
            **check,
            "titleMatch": match,
            "checkedAt": today_iso(),
        }
        if not check.get("ok"):
            unavailable += 1
            if image_is_placeholder(str(product.get("image") or "")):
                product["status"] = "revisao_manual"
                product["aprovadoParaPublicacao"] = False
            continue
        if not match["safe"]:
            mismatches += 1
            product["status"] = "revisao_manual"
            product["aprovadoParaPublicacao"] = False
            product["statusImagem"] = "conflito entre título e link"
            continue
        image_url = str(check.get("image") or "")
        if not image_url:
            continue
        filename = (
            f"{slugify(title)}-{stable_product_id('ml', title, purchase_link(product))[-8:]}.webp"
        )
        relative = f"public/images/anuncios/{filename}"
        if args.apply:
            try:
                optimize_image_from_url(image_url, root / relative)
            except Exception as error:  # noqa: BLE001
                image_errors.append({"id": product_id, "title": title, "error": str(error)})
                continue
        product["image"] = relative
        product["imagemPrincipal"] = relative
        product["galeria"] = [relative]
        product["statusImagem"] = "imagem real confirmada no link"
        product["linkStatus"] = "link confirmado"
        product["linkResolvidoApenasLeitura"] = (
            check.get("directProductUrl") or check.get("finalUrl") or ""
        )
        if check.get("price"):
            product["price"] = check["price"]
        if check.get("rating") is not None:
            product["rating"] = check["rating"]
            product["nota"] = check["rating"]
        product["status"] = "ativo"
        product["aprovadoParaPublicacao"] = True
        product["badge"] = "Oferta verificada"
        product["ultimaRevisao"] = today_iso()
        corrected += 1

    report = {
        "executedAt": today_iso(),
        "candidates": len(candidates),
        "imagesCorrected": corrected,
        "titleLinkMismatches": mismatches,
        "linksUnavailableOrUnverifiable": unavailable,
        "imageErrors": image_errors,
        "applied": args.apply,
    }
    if args.apply:
        write_json(products_path, products)
    write_json(root / "dados" / "relatorio-correcao-imagens-anuncios.json", report)
    print(
        f"Candidatos: {len(candidates)} | corrigidos: {corrected} | "
        f"conflitos: {mismatches} | indisponíveis/não verificáveis: {unavailable}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
