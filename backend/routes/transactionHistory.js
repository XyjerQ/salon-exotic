const express = require('express');
const auth = require('../middleware/auth');
const { hasPermission } = require('../middleware/auth');

const router = express.Router();
const transactionTypes = new Set(['vehicle_sale', 'service', 'detailing']);
const statuses = new Set(['planned', 'in_progress', 'completed', 'cancelled']);
const paymentMethods = new Set(['cash', 'card', 'transfer', 'leasing', 'credit']);

const canManageAll = (req) => hasPermission(req, 'transactions.manage_all');
const canAccess = (req, permission) => hasPermission(req, permission);

const canUseTransactionType = (req, transactionType) => {
  if (canManageAll(req)) return true;
  if (req.user?.role === 'sales') return transactionType === 'vehicle_sale';
  if (req.user?.role === 'service') return ['service', 'detailing'].includes(transactionType);
  return false;
};

const syncVehicleSaleStatus = async (db, payload) => {
  if (payload.transaction_type !== 'vehicle_sale' || payload.status !== 'completed' || !payload.car_id) return;
  await db.run(
    "UPDATE cars SET status = 'sold', inventory_visible = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [payload.car_id]
  );
};

const restoreVehicleIfUnused = async (db, carId, ignoredTransactionId) => {
  if (!carId) return;
  const params = [carId];
  let query = `SELECT id FROM transaction_history
    WHERE transaction_type = 'vehicle_sale' AND status = 'completed' AND car_id = ?`;
  if (ignoredTransactionId) {
    query += ' AND id != ?';
    params.push(ignoredTransactionId);
  }
  const activeSale = await db.get(query, params);
  if (!activeSale) {
    await db.run("UPDATE cars SET status = 'available', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'sold'", [carId]);
  }
};

const normalizePayload = (body) => ({
  transaction_type: typeof body.transaction_type === 'string' ? body.transaction_type.trim() : '',
  car_id: body.car_id === '' || body.car_id === null || body.car_id === undefined ? null : Number(body.car_id),
  employee_id: body.employee_id === '' || body.employee_id === null || body.employee_id === undefined ? null : Number(body.employee_id),
  customer_name: typeof body.customer_name === 'string' ? body.customer_name.trim() : '',
  customer_email: typeof body.customer_email === 'string' ? body.customer_email.trim().toLowerCase() : null,
  customer_phone: typeof body.customer_phone === 'string' ? body.customer_phone.trim() : null,
  title: typeof body.title === 'string' ? body.title.trim() : '',
  description: typeof body.description === 'string' ? body.description.trim() : null,
  amount: Number(body.amount),
  payment_method: typeof body.payment_method === 'string' && body.payment_method ? body.payment_method : null,
  status: typeof body.status === 'string' && body.status ? body.status : 'completed',
  transaction_date: typeof body.transaction_date === 'string' && body.transaction_date ? body.transaction_date : new Date().toISOString(),
  notes: typeof body.notes === 'string' ? body.notes.trim() : null
});

const validate = (payload) => {
  if (!transactionTypes.has(payload.transaction_type)) return 'Invalid transaction type';
  if (payload.transaction_type === 'vehicle_sale' && !payload.car_id) return 'A vehicle is required for a vehicle sale';
  if (payload.customer_name.length < 2 || payload.customer_name.length > 120) return 'Customer name must be between 2 and 120 characters';
  if (payload.title.length < 2 || payload.title.length > 160) return 'Title must be between 2 and 160 characters';
  if (!Number.isFinite(payload.amount) || payload.amount < 0) return 'Amount must be a non-negative number';
  if (payload.payment_method && !paymentMethods.has(payload.payment_method)) return 'Invalid payment method';
  if (!statuses.has(payload.status)) return 'Invalid status';
  if (payload.customer_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.customer_email)) return 'Invalid customer email';
  if (payload.car_id !== null && (!Number.isInteger(payload.car_id) || payload.car_id < 1)) return 'Invalid car';
  return null;
};

const listQuery = (req) => {
  const params = [];
  let where = '';
  if (!canManageAll(req)) {
    where = 'WHERE th.employee_id = ?';
    params.push(req.user.id);
  }
  return { where, params };
};

