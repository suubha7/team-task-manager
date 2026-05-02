import { useEffect, useState } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

export default function AdminPanel() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/users/')
      .then((res) => setUsers(res.data))
      .finally(() => setLoading(false))
  }, [])

  const handleRoleChange = async (userId, newRole) => {
    try {
      const { data } = await api.patch(`/users/${userId}/role`, { role: newRole })
      setUsers(users.map((u) => (u.id === userId ? data : u)))
      toast.success('Role updated')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update role')
    }
  }

  const handleDeactivate = async (userId) => {
    if (!confirm('Deactivate this user?')) return
    try {
      await api.delete(`/users/${userId}`)
      setUsers(users.map((u) => (u.id === userId ? { ...u, is_active: false } : u)))
      toast.success('User deactivated')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to deactivate user')
    }
  }

  if (loading) return <div className="text-gray-400">Loading...</div>

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Admin Panel</h2>
        <p className="text-gray-500 mt-1">Manage users and roles</p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card text-center">
          <p className="text-3xl font-bold text-gray-900">{users.length}</p>
          <p className="text-sm text-gray-500">Total users</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-indigo-600">
            {users.filter((u) => u.role === 'admin').length}
          </p>
          <p className="text-sm text-gray-500">Admins</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-gray-600">
            {users.filter((u) => u.is_active).length}
          </p>
          <p className="text-sm text-gray-500">Active users</p>
        </div>
      </div>

      {/* Users table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">All users</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => (
                <tr key={u.id} className={`hover:bg-gray-50 transition-colors ${!u.is_active ? 'opacity-50' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm shrink-0">
                        {u.full_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900">
                        {u.full_name}
                        {u.id === currentUser?.id && (
                          <span className="ml-2 text-xs text-gray-400">(you)</span>
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{u.email}</td>
                  <td className="px-6 py-4">
                    {u.id === currentUser?.id ? (
                      <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full font-medium">
                        {u.role}
                      </span>
                    ) : (
                      <select
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        disabled={!u.is_active}
                      >
                        <option value="member">member</option>
                        <option value="admin">admin</option>
                      </select>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      u.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    {u.id !== currentUser?.id && u.is_active && (
                      <button
                        onClick={() => handleDeactivate(u.id)}
                        className="text-xs text-red-400 hover:text-red-600 font-medium"
                      >
                        Deactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
