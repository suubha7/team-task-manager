from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.models import User, Project, ProjectMember, ProjectMemberRole, UserRole
from schemas.schemas import (
    ProjectCreate, ProjectUpdate, ProjectOut,
    ProjectMemberOut, AddMemberRequest
)
from dependencies.deps import (
    get_current_user, require_admin,
    get_project_member, require_project_admin
)

router = APIRouter(prefix="/projects", tags=["Projects"])


def _get_project_or_404(project_id: str, db: Session) -> Project:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


def _is_project_member(project_id: str, user_id: str, db: Session) -> bool:
    return db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == user_id,
    ).first() is not None


@router.post("/", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = Project(
        name=payload.name,
        description=payload.description,
        owner_id=current_user.id,
    )
    db.add(project)
    db.flush()  # get the project ID before committing

    # Auto-add creator as project admin
    membership = ProjectMember(
        project_id=project.id,
        user_id=current_user.id,
        role=ProjectMemberRole.admin,
    )
    db.add(membership)
    db.commit()
    db.refresh(project)
    return project


@router.get("/", response_model=List[ProjectOut])
def list_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Admins see all projects; members see only their projects
    if current_user.role == UserRole.admin:
        return db.query(Project).all()

    memberships = (
        db.query(ProjectMember)
        .filter(ProjectMember.user_id == current_user.id)
        .all()
    )
    project_ids = [m.project_id for m in memberships]
    return db.query(Project).filter(Project.id.in_(project_ids)).all()


@router.get("/{project_id}", response_model=ProjectOut)
def get_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = _get_project_or_404(project_id, db)

    # Access check
    if current_user.role != UserRole.admin:
        if not _is_project_member(project_id, current_user.id, db):
            raise HTTPException(status_code=403, detail="Not a member of this project")

    return project


@router.patch("/{project_id}", response_model=ProjectOut)
def update_project(
    project_id: str,
    payload: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_project_admin),
):
    project = _get_project_or_404(project_id, db)

    if payload.name is not None:
        project.name = payload.name
    if payload.description is not None:
        project.description = payload.description

    db.commit()
    db.refresh(project)
    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = _get_project_or_404(project_id, db)

    # Only global admin or project owner can delete
    if current_user.role != UserRole.admin and project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the project owner can delete this project")

    db.delete(project)
    db.commit()


# ── Member Management ─────────────────────────────────────────────────────────

@router.post("/{project_id}/members", response_model=ProjectMemberOut, status_code=201)
def add_member(
    project_id: str,
    payload: AddMemberRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_project_admin),
):
    _get_project_or_404(project_id, db)

    # Check user exists
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check not already a member
    if _is_project_member(project_id, payload.user_id, db):
        raise HTTPException(status_code=400, detail="User is already a member")

    membership = ProjectMember(
        project_id=project_id,
        user_id=payload.user_id,
        role=payload.role,
    )
    db.add(membership)
    db.commit()
    db.refresh(membership)
    return membership


@router.delete("/{project_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member(
    project_id: str,
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_project_admin),
):
    membership = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == user_id,
    ).first()

    if not membership:
        raise HTTPException(status_code=404, detail="Member not found")

    db.delete(membership)
    db.commit()
