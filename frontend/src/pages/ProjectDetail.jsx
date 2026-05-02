import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

const STATUS_COLS = [
  { key: 'todo', label: 'To Do', color: 'bg-gray-100' },
  { key: 'in_progress', label: 'In Progress', color: 'bg-blue-50' },
  { key: 'done', label: 'Done', color: 'bg-green-50' },
]

function TaskCard({ task, members, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [status, setStatus] = useState(task.status)
  const [assignee, setAssignee] = useState(task.assignee_id || '')

  const handleSave = async () => {
    try {
      const { data } = await api.patch(`/tasks/${task.id}`, {
        status,
        assignee_id: assignee || null,
      })
      onUpdate(data)
      setEditing(false)
      toast.success('Task updated')
    } catch {
      toast.error('Failed to update')
    }
  }

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done'

  return (
    <div className={`bg-white rounded-lg p-3 shadow-sm border ${isOverdue ? 'border-red-200' : 'border-gray-100'}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium text-gray-800 flex-1">{task.title}</p>
        <button onClick={() => setEditing(!editing)} className="text-gray-400 hover:text-gray-600 text-xs shrink-0">
          ✏️
        </button>
      </div>

      {task.description && (
        <p className="text-xs text-gray-500 mb-2 line-clamp-2">{task.description}</p>
      )}

      <div className="flex flex-wrap gap-1 mb-2">
        <span className={`badge-${task.priority}`}>{task.priority}</span>
        {isOverdue && <span className="text-xs text-red-500 font-medium">⚠ overdue</span>}
      </div>

      {task.due_date && (
        <p className="text-xs text-gray-400 mb-2">Due: {task.due_date}</p>
      )}

      {task.assignee && (
        <p className="text-xs text-gray-400">👤 {task.assignee.full_name}</p>
      )}

      {editing && (
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
          <select
            className="input text-sm py-1"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
          <select
            className="input text-sm py-1"
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
          >
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.user_id} value={m.user_id}>{m.user.full_name}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button className="btn-primary text-xs py-1 px-3" onClick={handleSave}>Save</button>
            <button className="btn-secondary text-xs py-1 px-3" onClick={() => setEditing(false)}>Cancel</button>
            <button
              className="text-xs text-red-500 hover:text-red-700 ml-auto"
              onClick={() => onDelete(task.id)}
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function CreateTaskModal({ projectId, members, onClose, onCreated }) {
  const { user } = useAuth()
  const [form, setForm] = useState({
    title: '', description: '', priority: 'medium',
    status: 'todo', assignee_id: '', due_date: '', project_id: projectId,
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = { ...form, assignee_id: form.assignee_id || null, due_date: form.due_date || null }
      const { data } = await api.post('/tasks/', payload)
      toast.success('Task created!')
      onCreated(data)
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create task')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <h3 className="font-semibold text-lg mb-4">New task</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign to</label>
            <select className="input" value={form.assignee_id} onChange={(e) => setForm({ ...form, assignee_id: e.target.value })}>
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>{m.user.full_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due date</label>
            <input className="input" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Creating...' : 'Create task'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AddMemberModal({ projectId, onClose, onAdded }) {
  const [users, setUsers] = useState([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [role, setRole] = useState('member')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/users/').then((res) => setUsers(res.data)).catch(() => {})
  }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!selectedUserId) return
    setLoading(true)
    try {
      const { data } = await api.post(`/projects/${projectId}/members`, {
        user_id: selectedUserId, role
      })
      toast.success('Member added!')
      onAdded(data)
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add member')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
        <h3 className="font-semibold text-lg mb-4">Add member</h3>
        <form onSubmit={handleAdd} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
            <select className="input" value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} required>
              <option value="">Select user...</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Adding...' : 'Add'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [activeTab, setActiveTab] = useState('board')

  useEffect(() => {
    Promise.all([
      api.get(`/projects/${id}`),
      api.get(`/tasks/?project_id=${id}`),
    ]).then(([projRes, tasksRes]) => {
      setProject(projRes.data)
      setTasks(tasksRes.data)
    }).catch(() => navigate('/projects'))
      .finally(() => setLoading(false))
  }, [id])

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return
    try {
      await api.delete(`/tasks/${taskId}`)
      setTasks(tasks.filter((t) => t.id !== taskId))
      toast.success('Task deleted')
    } catch {
      toast.error('Failed to delete task')
    }
  }

  const handleRemoveMember = async (userId) => {
    if (!confirm('Remove this member?')) return
    try {
      await api.delete(`/projects/${id}/members/${userId}`)
      setProject({ ...project, members: project.members.filter((m) => m.user_id !== userId) })
      toast.success('Member removed')
    } catch {
      toast.error('Failed to remove member')
    }
  }

  const isProjectAdmin = isAdmin || project?.members?.find(
    (m) => m.user_id === user?.id && m.role === 'admin'
  )

  if (loading) return <div className="text-gray-400">Loading...</div>
  if (!project) return null

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <button onClick={() => navigate('/projects')} className="text-sm text-gray-400 hover:text-gray-600 mb-2">
            ← Back to projects
          </button>
          <h2 className="text-2xl font-bold text-gray-900">{project.name}</h2>
          {project.description && <p className="text-gray-500 mt-1">{project.description}</p>}
        </div>
        <button className="btn-primary" onClick={() => setShowTaskModal(true)}>
          + New task
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {['board', 'members'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'board' ? `Board (${tasks.length})` : `Members (${project.members?.length || 0})`}
          </button>
        ))}
      </div>

      {/* Board view */}
      {activeTab === 'board' && (
        <div className="grid grid-cols-3 gap-4">
          {STATUS_COLS.map(({ key, label, color }) => {
            const colTasks = tasks.filter((t) => t.status === key)
            return (
              <div key={key} className={`rounded-xl p-4 ${color}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm text-gray-700">{label}</h3>
                  <span className="text-xs bg-white rounded-full px-2 py-0.5 text-gray-500 font-medium">
                    {colTasks.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {colTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      members={project.members || []}
                      onUpdate={(updated) => setTasks(tasks.map((t) => t.id === updated.id ? updated : t))}
                      onDelete={handleDeleteTask}
                    />
                  ))}
                  {colTasks.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-4">No tasks</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Members view */}
      {activeTab === 'members' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Team members</h3>
            {isProjectAdmin && (
              <button className="btn-secondary text-sm" onClick={() => setShowMemberModal(true)}>
                + Add member
              </button>
            )}
          </div>
          <div className="space-y-3">
            {project.members?.map((member) => (
              <div key={member.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm">
                    {member.user?.full_name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{member.user?.full_name}</p>
                    <p className="text-xs text-gray-400">{member.user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    member.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {member.role}
                  </span>
                  {isProjectAdmin && member.user_id !== user?.id && (
                    <button
                      onClick={() => handleRemoveMember(member.user_id)}
                      className="text-xs text-red-400 hover:text-red-600"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showTaskModal && (
        <CreateTaskModal
          projectId={id}
          members={project.members || []}
          onClose={() => setShowTaskModal(false)}
          onCreated={(t) => setTasks([t, ...tasks])}
        />
      )}
      {showMemberModal && (
        <AddMemberModal
          projectId={id}
          onClose={() => setShowMemberModal(false)}
          onAdded={(m) => setProject({ ...project, members: [...(project.members || []), m] })}
        />
      )}
    </div>
  )
}
