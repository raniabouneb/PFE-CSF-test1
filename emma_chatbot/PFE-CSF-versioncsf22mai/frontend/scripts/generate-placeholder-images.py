"""Génère des images placeholder valides pour le dossier public/ (dev local)."""
from __future__ import annotations

import struct
import zlib
from pathlib import Path

PUBLIC = Path(__file__).resolve().parent.parent / "public"

PATHS = [
    "partner-logos/telnet.png",
    "partner-logos/sofiatech.png",
    "partner-logos/sofrecom.png",
    "partner-logos/focus.png",
    "partner-logos/faurecia.png",
    "partner-logos/altran.png",
    "partner-logos/fst.png",
    "collaborations/collaboration-1.jpg",
    "images/hero-6.jpg",
    "images/image-hero-accueil.png",
    "images/reconversion-hero.png",
    "images/logo-new.png",
    "images/logo-text-blanc.png",
    "images/logo-csf.png",
    "images/consulting.jpg",
    "images/certif.jpg",
    "images/mesure-framer.jpg",
    "images/partenariat1.png",
    "images/digital1.png",
    "images/performance1.png",
    "images/potentiel1.png",
    "images/iot-accueil3.webp",
    "images/data-accueil.webp",
    "images/100-accueil.jpg",
    "images/reconversion-framer.jpg",
    "images/ponctuelle-framer.jpg",
    "images/ambition-image1.jpg",
    "images/hero-2.jpg",
    "images/conseil-ambitions.jpg",
    "images/formation-1.jpg",
    "images/formation-2.jpg",
    "images/formation3.png",
    "images/iot.png",
    "images/dev.png",
    "images/istqb.png",
    "images/systemes-embarques.jpg",
    "images/custom-dev.jpg",
    "images/formation-data-ai.jpg",
    "images/formation-fullstack.jpg",
    "images/hero-laptop.png",
    "images/formation-testeur.jpg",
    "images/hero-formation.png",
    "images/medaille.png",
    "images/verifier.png",
    "images/welcome.png",
    "images/pack/image1.jpeg",
    "images/pack/image3-1.jpg",
    "images/pack/image6.jpg",
    "images/pack/kkk.jpeg",
    "images/pack/whatsapp-03.jpeg",
    "images/pack/whatsapp-0.jpeg",
]


def _png_chunk(tag: bytes, data: bytes) -> bytes:
    crc = zlib.crc32(tag + data) & 0xFFFFFFFF
    return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", crc)


def solid_png(r: int, g: int, b: int, w: int = 320, h: int = 200) -> bytes:
    raw = b""
    row = bytes([r, g, b, 255]) * w
    for _ in range(h):
        raw += b"\x00" + row
    compressed = zlib.compress(raw, 9)
    ihdr = struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0)
    return (
        b"\x89PNG\r\n\x1a\n"
        + _png_chunk(b"IHDR", ihdr)
        + _png_chunk(b"IDAT", compressed)
        + _png_chunk(b"IEND", b"")
    )


def solid_jpeg(r: int, g: int, b: int, w: int = 320, h: int = 200) -> bytes:
    # JPEG minimal 1x1 puis étendu via script — on réutilise un PNG renommé en .jpg
    # Next/Image accepte un vrai JPEG tiny ; on encode un JPEG baseline 8x8 simple.
    try:
        from PIL import Image
        import io

        img = Image.new("RGB", (w, h), (r, g, b))
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=85)
        return buf.getvalue()
    except ImportError:
        return solid_png(r, g, b, w, h)


def color_for(path: str) -> tuple[int, int, int]:
    name = Path(path).stem.lower()
    palette = {
        "telnet": (0, 102, 179),
        "sofiatech": (230, 126, 34),
        "sofrecom": (41, 128, 185),
        "focus": (39, 174, 96),
        "faurecia": (142, 68, 173),
        "altran": (192, 57, 43),
        "fst": (44, 62, 80),
        "logo": (51, 95, 161),
        "hero": (30, 60, 114),
        "consulting": (52, 73, 94),
        "certif": (46, 125, 50),
        "formation": (21, 101, 192),
        "iot": (0, 150, 136),
        "data": (63, 81, 181),
        "welcome": (255, 193, 7),
    }
    for key, rgb in palette.items():
        if key in name:
            return rgb
    return (51, 95, 161)


def write_asset(rel: str) -> None:
    dest = PUBLIC / rel.replace("/", "\\")
    if dest.exists():
        return
    dest.parent.mkdir(parents=True, exist_ok=True)
    r, g, b = color_for(rel)
    ext = dest.suffix.lower()
    if ext in {".jpg", ".jpeg"}:
        data = solid_jpeg(r, g, b)
    else:
        data = solid_png(r, g, b)
    dest.write_bytes(data)
    print(f"created {rel}")


def main() -> None:
    for rel in PATHS:
        write_asset(rel)
    print("done")


if __name__ == "__main__":
    main()
