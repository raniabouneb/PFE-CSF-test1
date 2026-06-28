from fastapi import APIRouter

from app.core.auth_deps import AdminUser, StaffUser
from app.core.dependencies import Db
from app.domains.admin.dashboard.stats import (
    compute_inscription_evolution,
    compute_kpis,
    compute_recent_activities,
    compute_top_enrolled,
    compute_top_visited,
)
from app.domains.admin.schemas import AdminTodoResponse

router = APIRouter()


@router.get("", response_model=AdminTodoResponse)
def dashboard_index(_admin: AdminUser) -> AdminTodoResponse:
    return AdminTodoResponse(section="dashboard")


@router.get("/stats")
def dashboard_stats(_staff: StaffUser, db: Db) -> dict:
    return {
        "kpis": compute_kpis(db),
        "topVisited": compute_top_visited(db),
        "topEnrolled": compute_top_enrolled(db),
        "inscriptionEvolution": compute_inscription_evolution(db),
        "recentActivities": compute_recent_activities(db),
    }

