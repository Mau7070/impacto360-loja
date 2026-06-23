from __future__ import annotations

import hashlib
import html
import json
import re
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from datetime import date
from difflib import SequenceMatcher
from html.parser import HTMLParser
from pathlib import Path
from typing import Any

from PIL import Image


USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36"
)

PLACEHOLDER_PATTERN = re.compile(
    r"placeholder|sem[-_ ]?(?:foto|imagem)|no[-_ ]?image|COLOCAR_|URL_|LINK_",
    re.IGNORECASE,
)

URL_PATTERN = re.compile(r"https?://[^\s<>\"]+", re.IGNORECASE)
PRICE_PATTERN = re.compile(r"R\$\s*([\d.]+,\d{2}|[\d.]+)", re.IGNORECASE)
RATING_PATTERN = re.compile(
    r"(?:avalia[cç][aã]o(?:\s+vis[ií]vel)?|nota)\s*[:\-]?\s*(\d(?:[,.]\d)?)",
    re.IGNORECASE,
)

STOPWORDS = {
    "a",
    "as",
    "com",
    "da",
    "das",
    "de",
    "do",
    "dos",
    "e",
    "em",
    "para",
    "por",
    "o",
    "os",
    "the",
    "um",
    "uma",
}


def load_json(path: Path, default: Any = None) -> Any:
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(
        json.dumps(value, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    temporary.replace(path)


def strip_accents(value: str) -> str:
    return "".join(
        character
        for character in unicodedata.normalize("NFKD", value)
        if not unicodedata.combining(character)
    )


def normalize_text(value: str) -> str:
    value = html.unescape(str(value or ""))
    value = strip_accents(value).lower()
    value = re.sub(r"[^a-z0-9]+", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def slugify(value: str, fallback: str = "produto") -> str:
    normalized = normalize_text(value).replace(" ", "-").strip("-")
    return normalized[:100] or fallback


def clean_url(value: str) -> str:
    return html.unescape(str(value or "")).strip().rstrip(".,;)")


def extract_first_url(value: str) -> str:
    match = URL_PATTERN.search(value or "")
    return clean_url(match.group(0)) if match else ""


def canonical_link(value: str) -> str:
    value = clean_url(value)
    if not value:
        return ""
    try:
        parsed = urllib.parse.urlsplit(value)
    except ValueError:
        return value.lower()
    host = parsed.netloc.lower().removeprefix("www.")
    path = re.sub(r"/+$", "", parsed.path)
    if host == "meli.la":
        return f"https://meli.la{path}".lower()
    if "mercadolivre.com" in host:
        return urllib.parse.urlunsplit(("https", host, path, "", "")).lower()
    return urllib.parse.urlunsplit(
        (parsed.scheme.lower() or "https", host, path, parsed.query, "")
    ).lower()


def link_is_direct_product(value: str) -> bool:
    value = clean_url(value)
    if not value or PLACEHOLDER_PATTERN.search(value):
        return False
    try:
        parsed = urllib.parse.urlsplit(value)
    except ValueError:
        return False
    host = parsed.netloc.lower()
    path = parsed.path.lower()
    if host.endswith("meli.la"):
        return bool(path.strip("/"))
    if "mercadolivre.com" in host:
        if host.startswith("lista.") or "/loja/" in path:
            return False
        return (
            "/p/" in path
            or "/up/" in path
            or "/mlb-" in path
            or host.startswith("produto.")
        )
    return parsed.scheme in {"http", "https"} and bool(host)


def parse_brazilian_price(value: str) -> str:
    match = PRICE_PATTERN.search(value or "")
    return f"R$ {match.group(1)}" if match else "Preço no anúncio"


def parse_rating(value: str) -> float | None:
    match = RATING_PATTERN.search(value or "")
    if not match:
        return None
    try:
        return float(match.group(1).replace(",", "."))
    except ValueError:
        return None


def image_is_placeholder(value: str) -> bool:
    return not str(value or "").strip() or bool(PLACEHOLDER_PATTERN.search(str(value)))


def image_exists(root: Path, value: str) -> bool:
    value = str(value or "").strip().lstrip("/")
    if not value or value.startswith(("http://", "https://", "data:")):
        return bool(value)
    return (root / value).exists()


def classify_product(title: str, description: str = "", hinted_category: str = "") -> dict[str, str]:
    text = normalize_text(f"{title} {description} {hinted_category}")

    if any(marker in text for marker in ("carrinho de bebe", "berco", "mobile giratorio")):
        return {
            "storeId": "impacto-kids",
            "category": "Bebê e Infantil",
            "subcategoria": "Bebês",
        }

    toy_markers = (
        "brinquedo",
        "boneca",
        "carrinho controle remoto",
        "carro controle remoto",
        "carro vira robo",
        "helicoptero controle remoto",
        "drone infantil",
        "drone de brinquedo",
        "mini cozinha infantil",
        "maquiagem infantil",
        "dinossauro",
        "robo unicornio",
        "jogo educativo",
        "blocos de montar",
        "blocos ima",
        "panelinha",
        "pelucia",
        "miniatura empilhadeira",
        "penteadeira infantil",
    )
    toy_match = any(marker in text for marker in toy_markers) or (
        "carrinho" in text and "carrinho de bebe" not in text
    )
    if toy_match:
        subcategory = "Brinquedos"
        for marker, label in (
            ("boneca", "Bonecas"),
            ("drone", "Drones infantis"),
            ("helicoptero", "Helicópteros"),
            ("carrinho", "Carrinhos"),
            ("carro controle remoto", "Carrinhos"),
            ("caminhao", "Caminhões e tratores"),
            ("trator", "Caminhões e tratores"),
            ("robo", "Robôs"),
            ("dinossauro", "Dinossauros"),
            ("cozinha infantil", "Faz de conta"),
            ("maquiagem infantil", "Faz de conta"),
            ("panelinha", "Faz de conta"),
            ("pelucia", "Pelúcias"),
            ("blocos", "Blocos de montar"),
            ("miniatura", "Carrinhos"),
        ):
            if marker in text:
                subcategory = label
                break
        return {
            "storeId": "impacto-brinquedos",
            "category": "Brinquedos",
            "subcategoria": subcategory,
        }

    if any(marker in text for marker in ("smart tv", "televisao", "televisor", " qled ", " oled ")):
        return {
            "storeId": "impacto-eletronicos",
            "category": "Eletrônicos",
            "subcategoria": "Smart TVs",
        }

    if "lanterna" in text and any(marker in text for marker in (" uv ", "ultravioleta", "escorpiao")):
        return {
            "storeId": "impacto-ferramentas",
            "category": "Ferramentas",
            "subcategoria": "Lanternas UV",
        }

    if any(
        marker in text
        for marker in (
            "vestido",
            "blusa",
            "camisa feminina",
            "calca feminina",
            "saia",
            "bolsa",
            "moda feminina",
            "moda masculina",
            "roupa",
            "acessorio de moda",
        )
    ):
        return {
            "storeId": "impacto-moda",
            "category": "Moda",
            "subcategoria": "Moda feminina" if "feminin" in text else "Moda",
        }

    if any(marker in text for marker in ("tenis", "sapato", "sandalia", "bota", "chinelo")):
        return {
            "storeId": "impacto-calcados",
            "category": "Calçados",
            "subcategoria": "Calçados",
        }

    if any(
        marker in text
        for marker in (
            "notebook",
            "computador",
            "monitor",
            "ssd",
            "memoria ram",
            "placa de video",
            "teclado",
            "mouse",
            "impressora",
        )
    ):
        return {
            "storeId": "impacto-tech-computadores",
            "category": "Informática",
            "subcategoria": "Computadores e acessórios",
        }

    if any(marker in text for marker in ("smartphone", "celular", "iphone", "galaxy", "motorola moto")):
        return {
            "storeId": "impacto-mobile",
            "category": "Celulares",
            "subcategoria": "Smartphones",
        }

    if any(
        marker in text
        for marker in (
            "panela",
            "cozinha",
            "utensilio",
            "faca",
            "decoracao",
            "movel",
            "tapete",
            "processador de alimentos",
            "moedor",
        )
    ):
        return {
            "storeId": "impacto-casa",
            "category": "Casa e Cozinha",
            "subcategoria": "Casa e utilidades",
        }

    if any(marker in text for marker in ("furadeira", "parafusadeira", "serra", "disco de corte", "ferramenta")):
        return {
            "storeId": "impacto-ferramentas",
            "category": "Ferramentas",
            "subcategoria": "Ferramentas",
        }

    if any(marker in text for marker in ("bebe", "berco", "carrinho de bebe", "fralda")):
        return {
            "storeId": "impacto-kids",
            "category": "Bebê e Infantil",
            "subcategoria": "Bebês",
        }

    return {
        "storeId": "impacto-ofertas",
        "category": hinted_category or "Outros",
        "subcategoria": hinted_category or "Outros",
    }


def title_similarity(expected: str, actual: str) -> dict[str, Any]:
    expected_normalized = normalize_text(expected)
    actual_normalized = normalize_text(actual)
    ratio = SequenceMatcher(None, expected_normalized, actual_normalized).ratio()
    expected_tokens = {
        token for token in expected_normalized.split() if token not in STOPWORDS and len(token) > 1
    }
    actual_tokens = {
        token for token in actual_normalized.split() if token not in STOPWORDS and len(token) > 1
    }
    overlap = len(expected_tokens & actual_tokens) / max(1, len(expected_tokens | actual_tokens))
    expected_models = {
        token
        for token in expected_tokens
        if re.search(r"[a-z]", token) and re.search(r"\d", token)
    }
    model_match = bool(expected_models & actual_tokens) if expected_models else False
    substring = (
        bool(expected_normalized)
        and bool(actual_normalized)
        and (
            expected_normalized in actual_normalized
            or actual_normalized in expected_normalized
        )
    )
    safe = (
        substring
        or ratio >= 0.66
        or overlap >= 0.55
        or (ratio >= 0.58 and overlap >= 0.30)
        or (model_match and ratio >= 0.35)
    )
    return {
        "safe": safe,
        "ratio": round(ratio, 4),
        "overlap": round(overlap, 4),
        "modelMatch": model_match,
    }


class ProductPageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.meta: dict[str, str] = {}
        self.cards: list[dict[str, Any]] = []
        self._anchor: dict[str, Any] | None = None
        self._capture_rating = False
        self._in_current_price = 0
        self._capture_document_title = False
        self._capture_product_title = False
        self._capture_generic_price = False
        self.document_title = ""
        self.product_title = ""
        self.landing_image = ""
        self.generic_price = ""

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attributes = {key: value or "" for key, value in attrs}
        classes = set(attributes.get("class", "").split())
        if tag == "meta":
            key = attributes.get("property") or attributes.get("name")
            if key and attributes.get("content"):
                self.meta[key.lower()] = attributes["content"]
        elif tag == "a" and "poly-component__title" in classes:
            self._anchor = {"title": "", "href": attributes.get("href", "")}
        elif tag == "title":
            self._capture_document_title = True
        elif tag == "span" and attributes.get("id") == "productTitle":
            self._capture_product_title = True
        elif tag == "img" and (
            attributes.get("id") == "landingImage"
            or attributes.get("data-a-image-name") == "landingImage"
        ):
            self.landing_image = (
                attributes.get("data-old-hires")
                or attributes.get("src")
                or self.landing_image
            )
        elif tag == "div" and "poly-price__current" in classes:
            self._in_current_price += 1
        elif tag == "span" and self._in_current_price and attributes.get("aria-label"):
            if self.cards and not self.cards[-1].get("priceLabel"):
                self.cards[-1]["priceLabel"] = attributes["aria-label"]
        elif tag == "span" and "poly-reviews__rating" in classes:
            self._capture_rating = True
        elif tag == "span" and "a-offscreen" in classes and not self.generic_price:
            self._capture_generic_price = True

    def handle_endtag(self, tag: str) -> None:
        if tag == "a" and self._anchor is not None:
            self._anchor["title"] = re.sub(r"\s+", " ", self._anchor["title"]).strip()
            self.cards.append(self._anchor)
            self._anchor = None
        elif tag == "div" and self._in_current_price:
            self._in_current_price -= 1
        elif tag == "span":
            self._capture_rating = False
            self._capture_product_title = False
            self._capture_generic_price = False
        elif tag == "title":
            self._capture_document_title = False

    def handle_data(self, data: str) -> None:
        if self._anchor is not None:
            self._anchor["title"] += data
        elif self._capture_product_title:
            self.product_title += data
        elif self._capture_document_title:
            self.document_title += data
        elif self._capture_generic_price and "R$" in data:
            self.generic_price = re.sub(r"\s+", " ", data).strip()
        elif self._capture_rating and self.cards:
            value = data.strip()
            if value:
                self.cards[-1]["rating"] = value


@dataclass
class LinkCheck:
    requested_url: str
    final_url: str = ""
    status_code: int = 0
    ok: bool = False
    title: str = ""
    image: str = ""
    direct_product_url: str = ""
    price: str = ""
    rating: float | None = None
    error: str = ""

    def as_dict(self) -> dict[str, Any]:
        return {
            "requestedUrl": self.requested_url,
            "finalUrl": self.final_url,
            "statusCode": self.status_code,
            "ok": self.ok,
            "title": self.title,
            "image": self.image,
            "directProductUrl": self.direct_product_url,
            "price": self.price,
            "rating": self.rating,
            "error": self.error,
        }


def _price_from_label(value: str) -> str:
    normalized = normalize_text(value)
    numbers = [int(item) for item in re.findall(r"\d+", normalized)]
    if not numbers:
        return ""
    reais = numbers[0]
    centavos = numbers[1] if "centavo" in normalized and len(numbers) > 1 else 0
    formatted = f"{reais:,}".replace(",", ".")
    return f"R$ {formatted},{centavos:02d}"


def check_link(url: str, expected_title: str = "", timeout: int = 20) -> LinkCheck:
    result = LinkCheck(requested_url=url)
    if not clean_url(url):
        result.error = "link vazio"
        return result
    request = urllib.request.Request(
        clean_url(url),
        headers={
            "User-Agent": USER_AGENT,
            "Accept-Language": "pt-BR,pt;q=0.9",
            "Accept": "text/html,application/xhtml+xml",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            result.status_code = int(getattr(response, "status", 200) or 200)
            result.final_url = response.geturl()
            content_type = response.headers.get_content_charset() or "utf-8"
            body = response.read(2_500_000)
            text = body.decode(content_type, errors="replace")
    except urllib.error.HTTPError as error:
        result.status_code = error.code
        result.final_url = error.geturl()
        result.error = f"HTTP {error.code}"
        return result
    except Exception as error:  # noqa: BLE001 - report network failures in audit
        result.error = f"{type(error).__name__}: {error}"
        return result

    parser = ProductPageParser()
    try:
        parser.feed(text)
    except Exception:
        pass

    result.title = (
        parser.meta.get("og:title")
        or parser.meta.get("title")
        or parser.product_title
        or parser.document_title
        or ""
    ).strip()
    result.image = (parser.meta.get("og:image") or parser.landing_image or "").strip()
    result.price = parser.generic_price
    target = expected_title or result.title
    if parser.cards:
        best_card = max(
            parser.cards,
            key=lambda card: title_similarity(target, card.get("title", ""))["ratio"],
        )
        if title_similarity(target, best_card.get("title", ""))["safe"]:
            result.title = best_card.get("title", "") or result.title
            result.direct_product_url = html.unescape(best_card.get("href", ""))
            result.price = _price_from_label(best_card.get("priceLabel", ""))
            try:
                result.rating = float(str(best_card.get("rating", "")).replace(",", "."))
            except ValueError:
                result.rating = None

    result.ok = (
        200 <= result.status_code < 400
        and bool(result.title)
        and bool(result.image)
        and not any(
            marker in normalize_text(result.title)
            for marker in ("produto indisponivel", "pagina nao encontrada", "erro 404")
        )
    )
    if not result.ok and not result.error:
        result.error = "página sem título/imagem de produto confirmável"
    return result


def stable_product_id(prefix: str, title: str, link: str) -> str:
    digest = hashlib.sha1(f"{normalize_text(title)}|{canonical_link(link)}".encode("utf-8")).hexdigest()[:8]
    return f"{prefix}-{slugify(title)[:56]}-{digest}"


def optimize_image_from_url(
    url: str,
    destination: Path,
    max_dimension: int = 1200,
    quality: int = 82,
) -> dict[str, Any]:
    request = urllib.request.Request(
        url,
        headers={"User-Agent": USER_AGENT, "Accept": "image/avif,image/webp,image/*,*/*"},
    )
    with urllib.request.urlopen(request, timeout=25) as response:
        payload = response.read(12_000_000)
    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = destination.with_suffix(".tmp")
    from io import BytesIO

    with Image.open(BytesIO(payload)) as image:
        image.load()
        if image.mode not in ("RGB", "RGBA"):
            image = image.convert("RGB")
        if image.mode == "RGBA":
            background = Image.new("RGB", image.size, "white")
            background.paste(image, mask=image.getchannel("A"))
            image = background
        image.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)
        image.save(temporary, format="WEBP", quality=quality, method=6)
        width, height = image.size
    temporary.replace(destination)
    return {
        "width": width,
        "height": height,
        "bytes": destination.stat().st_size,
    }


def today_iso() -> str:
    return date.today().isoformat()
