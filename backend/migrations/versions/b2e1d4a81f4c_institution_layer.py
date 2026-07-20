"""Add institution layer for control users and students

Revision ID: b2e1d4a81f4c
Revises: d83edb06f8e2
Create Date: 2026-07-19 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'b2e1d4a81f4c'
down_revision: Union[str, Sequence[str], None] = 'd83edb06f8e2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'institutions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=150), nullable=False),
        sa.Column('type', sa.String(length=50), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=True),
        sa.Column('email_domain', sa.String(length=100), nullable=True),
        sa.Column('logo', sa.String(length=255), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

    op.add_column('control_users', sa.Column('institution_id', sa.Integer(), nullable=True))
    op.add_column('students', sa.Column('institution_id', sa.Integer(), nullable=True))

    op.execute("""
    INSERT INTO institutions (id, name, type, code, email_domain, status)
    VALUES
        (1, 'Anna University', 'University', 'ANU', 'annauniv.edu', 'active'),
        (2, 'XYZ Engineering College', 'Institution', 'XYZ', 'xyz.edu', 'active'),
        (3, 'ABC Polytechnic', 'Institution', 'ABC', 'abcpoly.edu', 'active')
    ON CONFLICT (id) DO NOTHING
    """)

    op.execute("UPDATE control_users SET institution_id = COALESCE(institution_id, 1) WHERE institution_id IS NULL")
    op.execute("UPDATE students SET institution_id = COALESCE(institution_id, 1) WHERE institution_id IS NULL")

    op.create_foreign_key('fk_control_users_institution_id_institutions', 'control_users', 'institutions', ['institution_id'], ['id'])
    op.create_foreign_key('fk_students_institution_id_institutions', 'students', 'institutions', ['institution_id'], ['id'])

    op.drop_constraint('control_users_email_key', 'control_users', type_='unique')
    op.create_unique_constraint('uq_control_users_institution_email', 'control_users', ['institution_id', 'email'])

    op.drop_constraint('students_email_key', 'students', type_='unique')
    op.create_unique_constraint('uq_students_institution_email', 'students', ['institution_id', 'email'])

    op.alter_column('control_users', 'institution_id', nullable=False)
    op.alter_column('students', 'institution_id', nullable=False)


def downgrade() -> None:
    op.drop_constraint('uq_students_institution_email', 'students', type_='unique')
    op.create_unique_constraint('students_email_key', 'students', ['email'])
    op.drop_constraint('uq_control_users_institution_email', 'control_users', type_='unique')
    op.create_unique_constraint('control_users_email_key', 'control_users', ['email'])

    op.drop_constraint('fk_students_institution_id_institutions', 'students', type_='foreignkey')
    op.drop_constraint('fk_control_users_institution_id_institutions', 'control_users', type_='foreignkey')

    op.drop_column('students', 'institution_id')
    op.drop_column('control_users', 'institution_id')
    op.drop_table('institutions')
