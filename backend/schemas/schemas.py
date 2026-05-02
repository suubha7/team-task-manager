from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime, date
from models.models import UserRole, ProjectMemberRole, TaskStatus, TaskPriority


# ── Auth Schemas ──────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    full_name: str
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        if len(v.encode("utf-8")) > 72:
            raise ValueError("Password must be 72 bytes or fewer")
        return v

    @field_validator("full_name")
    @classmethod
    def name_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Full name cannot be empty")
        return v.strip()


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ── User Schemas ──────────────────────────────────────────────────────────────

class UserOut(BaseModel):
    id: str
    full_name: str
    email: str
    role: UserRole
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserUpdateRole(BaseModel):
    role: UserRole


# ── Project Schemas ───────────────────────────────────────────────────────────

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Project name cannot be empty")
        return v.strip()


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class ProjectMemberOut(BaseModel):
    id: str
    user_id: str
    role: ProjectMemberRole
    joined_at: datetime
    user: UserOut

    model_config = {"from_attributes": True}


class ProjectOut(BaseModel):
    id: str
    name: str
    description: Optional[str]
    owner_id: str
    created_at: datetime
    owner: UserOut
    members: List[ProjectMemberOut] = []

    model_config = {"from_attributes": True}


class ProjectOutSimple(BaseModel):
    id: str
    name: str
    description: Optional[str]
    owner_id: str
    created_at: datetime

    model_config = {"from_attributes": True}


class AddMemberRequest(BaseModel):
    user_id: str
    role: ProjectMemberRole = ProjectMemberRole.member


# ── Task Schemas ──────────────────────────────────────────────────────────────

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.todo
    priority: TaskPriority = TaskPriority.medium
    project_id: str
    assignee_id: Optional[str] = None
    due_date: Optional[date] = None

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Task title cannot be empty")
        return v.strip()


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    assignee_id: Optional[str] = None
    due_date: Optional[date] = None


class TaskOut(BaseModel):
    id: str
    title: str
    description: Optional[str]
    status: TaskStatus
    priority: TaskPriority
    project_id: str
    assignee_id: Optional[str]
    creator_id: str
    due_date: Optional[date]
    created_at: datetime
    updated_at: datetime
    assignee: Optional[UserOut] = None
    creator: UserOut
    project: ProjectOutSimple

    model_config = {"from_attributes": True}


# ── Dashboard Schema ──────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_tasks: int
    todo: int
    in_progress: int
    done: int
    overdue: int
    total_projects: int
