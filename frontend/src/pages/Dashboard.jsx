import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

function StatCard({ label, value, color, icon }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [recentTasks, setRecentTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/tasks/dashboard'),
      api.get('/tasks/?assigned_to_me=true'),
    ]).then(([statsRes, tasksRes]) => {
      setStats(statsRes.data)
      setRecentTasks(tasksRes.data.slice(0, 5))
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-gray-400">Loading dashboard...</div>

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">
          Hello, {user?.full_name?.split(' ')[0]} 👋
        </h2>
        <p className="text-gray-500 mt-1">Here's what's happening today</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total tasks" value={stats.total_tasks} icon="📋" color="bg-blue-50" />
        <StatCard label="In progress" value={stats.in_progress} icon="⚡" color="bg-yellow-50" />
        <StatCard label="Completed" value={stats.done} icon="✅" color="bg-green-50" />
        <StatCard label="To do" value={stats.todo} icon="📝" color="bg-gray-50" />
        <StatCard label="Overdue" value={stats.overdue} icon="🚨" color="bg-red-50" />
        <StatCard label="Projects" value={stats.total_projects} icon="📁" color="bg-indigo-50" />
      </div>

      {/* My recent tasks */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">My tasks</h3>
          <Link to="/projects" className="text-sm text-indigo-600 hover:underline">
            View all projects →
          </Link>
        </div>

        {recentTasks.length === 0 ? (
          <p className="text-gray-400 text-sm py-4 text-center">
            No tasks assigned to you yet.
          </p>
        ) : (
          <div className="space-y-3">
            {recentTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">{task.title}</p>
                  <p className="text-xs text-gray-400">{task.project?.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  {task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done' && (
                    <span className="text-xs text-red-500 font-medium">Overdue</span>
                  )}
                  <span className={`badge-${task.status}`}>
                    {task.status.replace('_', ' ')}
                  </span>
                  <span className={`badge-${task.priority}`}>
                    {task.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
