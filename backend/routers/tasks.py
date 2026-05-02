from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from database import get_db
from models.models import (
    User, Task, Project, ProjectMember,
    TaskStatus, UserRole, TaskPriority
)
from schemas.schemas import TaskCreate, TaskUpdate, TaskOut, DashboardStats
from dependencies.deps import get_current_user

router = APIRouter(prefix="/tasks", tags=["Tasks"])


def _user_can_access_project(project_id: str, user: User, db: Session) -> bool:
    if user.role == UserRole.admin:
        return True
    return db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == user.id,
    ).first() is not None


def _get_task_or_404(task_id: str, db: Session) -> Task:
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.get("/dashboard", response_model=DashboardStats)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Aggregated stats for the current user's dashboard."""
    today = date.today()

    if current_user.role == UserRole.admin:
        tasks_query = db.query(Task)
        projects_count = db.query(Project).count()
    else:
        memberships = db.query(ProjectMember).filter(
            ProjectMember.user_id == current_user.id
        ).all()
        project_ids = [m.project_id for m in memberships]
        tasks_query = db.query(Task).filter(Task.project_id.in_(project_ids))
        projects_count = len(project_ids)

    all_tasks = tasks_query.all()

    return DashboardStats(
        total_tasks=len(all_tasks),
        todo=sum(1 for t in all_tasks if t.status == TaskStatus.todo),
        in_progress=sum(1 for t in all_tasks if t.status == TaskStatus.in_progress),
        done=sum(1 for t in all_tasks if t.status == TaskStatus.done),
        overdue=sum(
            1 for t in all_tasks
            if t.due_date and t.due_date < today and t.status != TaskStatus.done
        ),
        total_projects=projects_count,
    )


@router.post("/", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
def create_task(
    payload: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Verify user has access to the project
    if not _user_can_access_project(payload.project_id, current_user, db):
        raise HTTPException(status_code=403, detail="Not a member of this project")

    # Verify project exists
    project = db.query(Project).filter(Project.id == payload.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Verify assignee is a project member (if provided)
    if payload.assignee_id:
        assignee = db.query(User).filter(User.id == payload.assignee_id).first()
        if not assignee:
            raise HTTPException(status_code=404, detail="Assignee not found")

    task = Task(
        title=payload.title,
        description=payload.description,
        status=payload.status,
        priority=payload.priority,
        project_id=payload.project_id,
        assignee_id=payload.assignee_id,
        creator_id=current_user.id,
        due_date=payload.due_date,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.get("/", response_model=List[TaskOut])
def list_tasks(
    project_id: Optional[str] = Query(None),
    status: Optional[TaskStatus] = Query(None),
    priority: Optional[TaskPriority] = Query(None),
    assigned_to_me: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Task)

    # Scope by membership unless admin
    if current_user.role != UserRole.admin:
        memberships = db.query(ProjectMember).filter(
            ProjectMember.user_id == current_user.id
        ).all()
        project_ids = [m.project_id for m in memberships]
        query = query.filter(Task.project_id.in_(project_ids))

    if project_id:
        query = query.filter(Task.project_id == project_id)
    if status:
        query = query.filter(Task.status == status)
    if priority:
        query = query.filter(Task.priority == priority)
    if assigned_to_me:
        query = query.filter(Task.assignee_id == current_user.id)

    return query.order_by(Task.created_at.desc()).all()


@router.get("/{task_id}", response_model=TaskOut)
def get_task(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = _get_task_or_404(task_id, db)

    if not _user_can_access_project(task.project_id, current_user, db):
        raise HTTPException(status_code=403, detail="Access denied")

    return task


@router.patch("/{task_id}", response_model=TaskOut)
def update_task(
    task_id: str,
    payload: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = _get_task_or_404(task_id, db)

    if not _user_can_access_project(task.project_id, current_user, db):
        raise HTTPException(status_code=403, detail="Access denied")

    if payload.title is not None:
        task.title = payload.title
    if payload.description is not None:
        task.description = payload.description
    if payload.status is not None:
        task.status = payload.status
    if payload.priority is not None:
        task.priority = payload.priority
    if payload.assignee_id is not None:
        task.assignee_id = payload.assignee_id
    if payload.due_date is not None:
        task.due_date = payload.due_date

    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = _get_task_or_404(task_id, db)

    # Global admin, project member who is admin, or task creator can delete
    can_delete = (
        current_user.role == UserRole.admin
        or task.creator_id == current_user.id
    )

    if not can_delete:
        # Check if project admin
        membership = db.query(ProjectMember).filter(
            ProjectMember.project_id == task.project_id,
            ProjectMember.user_id == current_user.id,
            ProjectMember.role == "admin",
        ).first()
        can_delete = membership is not None

    if not can_delete:
        raise HTTPException(status_code=403, detail="Permission denied")

    db.delete(task)
    db.commit()
