from pydantic import BaseModel


class AdminTodoResponse(BaseModel):
    """Réponse transitoire pour endpoints en cours d'implémentation."""

    ok: bool = True
    section: str
    message: str = "Endpoint prêt pour implémentation backend."

