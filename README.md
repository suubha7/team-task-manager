# Team Task Manager

A full-stack team collaboration app with role-based access control, built with **FastAPI** and **React**.

🔗 **Live Demo:** [your-app.railway.app](https://your-app.railway.app)  
🎥 **Demo Video:** [Watch here](#)  
📦 **GitHub:** [github.com/suubha7/team-task-manager](https://github.com/suubha7/team-task-manager)

---

## Features

- **Authentication** — JWT-based signup/login, bcrypt password hashing
- **Role-Based Access Control** — Global Admin vs Member, Project-level Admin vs Member
- **Project Management** — Create projects, manage team members, set roles
- **Task Tracking** — Create tasks, assign to members, set priority/due date, track status
- **Kanban Board** — Visual task board with To Do / In Progress / Done columns
- **Dashboard** — Stats overview: total tasks, overdue, by status, project count
- **Admin Panel** — Manage all users, change roles, deactivate accounts

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI (Python 3.11) |
| ORM | SQLAlchemy 2.0 |
| Validation | Pydantic v2 |
| Auth | JWT (python-jose) + bcrypt (passlib) |
| Database | PostgreSQL (Railway) / SQLite (local) |
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| HTTP Client | Axios |
| Deployment | Railway (backend + DB) + Vercel (frontend) |

---

## Architecture

```
team-task-manager/
├── backend/
│   ├── main.py               # FastAPI app, CORS, routers
│   ├── database.py           # SQLAlchemy engine + session
│   ├── core/
│   │   ├── config.py         # Settings from env vars
│   │   └── security.py       # JWT + bcrypt helpers
│   ├── models/
│   │   └── models.py         # User, Project, ProjectMember, Task
│   ├── schemas/
│   │   └── schemas.py        # Pydantic request/response schemas
│   ├── routers/
│   │   ├── auth.py           # /api/auth/*
│   │   ├── users.py          # /api/users/*
│   │   ├── projects.py       # /api/projects/*
│   │   └── tasks.py          # /api/tasks/*
│   ├── dependencies/
│   │   └── deps.py           # get_current_user, RBAC guards
│   ├── Dockerfile
│   └── requirements.txt
└── frontend/
    └── src/
        ├── pages/            # Login, Register, Dashboard, Projects, Admin
        ├── components/       # Layout, Navbar
        ├── api/              # Axios instance with JWT interceptor
        └── context/          # AuthContext (global user state)
```

---

## RBAC Design

| Action | Global Admin | Project Admin | Project Member | Non-member |
|---|---|---|---|---|
| View all projects | ✅ | ❌ | ❌ | ❌ |
| Create project | ✅ | ✅ | ✅ | ✅ |
| Delete project | ✅ | Owner only | ❌ | ❌ |
| Add/remove members | ✅ | ✅ | ❌ | ❌ |
| Create/edit tasks | ✅ | ✅ | ✅ | ❌ |
| Delete any task | ✅ | ✅ | Own only | ❌ |
| Manage user roles | ✅ | ❌ | ❌ | ❌ |

---

## API Reference

Full interactive docs available at `/docs` (Swagger UI) and `/redoc`.

### Auth
```
POST   /api/auth/register     Sign up
POST   /api/auth/login        Login → returns JWT
GET    /api/auth/me           Current user profile
```

### Projects
```
GET    /api/projects/                     List my projects
POST   /api/projects/                     Create project
GET    /api/projects/{id}                 Project detail + members
PATCH  /api/projects/{id}                 Update project
DELETE /api/projects/{id}                 Delete project
POST   /api/projects/{id}/members         Add member
DELETE /api/projects/{id}/members/{uid}   Remove member
```

### Tasks
```
GET    /api/tasks/dashboard    Dashboard stats
GET    /api/tasks/             List tasks (filterable)
POST   /api/tasks/             Create task
GET    /api/tasks/{id}         Task detail
PATCH  /api/tasks/{id}         Update task
DELETE /api/tasks/{id}         Delete task
```

### Users (Admin only)
```
GET    /api/users/             List all users
PATCH  /api/users/{id}/role    Change user role
DELETE /api/users/{id}         Deactivate user
```

---

## Local Development

### Prerequisites
- Python 3.11+
- Node.js 18+

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment
cp .env.example .env
# Edit .env if needed (SQLite works out of the box)

# Run
uvicorn main:app --reload
# API running at http://localhost:8000
# Swagger docs at http://localhost:8000/docs
```

### Frontend

```bash
cd frontend

npm install

cp .env.example .env
# VITE_API_URL=http://localhost:8000/api (default)

npm run dev
# App running at http://localhost:5173
```

---

## Deployment

### Backend → Railway

1. Push `backend/` folder to GitHub
2. Create new Railway project → **Deploy from GitHub repo**
3. Add a **PostgreSQL** database service in Railway
4. Set environment variables in Railway:
   ```
   DATABASE_URL=<Railway PostgreSQL connection string>
   SECRET_KEY=<random 32+ char string>
   ```
5. Railway auto-detects `Dockerfile` and deploys

### Frontend → Vercel

1. Push `frontend/` folder to GitHub
2. Import repo in [vercel.com](https://vercel.com)
3. Set environment variable:
   ```
   VITE_API_URL=https://your-railway-app.railway.app/api
   ```
4. Deploy — `vercel.json` handles SPA routing automatically

---

## Design Decisions

**Why FastAPI?**  
Async-ready, auto-generates OpenAPI docs, excellent Pydantic integration. Chosen because it maps directly to production patterns used in AI/ML microservices.

**Why SQLite → PostgreSQL?**  
SQLite for zero-config local development; same SQLAlchemy ORM code switches to PostgreSQL via a single env var change. No migrations needed for this scope — `create_all()` is sufficient.

**Why UUID primary keys?**  
Avoids sequential ID guessing in API calls, better for distributed systems.

**Why JWT (stateless)?**  
No server-side session storage needed. Scales horizontally without sticky sessions or shared cache.

---

## Author

**Subham Maharana** — Generative AI Engineer  
[LinkedIn](https://linkedin.com/in/subham-maharana-261668371) · [GitHub](https://github.com/suubha7)
