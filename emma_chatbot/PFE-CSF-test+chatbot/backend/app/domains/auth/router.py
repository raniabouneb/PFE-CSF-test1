import os
import uuid
from pathlib import Path

import httpx
from fastapi import APIRouter, Header, HTTPException, UploadFile, File
from pydantic import BaseModel, EmailStr, Field, field_validator
from app.core.auth_deps import get_user_from_bearer, token_role_from_user
from app.core.config import settings
from app.core.dependencies import Db
from app.core.security import create_access_token, hash_password, verify_password
from app.domains.admin.apprenants.service import link_pending_members_for_user
from app.domains.admin.journal.service import log_action
from app.domains.admin.staff.service import apply_pending_staff_invites
from app.persistence.models import User

PHOTO_DIR = Path(os.environ.get("UPLOAD_DIR", "uploads")) / "photos"
PHOTO_DIR.mkdir(parents=True, exist_ok=True)
ALLOWED_PHOTO_EXT = {".jpg", ".jpeg", ".png", ".webp"}
MAX_PHOTO_SIZE = 5 * 1024 * 1024  # 5 MB

router = APIRouter(prefix="/auth", tags=["auth"])


def _new_user_id() -> str:
    return str(uuid.uuid4())


def _email_strict(email: str) -> str:
    e = email.strip().lower()
    if len(e) > 254 or "@" not in e:
        raise ValueError("Email invalide.")
    local, _, domain = e.partition("@")
    if not local or len(local) > 64 or not domain or "." not in domain:
        raise ValueError("Email invalide.")
    tld = domain.split(".")[-1]
    if len(tld) < 2:
        raise ValueError("Email invalide.")
    return e


class RegisterBody(BaseModel):
    name: str | None = Field(None, max_length=120)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class LoginBody(BaseModel):
    email: EmailStr
    password: str


class GoogleExchangeBody(BaseModel):
    code: str


def _user_out(u: User, db: Db | None = None) -> dict:
    from app.domains.admin.staff.permissions import permissions_for_response, resolve_staff_permissions

    role = token_role_from_user(u)
    out = {
        "id": u.id,
        "email": u.email,
        "name": u.name,
        "role": role,
        "firstName": u.first_name,
        "lastName": u.last_name,
        "phone": u.phone,
        "learnerCv": u.learner_cv,
        "photoUrl": u.photo_url,
    }
    if db is not None and role in ("admin", "assistant"):
        out["staffPermissions"] = permissions_for_response(resolve_staff_permissions(db, u))
    return out


class LearnerFormationIn(BaseModel):
    id: str | None = None
    title: str = Field(..., max_length=300)
    period: str | None = Field(None, max_length=200)
    status: str | None = Field(None, max_length=120)
    notes: str | None = Field(None, max_length=2000)


class LearnerProjectIn(BaseModel):
    id: str | None = None
    title: str = Field(..., max_length=300)
    description: str = Field("", max_length=8000)
    context: str | None = Field(None, max_length=500)


class LearnerCertIn(BaseModel):
    id: str | None = None
    title: str = Field(..., max_length=300)
    date: str | None = Field(None, max_length=64)
    issuer: str | None = Field(None, max_length=300)


class LearnerRecommendationIn(BaseModel):
    id: str | None = None
    title: str = Field(..., max_length=300)
    file_name: str = Field(..., max_length=255, alias="fileName")
    file_url: str = Field(..., max_length=4000, alias="fileUrl")

    model_config = {"populate_by_name": True}

    @field_validator("file_url")
    @classmethod
    def _must_be_http(cls, v: str) -> str:
        s = v.strip()
        if not (s.startswith("https://") or s.startswith("http://")):
            raise ValueError("fileUrl doit commencer par http:// ou https://")
        return s


class LearnerCvIn(BaseModel):
    skills_summary: str = Field("", max_length=16000, alias="skillsSummary")
    formations: list[LearnerFormationIn] = Field(default_factory=list)
    projects: list[LearnerProjectIn] = Field(default_factory=list)
    certifications: list[LearnerCertIn] = Field(default_factory=list)
    recommendations: list[LearnerRecommendationIn] = Field(default_factory=list)

    model_config = {"populate_by_name": True}


class ProfilePatchBody(BaseModel):
    first_name: str | None = Field(None, max_length=120, alias="firstName")
    last_name: str | None = Field(None, max_length=120, alias="lastName")
    email: EmailStr | None = None
    phone: str | None = Field(None, max_length=32)
    learner_cv: LearnerCvIn | None = Field(None, alias="learnerCv")

    model_config = {"populate_by_name": True}