router.get('/', auth, async (req, res) => {
  if (!canAccess(req, 'transactions.view')) return res.status(403).json({ error: 'Insufficient permissions' });
  try {
    const db = req.app.get('db');
    const { where, params } = listQuery(req);
    const rows = await db.all(
      `SELECT th.*, c.make, c.model, c.year, c.vin, e.name AS employee_name
       FROM transaction_history th
       LEFT JOIN cars c ON c.id = th.car_id
       LEFT JOIN employees e ON e.id = th.employee_id
       ${where}
       ORDER BY th.transaction_date DESC, th.id DESC`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error('Transaction history fetch failed:', err);
    res.status(500).json({ error: 'Unable to load transaction history' });
  }
});

router.post('/', auth, async (req, res) => {
  if (!canAccess(req, 'transactions.create')) return res.status(403).json({ error: 'Insufficient permissions' });
  const payload = normalizePayload(req.body);
  const validationError = validate(payload);
  if (validationError) return res.status(400).json({ error: validationError });
  if (!canUseTransactionType(req, payload.transaction_type)) return res.status(403).json({ error: 'Your role cannot create this transaction type' });

  try {
    const db = req.app.get('db');
    if (payload.car_id && !(await db.get('SELECT id FROM cars WHERE id = ?', [payload.car_id]))) {
      return res.status(400).json({ error: 'Selected car does not exist' });
    }
    if (payload.transaction_type === 'vehicle_sale' && payload.status === 'completed') {
      const soldCar = await db.get("SELECT status FROM cars WHERE id = ?", [payload.car_id]);
      if (soldCar?.status === 'sold') return res.status(400).json({ error: 'This vehicle is already sold' });
    }
    if (payload.employee_id && !canManageAll(req) && payload.employee_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only create records assigned to yourself' });
    }
    const employeeId = canManageAll(req) ? (payload.employee_id || req.user.id) : req.user.id;
    const result = await db.run(
      `INSERT INTO transaction_history
       (transaction_type, car_id, employee_id, customer_name, customer_email, customer_phone, title, description, amount, payment_method, status, transaction_date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [payload.transaction_type, payload.car_id, employeeId, payload.customer_name, payload.customer_email, payload.customer_phone, payload.title, payload.description, payload.amount, payload.payment_method, payload.status, payload.transaction_date, payload.notes]
    );
    await syncVehicleSaleStatus(db, payload);
    res.status(201).json(await db.get('SELECT * FROM transaction_history WHERE id = ?', [result.lastID]));
  } catch (err) {
    console.error('Transaction history create failed:', err);
    res.status(500).json({ error: 'Unable to create transaction record' });
  }
});

router.put('/:id', auth, async (req, res) => {
  if (!canAccess(req, 'transactions.edit')) return res.status(403).json({ error: 'Insufficient permissions' });
  const payload = normalizePayload(req.body);
  const validationError = validate(payload);
  if (validationError) return res.status(400).json({ error: validationError });
  if (!canUseTransactionType(req, payload.transaction_type)) return res.status(403).json({ error: 'Your role cannot edit this transaction type' });

  try {
    const db = req.app.get('db');
    const id = Number(req.params.id);
    const existing = await db.get('SELECT * FROM transaction_history WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'Transaction record not found' });
    if (!canManageAll(req) && existing.employee_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    const employeeId = canManageAll(req) ? (payload.employee_id || existing.employee_id) : existing.employee_id;
    await db.run(
      `UPDATE transaction_history SET transaction_type=?, car_id=?, employee_id=?, customer_name=?, customer_email=?, customer_phone=?, title=?, description=?, amount=?, payment_method=?, status=?, transaction_date=?, notes=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
      [payload.transaction_type, payload.car_id, employeeId, payload.customer_name, payload.customer_email, payload.customer_phone, payload.title, payload.description, payload.amount, payload.payment_method, payload.status, payload.transaction_date, payload.notes, id]
    );
    if (existing.transaction_type === 'vehicle_sale' && existing.status === 'completed' && (payload.transaction_type !== 'vehicle_sale' || payload.status !== 'completed' || payload.car_id !== existing.car_id)) {
      await restoreVehicleIfUnused(db, existing.car_id, id);
    }
    await syncVehicleSaleStatus(db, payload);
    res.json(await db.get('SELECT * FROM transaction_history WHERE id = ?', [id]));
  } catch (err) {
    res.status(500).json({ error: 'Unable to update transaction record' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  if (!canAccess(req, 'transactions.delete')) return res.status(403).json({ error: 'Insufficient permissions' });
  try {
    const db = req.app.get('db');
    const id = Number(req.params.id);
    const existing = await db.get('SELECT * FROM transaction_history WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'Transaction record not found' });
    if (!canManageAll(req) && existing.employee_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    await db.run('DELETE FROM transaction_history WHERE id = ?', [id]);
    if (existing.transaction_type === 'vehicle_sale' && existing.status === 'completed') {
      await restoreVehicleIfUnused(db, existing.car_id);
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Unable to delete transaction record' });
  }
});

module.exports = router;
