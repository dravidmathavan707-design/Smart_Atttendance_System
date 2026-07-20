"""Add multi-department mapping for staff

Revision ID: 7f16a4b9c2de
Revises: b2e1d4a81f4c
Create Date: 2026-07-21 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7f16a4b9c2de'
down_revision: Union[str, Sequence[str], None] = 'b2e1d4a81f4c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'control_user_departments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('control_user_id', sa.Integer(), nullable=False),
        sa.Column('department_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['control_user_id'], ['control_users.id']),
        sa.ForeignKeyConstraint(['department_id'], ['departments.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('control_user_id', 'department_id', name='uq_control_user_department'),
    )

    op.execute(
        """
        INSERT INTO control_user_departments (control_user_id, department_id)
        SELECT id, department_id
        FROM control_users
        WHERE role_id IN (SELECT id FROM roles WHERE name = 'staff')
          AND department_id IS NOT NULL
        ON CONFLICT DO NOTHING
        """
    )


def downgrade() -> None:
    op.drop_table('control_user_departments')
