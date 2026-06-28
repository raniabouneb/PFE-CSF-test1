"""Chemins front (Next) — alignés sur `frontend/lib/formation-routes.ts`."""

from urllib.parse import quote

FORMATIONS_PONCTUELLES_HREF = "/formations-ponctuelles"

FORMATION_RECONVERSION = {
    "systemeEmbarque": "/formation/reconversion/systeme-embarque",
    "fullStack": "/formation/reconversion/full-stack",
    "testeurLogiciel": "/formation/reconversion/testeur-logiciel",
}


def ponctuelle_slug_ok(slug: str | None) -> bool:
    if slug is None:
        return False
    s = str(slug).strip()
    if not s:
        return False
    if s.lower() in ("null", "none", "undefined", "nil"):
        return False
    return True


def formation_topic_filter_key(ponctuelle_slug: str | None, titre: str | None) -> str | None:
    """
    Clé unique pour filtres / `certification_card.category` : `ponctuelle_slug` si présent,
    sinon `titre` (cas Supabase où le slug est encore NULL).
    """
    if ponctuelle_slug_ok(ponctuelle_slug):
        return str(ponctuelle_slug).strip()
    t = (titre or "").strip()
    if not t or t.lower() in ("null", "none", "undefined", "nil"):
        return None
    return t


def formation_ponctuelle_detail_href(slug: str | None) -> str:
    """Lien détail ; si slug absent ou invalide (ex. chaîne « NULL » en base), retourne l’index ponctuelle."""
    if not ponctuelle_slug_ok(slug):
        return FORMATIONS_PONCTUELLES_HREF
    # Import local : évite cycle `public_urls` → `catalog` → `formation_topic_cards` → `public_urls`.
    from app.domains.catalog.ponctuelle_formations import _slug_fingerprint

    s = str(slug).strip()
    seg = _slug_fingerprint(s) or s.replace(" ", "-").lower()
    return f"{FORMATIONS_PONCTUELLES_HREF}/{quote(seg, safe='')}"


def href_for_reconversion_title(titre: str) -> str:
    t = titre.lower()
    if any(
        x in t
        for x in ("embarqué", "embarque", "système embarqué", "système e")
    ):
        return FORMATION_RECONVERSION["systemeEmbarque"]
    if "full-stack" in t or "full stack" in t or "fullstack" in t:
        return FORMATION_RECONVERSION["fullStack"]
    if any(
        x in t
        for x in ("testeur", "test logiciel", "istqb", "académie")
    ):
        return FORMATION_RECONVERSION["testeurLogiciel"]
    return FORMATION_RECONVERSION["fullStack"]
