from fastapi import APIRouter

from app.core.auth_deps import AdminUser, StaffUser
from app.domains.admin.schemas import AdminTodoResponse

router = APIRouter()


@router.get("", response_model=AdminTodoResponse)
def journal_index(_staff: StaffUser) -> AdminTodoResponse:
    return AdminTodoResponse(section="journal")

