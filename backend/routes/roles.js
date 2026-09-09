const express = require('express');
const auth = require('../middleware/auth');
const { PERMISSIONS } = require('../permissions');

const router = express.Router();
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  next();
};

const validPermissionKeys = new Set(PERMISSIONS.map((permission) => permission.key));

const listRoles = async (db) => {
  const roles = await db.all('SELECT id, name, display_name, is_system FROM roles ORDER BY is_system DESC, display_name');
  const permissions = await db.all('SELECT id, key, label FROM permissions ORDER BY key');
  const links = await db.all('SELECT role_id, permission_id FROM role_permissions');
  return roles.map((role) => ({
    ...role,
    permissions: links.filter((link) => link.role_id === role.id).map((link) => link.permission_id),
    permission_keys: links
      .filter((link) => link.role_id === role.id)
      .map((link) => permissions.find((permission) => permission.id === link.permission_id)?.key)
      .filter(Boolean)
  }));
};

router.get('/permissions', auth, requireAdmin, (req, res) => res.json(PERMISSIONS));

router.get('/', auth, requireAdmin, async (req, res) => {
  try {
    res.json({ roles: await listRoles(req.app.get('db')), permissions: PERMISSIONS });
  } catch (err) {
    res.status(500).json({ error: 'Unable to load roles' });
  }
});

router.post('/', auth, requireAdmin, async (req, res) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim().toLowerCase() : '';
  const displayName = typeof req.body.display_name === 'string' ? req.body.display_name.trim() : '';
  const permissionKeys = Array.isArray(req.body.permissions) ? req.body.permissions : [];
  if (!/^[a-z][a-z0-9_-]{1,30}$/.test(name) || !displayName) {
    return res.status(400).json({ error: 'Role name and display name are required' });
  }
  if (permissionKeys.some((key) => !validPermissionKeys.has(key))) return res.status(400).json({ error: 'Invalid permission' });

  try {
    const db = req.app.get('db');
    const result = await db.run('INSERT INTO roles (name, display_name, is_system) VALUES (?, ?, 0)', [name, displayName]);
    for (const key of permissionKeys) {
      const permission = await db.get('SELECT id FROM permissions WHERE key = ?', [key]);
      await db.run('INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)', [result.lastID, permission.id]);
    }
    res.status(201).json((await listRoles(db)).find((role) => role.id === result.lastID));
  } catch (err) {
    res.status(400).json({ error: 'Role name already exists' });
  }
});

router.put('/:id', auth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const permissionKeys = Array.isArray(req.body.permissions) ? req.body.permissions : [];
  if (permissionKeys.some((key) => !validPermissionKeys.has(key))) return res.status(400).json({ error: 'Invalid permission' });
  try {
    const db = req.app.get('db');
    const role = await db.get('SELECT * FROM roles WHERE id = ?', [id]);
    if (!role) return res.status(404).json({ error: 'Role not found' });
    if (role.name === 'admin') return res.status(400).json({ error: 'The admin role cannot be modified' });
    if (typeof req.body.display_name === 'string' && req.body.display_name.trim()) {
      await db.run('UPDATE roles SET display_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [req.body.display_name.trim(), id]);
    }
    await db.run('DELETE FROM role_permissions WHERE role_id = ?', [id]);
    for (const key of permissionKeys) {
      const permission = await db.get('SELECT id FROM permissions WHERE key = ?', [key]);
      await db.run('INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)', [id, permission.id]);
    }
    res.json((await listRoles(db)).find((item) => item.id === id));
  } catch (err) {
    res.status(500).json({ error: 'Unable to update role' });
  }
});

router.put('/employees/:id/role', auth, requireAdmin, async (req, res) => {
  const roleId = Number(req.body.role_id);
  const employeeId = Number(req.params.id);
  try {
    const db = req.app.get('db');
    const role = await db.get('SELECT id, name FROM roles WHERE id = ?', [roleId]);
    if (!role) return res.status(404).json({ error: 'Role not found' });
    const employee = await db.get('SELECT id FROM employees WHERE id = ?', [employeeId]);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    const legacyRole = ['admin', 'manager', 'sales', 'service'].includes(role.name) ? role.name : 'sales';
    await db.run('UPDATE employees SET role_id = ?, role = ? WHERE id = ?', [role.id, legacyRole, employeeId]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Unable to assign role' });
  }
});

router.delete('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const db = req.app.get('db');
    const role = await db.get('SELECT * FROM roles WHERE id = ?', [Number(req.params.id)]);
    if (!role) return res.status(404).json({ error: 'Role not found' });
    if (role.name === 'admin') return res.status(400).json({ error: 'The admin role cannot be deleted' });
    const assigned = await db.get('SELECT COUNT(*) AS count FROM employees WHERE role_id = ?', [role.id]);
    if (assigned.count > 0) return res.status(400).json({ error: 'Reassign employees before deleting this role' });
    await db.run('DELETE FROM roles WHERE id = ?', [role.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Unable to delete role' });
  }
});

module.exports = router;