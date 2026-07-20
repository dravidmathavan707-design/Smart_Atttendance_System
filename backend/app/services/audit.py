from sqlalchemy.orm import Session as DBSession
from app.models.models import AuditLog


def log_action(
    db: DBSession,
    actor_id: int,
    action: str,
    target_type: str,
    target_id: int,
    details: str = "",
):
    """
    Writes one row to control_audit_log. Called after every sensitive action
    (appointments, deletions, role changes) so Master Control can trace who did what.
    Does not commit — caller should commit as part of the same transaction as the
    action itself, so the audit entry and the action succeed or fail together.
    """
    entry = AuditLog(
        actor_id=actor_id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        details=details,
    )
    db.add(entry)
