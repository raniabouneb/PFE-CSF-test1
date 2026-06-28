from fastapi import APIRouter
from pydantic import BaseModel, EmailStr, Field

from app.core.auth_deps import AdminUser
from app.core.dependencies import Db
from app.domains.admin.staff.permissions import STAFF_SECTIONS
from app.domains.admin.journal.service import log_action
from app.domains.admin.staff.service import (
    add_staff_invite,
    get_team,
    revoke_admin_user,
    revoke_staff_invite,
    update_staff_permissions,
)

router = APIRouter(prefix="/staff", tags=["staff"])


class SectionPermBody(BaseModel):
    read: bool = False
    write: bool = False


class PermissionsBody(BaseModel):
    dashboard: SectionPermBody | None = None
    apprenants: SectionPermBody | None = None
    catalogue: SectionPermBody | None = None
    planning: SectionPermBody | None = None
    validation: SectionPermBody | None = None
    journal: SectionPermBody | None = None

    def to_dict(self) -> dict:
        out: dict = {}
        for section in STAFF_SECTIONS:
            block = getattr(self, section, None)
            if block is not None:
                out[section] = {"read": block.read, "write": block.write}
        return out


class StaffInviteBody(BaseModel):
    email: EmailStr
    role: str = Field(default="assistant", pattern="^(assistant|admin)$")
    permissions: PermissionsBody | None = None


class StaffPermissionsPatch(BaseModel):
    permissions: PermissionsBody


@router.get("/team")
def staff_team(_admin: AdminUser, db: Db) -> list[dict]:
    return get_team(db)


@router.post("/team")
def staff_team_add(body: StaffInviteBody, admin: AdminUser, db: Db) -> dict:
    perms = body.permissions.to_dict() if body.permissions else None
    result = add_staff_invite(
        db,
        str(body.email),
        admin.id,
        role=body.role,
        permissions=perms,
    )
    log_action(db, admin, "Assistante invitée", str(body.email), entity_kind="staff")
    db.commit()
    return result


@router.patch("/team/{invite_id}/permissions")
def staff_team_permissions(
    invite_id: int,
    body: StaffPermissionsPatch,
    admin: AdminUser,
    db: Db,
) -> dict:
    return update_staff_permissions(
        db,
        invite_id,
        body.permissions.to_dict(),
        current_admin_id=admin.id,
    )


@router.delete("/team/{invite_id}")
def staff_team_revoke(invite_id: int, admin: AdminUser, db: Db) -> dict:
    result = revoke_staff_invite(db, invite_id, admin.id)
    log_action(
        db,
        admin,
        "Rôle assistante révoqué",
        f"Invite #{invite_id}",
        entity_kind="staff",
        entity_id=str(invite_id),
    )
    db.commit()
    return result


@router.delete("/team/admin/{user_id}")
def staff_admin_revoke(user_id: str, admin: AdminUser, db: Db) -> dict:
    return revoke_admin_user(db, user_id, admin.id)
