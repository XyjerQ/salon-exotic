import React, { useEffect, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export default function RolesManager({ token }) {
  const [roles, setRoles] = useState([])
  const [permissions, setPermissions] = useState([])
  const [employees, setEmployees] = useState([])
  const [selectedRoleId, setSelectedRoleId] = useState(null)
  const [form, setForm] = useState({ name: '', display_name: '', permissions: [] })
  const [newRole, setNewRole] = useState({ name: '', display_name: '', permissions: [] })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const request = async (url, options = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(options.headers || {}) }
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Role operation failed')
    return data
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const [roleData, employeeData] = await Promise.all([
        request(`${API_BASE}/roles`),
        request(`${API_BASE}/employees`)
      ])
      setRoles(roleData.roles)
      setPermissions(roleData.permissions)
      setEmployees(employeeData)
      const first = roleData.roles[0]
      if (first && selectedRoleId === null) {
        setSelectedRoleId(first.id)
        setForm({ name: first.name, display_name: first.display_name, permissions: first.permission_keys })
      }
      setError('')
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [token])

  const selectRole = (role) => {
    setSelectedRoleId(role.id)
    setForm({ name: role.name, display_name: role.display_name, permissions: role.permission_keys })
  }

  const togglePermission = (target, key) => {
    const has = target.permissions.includes(key)
    const permissionsValue = has ? target.permissions.filter((item) => item !== key) : [...target.permissions, key]
    return { ...target, permissions: permissionsValue }
  }

  const saveRole = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await request(`${API_BASE}/roles/${selectedRoleId}`, { method: 'PUT', body: JSON.stringify({ display_name: form.display_name, permissions: form.permissions }) })
      setSuccess('Role permissions saved.')
      await loadData()
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  const createRole = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const created = await request(`${API_BASE}/roles`, { method: 'POST', body: JSON.stringify(newRole) })
      setNewRole({ name: '', display_name: '', permissions: [] })
      setSelectedRoleId(created.id)
      setSuccess('Role created.')
      await loadData()
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  const deleteRole = async (role) => {
    if (!window.confirm(`Delete role "${role.display_name}"?`)) return
    try {
      await request(`${API_BASE}/roles/${role.id}`, { method: 'DELETE' })
      setSelectedRoleId(null)
      setSuccess('Role deleted.')
      await loadData()
    } catch (deleteError) {
      setError(deleteError.message)
    }
  }

  const assignRole = async (employeeId, roleId) => {
    try {
      await request(`${API_BASE}/roles/employees/${employeeId}/role`, { method: 'PUT', body: JSON.stringify({ role_id: Number(roleId) }) })
      setSuccess('Employee role updated.')
      await loadData()
    } catch (assignError) {
      setError(assignError.message)
    }
  }

  if (loading) return <p className="text-gray-600">Loading roles...</p>
  const selectedRole = roles.find((role) => role.id === selectedRoleId)

  return (
    <section className="bg-white rounded-xl shadow-md p-6">
      <div className="flex justify-between items-start gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold">Roles & Permissions</h2>
          <p className="text-gray-500 text-sm">Only administrators can create roles and control access.</p>
        </div>
        <button onClick={loadData} className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm">Refresh</button>
      </div>
      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">{error}</div>}
      {success && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg text-sm">{success}</div>}

      <div className="grid lg:grid-cols-[220px_minmax(0,1fr)] gap-6">
        <aside className="border border-gray-200 rounded-lg p-3 h-fit">
          <p className="text-xs uppercase tracking-wider text-gray-500 px-2 mb-2">Roles</p>
          <div className="space-y-1">
            {roles.map((role) => (
              <div key={role.id} className={`flex items-center rounded-md ${role.id === selectedRoleId ? 'bg-black text-white' : 'hover:bg-gray-100'}`}>
                <button onClick={() => selectRole(role)} className="flex-1 text-left px-3 py-2 text-sm truncate">{role.display_name}</button>
                {role.name !== 'admin' && (
                  <button
                    onClick={() => deleteRole(role)}
                    title="Delete role"
                    aria-label={`Delete ${role.display_name}`}
                    className="text-red-600 p-2 hover:bg-red-100 rounded transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M3 6h18" />
                      <path d="M8 6V4h8v2" />
                      <path d="M19 6l-1 14H6L5 6" />
                      <path d="M10 11v5M14 11v5" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
          <form onSubmit={createRole} className="border-t border-gray-200 mt-4 pt-4 space-y-2">
            <input required pattern="[a-z][a-z0-9_-]{1,30}" value={newRole.name} onChange={(event) => setNewRole({ ...newRole, name: event.target.value })} placeholder="role-key" className="w-full border rounded px-2 py-1.5 text-sm" />
            <input required value={newRole.display_name} onChange={(event) => setNewRole({ ...newRole, display_name: event.target.value })} placeholder="Display name" className="w-full border rounded px-2 py-1.5 text-sm" />
            <button disabled={saving} className="w-full bg-black text-white rounded px-3 py-2 text-sm disabled:opacity-50">Add role</button>
          </form>
        </aside>

        <div>
          {selectedRole && (
            <form onSubmit={saveRole} className="border border-gray-200 rounded-lg p-5 mb-6">
              <div className="flex justify-between items-start gap-4 mb-4">
                <div>
                  <h3 className="text-xl font-bold">{selectedRole.display_name}</h3>
                  <p className="text-sm text-gray-500">Key: {selectedRole.name}</p>
                </div>
                {selectedRole.is_system && <span className="text-xs bg-gray-100 px-2 py-1 rounded">System role</span>}
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                {permissions.map((permission) => (
                  <label key={permission.key} className={`flex items-center gap-2 border rounded px-3 py-2 text-sm ${selectedRole.name === 'admin' ? 'opacity-60' : ''}`}>
                    <input type="checkbox" disabled={selectedRole.name === 'admin'} checked={form.permissions.includes(permission.key)} onChange={() => setForm(togglePermission(form, permission.key))} />
                    {permission.label}
                  </label>
                ))}
              </div>
              {selectedRole.name !== 'admin' && <button disabled={saving} className="mt-5 bg-blackline-accent text-black px-5 py-2 rounded font-semibold disabled:opacity-50">Save permissions</button>}
            </form>
          )}

          <div className="border border-gray-200 rounded-lg p-5">
            <h3 className="text-xl font-bold mb-4">Employee roles</h3>
            <div className="space-y-3">
              {employees.map((employee) => (
                <div key={employee.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
                  <div><p className="font-semibold">{employee.name}</p><p className="text-sm text-gray-500">{employee.email}</p></div>
                  <select value={employee.role_id || ''} onChange={(event) => assignRole(employee.id, event.target.value)} className="border rounded px-3 py-2 bg-white text-sm">
                    {roles.map((role) => <option key={role.id} value={role.id}>{role.display_name}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
