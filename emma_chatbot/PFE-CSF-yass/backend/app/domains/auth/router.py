import uuid

import httpx
import jwt as pyjwt
from jwt.exceptions import InvalidTokenError
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, EmailStr, Field, field_validator
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.dependencies import Db
from app.core.security import create_access_token, hash_password, verify_password
from app.persistence.models import User

router = APIRouter(prefix="/auth", tags=["auth"])

_VALID_ROLES = frozenset({"apprenant", "visiteur", "admin", "assistant"})

# Valeurs parfois saisies à la main en base ou dans d’autres outils
_ROLE_ALIASES: dict[str, str] = {
    "administrator": "admin",
    "administrateur": "admin",
    "superadmin": "admin",
    "super_admin": "admin",
    "root": "admin",
}


def _normalize_role(role: str | None) -> str:
    if not role:
        return "apprenant"
    r = str(role).strip().lower().strip("'\"")
    r = _ROLE_ALIASES.get(r, r)
    return r if r in _VALID_ROLES else "apprenant"


def _token_role_from_user(u: User) -> str:
    raw = getattr(u, "role", None)
    return _normalize_role(raw)


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


def _user_out(u: User) -> dict:
    return {
        "id": u.id,
        "email": u.email,
        "name": u.name,
        "role": _token_role_from_user(u),
        "firstName": u.first_name,
        "lastName": u.last_name,
        "phone": u.phone,
        "learnerCv": u.learner_cv,
    }


def _user_from_bearer(authorization: str | None, db: Session) -> User:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Non authentifié")
    token = authorization.split(" ", 1)[1].strip()
    try:
        payload = pyjwt.decode(token, settings.auth_secret, algorithms=["HS256"])
    except InvalidTokenError as e:
        raise HTTPException(status_code=401, detail="Session invalide") from e
    uid = payload.get("sub")
    if not uid or not isinstance(uid, str):
        raise HTTPException(status_code=401, detail="Session invalide")
    u = db.query(User).filter(User.id == uid).first()
    if not u:
        raise HTTPException(status_code=401, detail="Utilisateur introuvable")
    return u


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
    token = create_access_token(
        u.id, u.email, settings.auth_secret, role=_token_role_from_user(u)
    )
    return {"ok": True, "user": _user_out(u), "access_token": token}


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
    db.refresh(u)
    token = create_access_token(
        u.id, u.email, settings.auth_secret, role=_token_role_from_user(u)
    )
    return {"ok": True, "user": _user_out(u), "access_token": token}


@router.get("/me")
def read_me(
    db: Db,
    authorization: str | None = Header(None),
):
    u = _user_from_bearer(authorization, db)
    db.refresh(u)
    return _user_out(u)


@router.patch("/profile")
def patch_profile(
    body: ProfilePatchBody,
    db: Db,
    authorization: str | None = Header(None),
):
    u = _user_from_bearer(authorization, db)
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
    db.refresh(u)
    return {"ok": True, "user": _user_out(u)}


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
    db.refresh(user)
    token = create_access_token(
        user.id, user.email, settings.auth_secret, role=_token_role_from_user(user)
    )
    db.refresh(user)
    return {"ok": True, "user": _user_out(user), "access_token": token}