@router.post("/register")
def register(body: RegisterBody, db: Db):
    try:
        email = _email_strict(str(body.email))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    name = (body.name or "").strip() or None
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=409, detail="Cet email est déjà utilisé.")
    uid = _new_user_id()
    u = User(
        id=uid,
        email=email,
        name=name,
        password_hash=hash_password(body.password),
        role="apprenant",
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    link_pending_members_for_user(db, u)
    apply_pending_staff_invites(db, u)
    db.refresh(u)
    log_action(
        db,
        None,
        f"Inscription de {u.email}",
        None,
        entity_kind="member",
        entity_id=str(u.id),
    )
    db.commit()
    token = create_access_token(
        u.id, u.email, settings.auth_secret, role=token_role_from_user(u)
    )
    return {"ok": True, "user": _user_out(u, db), "access_token": token}


@router.post("/login")
def login(body: LoginBody, db: Db):
    try:
        email = _email_strict(str(body.email))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    u = db.query(User).filter(User.email == email).first()
    if not u:
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect.")
    if not u.password_hash:
        raise HTTPException(
            status_code=401,
            detail="Ce compte utilise la connexion Google. Cliquez sur « Continuer avec Google ».",
        )
    if not verify_password(body.password, u.password_hash):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect.")
    link_pending_members_for_user(db, u)
    apply_pending_staff_invites(db, u)
    db.refresh(u)
    token = create_access_token(
        u.id, u.email, settings.auth_secret, role=token_role_from_user(u)
    )
    return {"ok": True, "user": _user_out(u, db), "access_token": token}


@router.get("/me")
def read_me(
    db: Db,
    authorization: str | None = Header(None),
):
    u = get_user_from_bearer(authorization, db)
    db.refresh(u)
    return _user_out(u, db)


@router.patch("/profile")
def patch_profile(
    body: ProfilePatchBody,
    db: Db,
    authorization: str | None = Header(None),
):
    u = get_user_from_bearer(authorization, db)
    if body.first_name is not None:
        u.first_name = body.first_name.strip() or None
    if body.last_name is not None:
        u.last_name = body.last_name.strip() or None
    if body.phone is not None:
        u.phone = body.phone.strip() or None
    if body.email is not None:
        new_email = str(body.email).strip().lower()
        if new_email != u.email:
            taken = (
                db.query(User)
                .filter(User.email == new_email, User.id != u.id)
                .first()
            )
            if taken:
                raise HTTPException(status_code=409, detail="Cet email est déjà utilisé.")
            u.email = new_email
    if body.learner_cv is not None:
        raw = body.learner_cv.model_dump(by_alias=True, mode="json")
        for arr_key in ("formations", "projects", "certifications", "recommendations"):
            for item in raw.get(arr_key) or []:
                if not item.get("id"):
                    item["id"] = str(uuid.uuid4())
        u.learner_cv = raw

    if u.first_name or u.last_name:
        parts = [p for p in [u.first_name or "", u.last_name or ""] if p.strip()]
        u.name = " ".join(parts).strip() or u.name

    db.commit()
    link_pending_members_for_user(db, u)
    db.refresh(u)
    return {"ok": True, "user": _user_out(u, db)}


@router.post("/profile/photo")
def upload_profile_photo(
    db: Db,
    file: UploadFile = File(...),
    authorization: str | None = Header(None),
):
    u = get_user_from_bearer(authorization, db)
    ext = Path(file.filename or "photo.jpg").suffix.lower()
    if ext not in ALLOWED_PHOTO_EXT:
        raise HTTPException(
            status_code=400,
            detail=f"Format non supporté ({ext}). Utilisez jpg, png ou webp.",
        )
    data = file.file.read()
    if len(data) > MAX_PHOTO_SIZE:
        raise HTTPException(status_code=400, detail="Le fichier dépasse 5 Mo.")
    filename = f"{u.id}{ext}"
    dest = PHOTO_DIR / filename
    dest.write_bytes(data)
    photo_url = f"/uploads/photos/{filename}"
    u.photo_url = photo_url
    db.commit()
    db.refresh(u)
    return {"ok": True, "user": _user_out(u, db)}


def _exchange_google_code(code: str) -> dict:
    if not settings.google_client_id or not settings.google_client_secret:
        raise HTTPException(status_code=503, detail="Google OAuth non configuré.")
    body = {
        "code": code,
        "client_id": settings.google_client_id,
        "client_secret": settings.google_client_secret,
        "redirect_uri": settings.google_redirect_uri,
        "grant_type": "authorization_code",
    }
    with httpx.Client() as client:
        r = client.post(
            "https://oauth2.googleapis.com/token",
            data=body,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        if r.status_code != 200:
            raise HTTPException(status_code=400, detail="Échange code Google échoué.")
        data = r.json()
        access = data.get("access_token")
        if not access:
            raise HTTPException(status_code=400, detail="Token Google manquant.")
        u = client.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {access}"},
        )
        if u.status_code != 200:
            raise HTTPException(status_code=400, detail="Profil Google indisponible.")
        return u.json()


@router.post("/google/exchange")
def google_exchange(body: GoogleExchangeBody, db: Db):
    profile = _exchange_google_code(body.code)
    email_raw = profile.get("email")
    if not email_raw:
        raise HTTPException(status_code=400, detail="Google n’a pas fourni d’email.")
    if profile.get("email_verified") is not True:
        raise HTTPException(status_code=400, detail="L’email Google doit être vérifié chez Google.")
    email = email_raw.lower().strip()
    sub = profile.get("sub")
    if not sub:
        raise HTTPException(status_code=400, detail="Profil Google incomplet.")
    name = profile.get("name") or None

    user = db.query(User).filter(User.google_id == sub).first()
    if not user:
        by_email = db.query(User).filter(User.email == email).first()
        if by_email:
            if by_email.google_id and by_email.google_id != sub:
                raise HTTPException(
                    status_code=400,
                    detail="Ce compte est déjà lié à un autre profil Google.",
                )
            by_email.google_id = sub
            if not by_email.name:
                by_email.name = name
            user = by_email
        else:
            user = User(
                id=_new_user_id(),
                email=email,
                name=name,
                password_hash=None,
                google_id=sub,
                role="apprenant",
            )
            db.add(user)
    else:
        if user.email != email:
            raise HTTPException(status_code=400, detail="Incohérence de compte Google.")

    db.commit()
    link_pending_members_for_user(db, user)
    apply_pending_staff_invites(db, user)
    db.refresh(user)
    log_action(
        db,
        None,
        f"Inscription de {user.email}",
        None,
        entity_kind="member",
        entity_id=str(user.id),
    )
    db.commit()
    token = create_access_token(
        user.id, user.email, settings.auth_secret, role=token_role_from_user(user)
    )
    db.refresh(user)
    return {"ok": True, "user": _user_out(user, db), "access_token": token}
