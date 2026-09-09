// middleware/auth.js
const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET;

async function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Missing auth' });
  const [scheme, token] = auth.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Invalid authorization header' });
  }
  try {
    req.user = jwt.verify(token, SECRET);
    const db = req.app.get('db');
    if (db && req.user.id) {
      const employee = await db.get(
        `SELECT e.id, e.name, e.email, e.role AS legacy_role, r.name AS role_name
         FROM employees e LEFT JOIN roles r ON r.id = e.role_id WHERE e.id = ?`,
        [req.user.id]
      );
      if (employee) {
        const permissions = await db.all(
          `SELECT p.key FROM permissions p
           JOIN role_permissions rp ON rp.permission_id = p.id
           JOIN roles r ON r.id = rp.role_id
           JOIN employees e ON e.role_id = r.id
           WHERE e.id = ?`,
          [employee.id]
        );
        req.user.role = employee.role_name || employee.legacy_role;
        req.user.permissions = permissions.map((permission) => permission.key);
        req.user.name = employee.name;
        req.user.email = employee.email;
      }
    }
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

function hasPermission(req, permission) {
  return req.user?.role === 'admin' || req.user?.permissions?.includes(permission);
}

module.exports = authMiddleware;
module.exports.hasPermission = hasPermission;