const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const auth = require('../middleware/auth');
const { hasPermission } = require('../middleware/auth');

const uploadDir = path.resolve(process.env.UPLOAD_DIR || './public/uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024, files: 30 },
  fileFilter: (req, file, cb) => {
    const allowed = new Set(['image/jpeg', 'image/png', 'image/webp']);
    if (!allowed.has(file.mimetype)) {
      return cb(new Error('Only JPEG, PNG and WebP images are allowed'));
    }
    cb(null, true);
  }
});

const isAdmin = (req) => req.user?.role === 'admin';
const isManagerOrAdmin = (req) => hasPermission(req, 'cars.manage_all');
const isService = (req) => req.user?.role === 'service';
const canManageCars = (req) => hasPermission(req, 'cars.view') || hasPermission(req, 'cars.create') || hasPermission(req, 'cars.edit');
const validCarStatuses = new Set(['available', 'reserved', 'sold']);

function toBoolInt(value, fallback = 0) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'number') return value ? 1 : 0;
  const v = String(value).toLowerCase();
  return v === '1' || v === 'true' || v === 'yes' ? 1 : 0;
}

function maybeNumber(value) {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

async function syncServiceTransaction(db, serviceEntry, employeeId) {
  const car = await db.get('SELECT owner_name, owner_email, owner_contact FROM cars WHERE id = ?', [serviceEntry.car_id]);
  const existing = await db.get('SELECT id FROM transaction_history WHERE service_history_id = ?', [serviceEntry.id]);
  const values = [
    serviceEntry.car_id,
    employeeId || null,
    car?.owner_name || 'Salon Exotic',
    car?.owner_email || null,
    car?.owner_contact || null,
    serviceEntry.service_type,
    serviceEntry.description || null,
    maybeNumber(serviceEntry.cost) || 0,
    serviceEntry.service_date,
    serviceEntry.provider || null
  ];

  if (existing) {
    await db.run(
      `UPDATE transaction_history
       SET car_id=?, employee_id=?, customer_name=?, customer_email=?, customer_phone=?, title=?, description=?, amount=?, transaction_date=?, notes=?, updated_at=CURRENT_TIMESTAMP
       WHERE id=?`,
      [...values, existing.id]
    );
    return existing.id;
  }

  const result = await db.run(
    `INSERT INTO transaction_history
     (transaction_type, service_history_id, car_id, employee_id, customer_name, customer_email, customer_phone, title, description, amount, status, transaction_date, notes)
     VALUES ('service', ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?)`,
    [serviceEntry.id, ...values]
  );
  return result.lastID;
}

function parseArrayField(value, defaultValue = []) {
  if (value === undefined || value === null || value === '') return defaultValue;
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : defaultValue;
    } catch (_) {
      return defaultValue;
    }
  }
  return defaultValue;
}

async function getCarWithRelations(db, carId) {
  const car = await db.get('SELECT * FROM cars WHERE id = ?', [carId]);
  if (!car) return null;

  const images = await db.all(
    'SELECT id, car_id, image_path, is_primary, sort_order, created_at FROM car_images WHERE car_id = ? ORDER BY is_primary DESC, sort_order ASC, id ASC',
    [carId]
  );

  const features = await db.all(
    'SELECT id, car_id, feature, sort_order, created_at FROM car_features WHERE car_id = ? ORDER BY sort_order ASC, id ASC',
    [carId]
  );

  const service_history = await db.all(
    'SELECT id, car_id, service_date, service_type, description, mileage_km, cost, provider, created_at FROM car_service_history WHERE car_id = ? ORDER BY service_date DESC, id DESC',
    [carId]
  );

  const primaryImage = await db.get(
    'SELECT image_path FROM car_images WHERE car_id = ? ORDER BY is_primary DESC, sort_order ASC, id ASC LIMIT 1',
    [carId]
  );

  const featureCountRow = await db.get(
    'SELECT COUNT(*) AS count FROM car_features WHERE car_id = ?',
    [carId]
  );

  const serviceCountRow = await db.get(
    'SELECT COUNT(*) AS count FROM car_service_history WHERE car_id = ?',
    [carId]
  );

  return {
    ...car,
    images,
    primary_image: primaryImage?.image_path || car.image_path || null,
    features: features.map((f) => f.feature),
    features_detailed: features,
    service_history,
    features_count: featureCountRow?.count || 0,
    service_history_count: serviceCountRow?.count || 0
  };
}

async function upsertCarRelations(db, carId, payload) {
  const {
    uploadedImages = [],
    imagePaths = [],
    features = [],
    serviceHistory = [],
    replaceFeatures = false,
    replaceServiceHistory = false,
    primaryImageIndex = 0,
    primaryImagePath = null
  } = payload;

  const normalizedUploaded = (uploadedImages || []).map((f) => '/uploads/' + path.basename(f.path));
  const normalizedImagePaths = (imagePaths || [])
    .filter((p) => typeof p === 'string' && p.trim() !== '')
    .map((p) => p.trim());

  const combinedImages = [...normalizedImagePaths, ...normalizedUploaded];
  const uniqueImages = [...new Set(combinedImages)];

  const oldImages = await db.all('SELECT image_path FROM car_images WHERE car_id = ?', [carId]);
  const newImagesSet = new Set(uniqueImages);

  for (const oldImg of oldImages) {
    if (oldImg.image_path && !newImagesSet.has(oldImg.image_path)) {
      try {
        const cleanPath = oldImg.image_path.replace(/^\/uploads/, '').replace(/^\//, '');
        const filePath = path.join(uploadDir, cleanPath);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (e) {
        console.error('Nie udało się usunąć fizycznego pliku:', e);
      }
    }
  }

  await db.run('DELETE FROM car_images WHERE car_id = ?', [carId]);

  if (uniqueImages.length > 0) {
    let targetPrimaryPath = primaryImagePath;
    const numericPrimaryIndex = Number(primaryImageIndex);
    
    if (!targetPrimaryPath && uniqueImages[numericPrimaryIndex]) {
      targetPrimaryPath = uniqueImages[numericPrimaryIndex];
    }
    if (!targetPrimaryPath) {
      targetPrimaryPath = uniqueImages[0];
    }

    for (let i = 0; i < uniqueImages.length; i += 1) {
      const imgPath = uniqueImages[i];
      const isPrimary = (imgPath === targetPrimaryPath) ? 1 : 0;
      await db.run(
        'INSERT INTO car_images (car_id, image_path, is_primary, sort_order) VALUES (?, ?, ?, ?)',
        [carId, imgPath, isPrimary, i]
      );
    }
    
    const primaryRecord = await db.get(
      'SELECT image_path FROM car_images WHERE car_id = ? AND is_primary = 1 LIMIT 1',
      [carId]
    );
    await db.run('UPDATE cars SET image_path = ? WHERE id = ?', [primaryRecord?.image_path || uniqueImages[0], carId]);
  } else {
    await db.run('UPDATE cars SET image_path = NULL WHERE id = ?', [carId]);
  }

  if (replaceFeatures) {
    await db.run('DELETE FROM car_features WHERE car_id = ?', [carId]);
    if (Array.isArray(features) && features.length > 0) {
      for (let i = 0; i < features.length; i += 1) {
        const item = features[i];
        const featureText = typeof item === 'string' ? item : item?.feature;
        if (!featureText || !String(featureText).trim()) continue;

        await db.run(
          'INSERT INTO car_features (car_id, feature, sort_order) VALUES (?, ?, ?)',
          [carId, String(featureText).trim(), i]
        );
      }
    }
  }

  if (replaceServiceHistory) {
    await db.run('DELETE FROM car_service_history WHERE car_id = ?', [carId]);
    if (Array.isArray(serviceHistory) && serviceHistory.length > 0) {
      for (const entry of serviceHistory) {
        if (!entry || !entry.service_date || !entry.service_type) continue;

        await db.run(
          'INSERT INTO car_service_history (car_id, service_date, service_type, description, mileage_km, cost, provider) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [
            carId,
            entry.service_date,
            entry.service_type,
            entry.description ?? null,
            maybeNumber(entry.mileage_km),
            maybeNumber(entry.cost),
            entry.provider ?? null
          ]
        );
      }
    }
  }
}

router.get('/', async (req, res) => {
  const db = req.app.get('db');
  const { q, advisor_id, minPrice, maxPrice, featured, vin, public: publicView } = req.query;

  let sql = 'SELECT c.* FROM cars c WHERE 1=1';
  const params = [];

  if (publicView === 'true' || publicView === '1') {
    sql += " AND c.vehicle_type = 'inventory' AND c.inventory_visible = 1";
  }

  if (q) {
    sql += ' AND (c.make LIKE ? OR c.model LIKE ? OR c.description LIKE ?)';
    params.push('%' + q + '%', '%' + q + '%', '%' + q + '%');
  }
  if (vin) {
    sql += ' AND c.vin = ?';
    params.push(vin);
  }
  if (advisor_id) {
    sql += ' AND c.advisor_id = ?';
    params.push(advisor_id);
  }
  if (minPrice) {
    sql += ' AND c.price >= ?';
    params.push(minPrice);
  }
  if (maxPrice) {
    sql += ' AND c.price <= ?';
    params.push(maxPrice);
  }
  if (featured !== undefined) {
    sql += ' AND c.featured = ?';
    params.push(featured === 'true' || featured === '1' ? 1 : 0);
  }

  sql += ' ORDER BY c.created_at DESC, c.id DESC';

  const rows = await db.all(sql, params);

  const enriched = await Promise.all(
    rows.map(async (car) => {
      const primaryImage = await db.get(
        'SELECT image_path FROM car_images WHERE car_id = ? ORDER BY is_primary DESC, sort_order ASC, id ASC LIMIT 1',
        [car.id]
      );

      const featureCountRow = await db.get(
        'SELECT COUNT(*) AS count FROM car_features WHERE car_id = ?',
        [car.id]
      );

      const serviceCountRow = await db.get(
        'SELECT COUNT(*) AS count FROM car_service_history WHERE car_id = ?',
        [car.id]
      );

      return {
        ...car,
        primary_image: primaryImage?.image_path || car.image_path || null,
        features_count: featureCountRow?.count || 0,
        service_history_count: serviceCountRow?.count || 0
      };
    })
  );

  res.json(enriched);
});

router.post('/:id/service', auth, async (req, res) => {
  if (!canManageCars(req)) return res.status(403).json({ error: 'Forbidden' });

  const db = req.app.get('db');
  const carId = req.params.id;

  const { service_date, service_type, description, mileage_km, cost, provider } = req.body;
  if (!service_date || !service_type) {
    return res.status(400).json({ error: 'service_date and service_type are required' });
  }

  try {
    await db.exec('BEGIN');
    const result = await db.run(
      'INSERT INTO car_service_history (car_id, service_date, service_type, description, mileage_km, cost, provider) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [carId, service_date, service_type, description ?? null, maybeNumber(mileage_km), maybeNumber(cost), provider ?? null]
    );
    
    const car = await db.get('SELECT mileage_km FROM cars WHERE id = ?', [carId]);
    const currentMileage = maybeNumber(car?.mileage_km);
    const nextMileage = maybeNumber(mileage_km);

    if (nextMileage !== null && (currentMileage === null || nextMileage > currentMileage)) {
      await db.run(
        'UPDATE cars SET mileage_km = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [nextMileage, carId]
      );
    }

    const inserted = await db.get('SELECT * FROM car_service_history WHERE id = ?', [result.lastID]);
    await syncServiceTransaction(db, inserted, req.user.id);
    await db.exec('COMMIT');
    res.status(201).json(inserted);
  } catch (err) {
    await db.exec('ROLLBACK');
    res.status(500).json({ error: 'Failed to add service entry', details: err.message });
  }
});

router.put('/service/:id', auth, async (req, res) => {
  if (!canManageCars(req)) return res.status(403).json({ error: 'Forbidden' });

  const db = req.app.get('db');
  const id = req.params.id;

  const existing = await db.get('SELECT * FROM car_service_history WHERE id = ?', [id]);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  if (!isManagerOrAdmin(req) && !isService(req)) {
    const car = await db.get('SELECT advisor_id FROM cars WHERE id = ?', [existing.car_id]);
    if (!car || car.advisor_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  }

  const { service_date, service_type, description, mileage_km, cost, provider } = req.body;
  if (!service_date || !service_type) return res.status(400).json({ error: 'service_date and service_type required' });

  try {
    await db.exec('BEGIN');
    await db.run(
      'UPDATE car_service_history SET service_date=?, service_type=?, description=?, mileage_km=?, cost=?, provider=? WHERE id=?',
      [service_date, service_type, description ?? null, maybeNumber(mileage_km), maybeNumber(cost), provider ?? null, id]
    );

    const car = await db.get('SELECT mileage_km FROM cars WHERE id = ?', [existing.car_id]);
    const currentMileage = maybeNumber(car?.mileage_km);
    const nextMileage = maybeNumber(mileage_km);

    if (nextMileage !== null && (currentMileage === null || nextMileage > currentMileage)) {
      await db.run(
        'UPDATE cars SET mileage_km = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [nextMileage, existing.car_id]
      );
    }

    const updatedService = await db.get('SELECT * FROM car_service_history WHERE id = ?', [id]);
    await syncServiceTransaction(db, updatedService, req.user.id);

    await db.exec('COMMIT');

    res.json(updatedService);
  } catch (err) {
    await db.exec('ROLLBACK');
    res.status(500).json({ error: 'Update failed', details: err.message });
  }
});

router.delete('/service/:id', auth, async (req, res) => {
  if (!canManageCars(req)) return res.status(403).json({ error: 'Forbidden' });

  const db = req.app.get('db');
  const id = req.params.id;

  const existing = await db.get('SELECT * FROM car_service_history WHERE id = ?', [id]);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  if (!isManagerOrAdmin(req) && !isService(req)) {
    const car = await db.get('SELECT advisor_id FROM cars WHERE id = ?', [existing.car_id]);
    if (!car || car.advisor_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    await db.run('DELETE FROM transaction_history WHERE service_history_id = ?', [id]);
    await db.run('DELETE FROM car_service_history WHERE id = ?', [id]);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: 'Delete failed', details: err.message });
  }
});

router.get('/:id', async (req, res) => {
  const db = req.app.get('db');
  const car = await getCarWithRelations(db, req.params.id);
  if (!car) return res.status(404).json({ error: 'Not found' });
  res.json(car);
});

router.post(
  '/',
  auth,
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'images', maxCount: 30 }
  ]),
  async (req, res) => {
    if (!canManageCars(req)) {
      return res.status(403).json({ error: 'Only authorized roles can manage cars' });
    }

    const db = req.app.get('db');
    const {
      make, model, year, price, description, featured, advisor_id: advisorBody,
      transmission, drivetrain, fuel_type, engine, mileage_km, horsepower_hp,
      exterior_color, interior_color, vin, vehicle_type, owner_name, owner_contact,
      status, inventory_visible
    } = req.body;

    const targetVehicleType = vehicle_type ?? 'inventory';
    if (status && !validCarStatuses.has(status)) return res.status(400).json({ error: 'Invalid vehicle status' });
    const isInventoryVisible = isManagerOrAdmin(req) || hasPermission(req, 'cars.edit')
      ? toBoolInt(inventory_visible, 1)
      : 1;
    if (isService(req) && targetVehicleType !== 'customer') {
      return res.status(403).json({ error: 'Service role can only manage customer vehicles' });
    }

    const advisor_id = isManagerOrAdmin(req) ? (advisorBody ?? req.user.id) : req.user.id;
    const isFeatured = isManagerOrAdmin(req) ? toBoolInt(featured, 0) : 0;

    const uploaded = []
      .concat(req.files?.image || [])
      .concat(req.files?.images || []);

    const imagePaths = parseArrayField(req.body.image_paths, []);
    const features = parseArrayField(req.body.features, []);
    const serviceHistory = parseArrayField(req.body.service_history, []);
    const primaryImageIndex = req.body.primary_image_index ?? 0;
    const primaryImagePath = req.body.primary_image_path ?? null;

    await db.exec('BEGIN');
    try {
      const result = await db.run(
        'INSERT INTO cars (make, model, year, price, description, transmission, drivetrain, fuel_type, engine, mileage_km, horsepower_hp, exterior_color, interior_color, advisor_id, featured, vin, vehicle_type, owner_name, owner_contact, status, inventory_visible) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          make ?? null, model ?? null, maybeNumber(year), maybeNumber(price), description ?? null,
          transmission ?? null, drivetrain ?? null, fuel_type ?? null, engine ?? null,
          maybeNumber(mileage_km), maybeNumber(horsepower_hp), exterior_color ?? null,
          interior_color ?? null, advisor_id, isFeatured, vin ?? null, targetVehicleType,
          owner_name ?? null, owner_contact ?? null,
          status && validCarStatuses.has(status) ? status : 'available',
          isInventoryVisible
        ]
      );

      await upsertCarRelations(db, result.lastID, {
        uploadedImages: uploaded,
        imagePaths,
        features,
        serviceHistory,
        replaceFeatures: true,
        replaceServiceHistory: true,
        primaryImageIndex,
        primaryImagePath
      });

      await db.exec('COMMIT');
      const created = await getCarWithRelations(db, result.lastID);
      return res.status(201).json(created);
    } catch (err) {
      await db.exec('ROLLBACK');
      return res.status(500).json({ error: 'Create failed', details: err.message });
    }
  }
);

router.put(
  '/:id',
  auth,
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'images', maxCount: 30 }
  ]),
  async (req, res) => {
    if (!canManageCars(req)) {
      return res.status(403).json({ error: 'Only authorized roles can manage cars' });
    }

    const db = req.app.get('db');
    const carId = req.params.id;
    const existing = await db.get('SELECT * FROM cars WHERE id = ?', [carId]);
    if (!existing) return res.status(404).json({ error: 'Not found' });

    if (isService(req)) {
      if (existing.vehicle_type !== 'customer') {
        return res.status(403).json({ error: 'Service role can only manage customer vehicles' });
      }
    } else if (!isManagerOrAdmin(req) && existing.advisor_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const {
      make, model, year, price, description, featured, advisor_id: advisorBody,
      transmission, drivetrain, fuel_type, engine, mileage_km, horsepower_hp,
      exterior_color, interior_color, vin, vehicle_type, owner_name, owner_contact,
      status, inventory_visible
    } = req.body;

    const targetVehicleType = vehicle_type ?? existing.vehicle_type;
    if (status && !validCarStatuses.has(status)) return res.status(400).json({ error: 'Invalid vehicle status' });
    const nextInventoryVisible = isManagerOrAdmin(req) || hasPermission(req, 'cars.edit')
      ? toBoolInt(inventory_visible, existing.inventory_visible ?? 1)
      : existing.inventory_visible ?? 1;
    if (isService(req) && targetVehicleType !== 'customer') {
      return res.status(403).json({ error: 'Service role cannot change vehicle type to inventory' });
    }

    const advisor_id = isManagerOrAdmin(req)
      ? (advisorBody ?? existing.advisor_id)
      : existing.advisor_id;

    const isFeatured =
      isManagerOrAdmin(req) && featured !== undefined
        ? toBoolInt(featured, existing.featured)
        : existing.featured;

    const uploaded = []
      .concat(req.files?.image || [])
      .concat(req.files?.images || []);

    const imagePaths = parseArrayField(req.body.image_paths, []);
    const features = parseArrayField(req.body.features, []);
    const serviceHistory = parseArrayField(req.body.service_history, []);
    const primaryImageIndex = req.body.primary_image_index ?? 0;
    const primaryImagePath = req.body.primary_image_path ?? null;

    const replaceFeatures = toBoolInt(req.body.replace_features, 0) === 1 || req.body.features !== undefined;
    const replaceServiceHistory = toBoolInt(req.body.replace_service_history, 0) === 1 || req.body.service_history !== undefined;

    await db.exec('BEGIN');
    try {
      await db.run(
        'UPDATE cars SET make=?, model=?, year=?, price=?, description=?, transmission=?, drivetrain=?, fuel_type=?, engine=?, mileage_km=?, horsepower_hp=?, exterior_color=?, interior_color=?, advisor_id=?, featured=?, vin=?, vehicle_type=?, owner_name=?, owner_contact=?, status=?, inventory_visible=?, updated_at=CURRENT_TIMESTAMP WHERE id=?',
        [
          make ?? existing.make, model ?? existing.model, maybeNumber(year) ?? existing.year,
          maybeNumber(price) ?? existing.price, description ?? existing.description,
          transmission ?? existing.transmission, drivetrain ?? existing.drivetrain,
          fuel_type ?? existing.fuel_type, engine ?? existing.engine,
          maybeNumber(mileage_km) ?? existing.mileage_km, maybeNumber(horsepower_hp) ?? existing.horsepower_hp,
          exterior_color ?? existing.exterior_color, interior_color ?? existing.interior_color,
          advisor_id, isFeatured, vin ?? existing.vin, targetVehicleType,
          owner_name ?? existing.owner_name, owner_contact ?? existing.owner_contact,
          status ?? existing.status, nextInventoryVisible, carId
        ]
      );

      await upsertCarRelations(db, carId, {
        uploadedImages: uploaded,
        imagePaths,
        features,
        serviceHistory,
        replaceFeatures,
        replaceServiceHistory,
        primaryImageIndex,
        primaryImagePath
      });

      await db.exec('COMMIT');
      const updated = await getCarWithRelations(db, carId);
      return res.json(updated);
    } catch (err) {
      await db.exec('ROLLBACK');
      return res.status(500).json({ error: 'Update failed', details: err.message });
    }
  }
);

router.delete('/:id', auth, async (req, res) => {
  if (!canManageCars(req)) {
    return res.status(403).json({ error: 'Only authorized roles can manage cars' });
  }

  const db = req.app.get('db');
  const carId = req.params.id;
  const existing = await db.get('SELECT * FROM cars WHERE id = ?', [carId]);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  if (isService(req)) {
    if (existing.vehicle_type !== 'customer') {
      return res.status(403).json({ error: 'Service role can only manage customer vehicles' });
    }
  } else if (!isManagerOrAdmin(req) && existing.advisor_id !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    await db.exec('BEGIN');

    const images = await db.all('SELECT image_path FROM car_images WHERE car_id = ?', [carId]);
    for (const img of images) {
      if (img.image_path) {
        const cleanPath = img.image_path.replace(/^\/uploads/, '').replace(/^\//, '');
        const filePath = path.join(uploadDir, cleanPath);
        if (fs.existsSync(filePath)) {
          try { fs.unlinkSync(filePath); } catch (e) { console.error('Błąd usuwania pliku:', e); }
        }
      }
    }

    await db.run('DELETE FROM car_images WHERE car_id = ?', [carId]);
    await db.run('DELETE FROM car_features WHERE car_id = ?', [carId]);
    await db.run('DELETE FROM car_service_history WHERE car_id = ?', [carId]);
    await db.run('DELETE FROM cars WHERE id = ?', [carId]);

    await db.exec('COMMIT');
    res.status(204).end();
  } catch (err) {
    await db.exec('ROLLBACK');
    res.status(500).json({ error: 'Delete failed', details: err.message });
  }
});

router.patch('/:id/primary-image', auth, async (req, res) => {
  if (!canManageCars(req)) {
    return res.status(403).json({ error: 'Only authorized roles can manage cars' });
  }

  const db = req.app.get('db');
  const carId = req.params.id;
  const { image_path, image_index } = req.body;

  if (!image_path && image_index === undefined) {
    return res.status(400).json({ error: 'image_path or image_index is required' });
  }

  const existingCar = await db.get('SELECT * FROM cars WHERE id = ?', [carId]);
  if (!existingCar) return res.status(404).json({ error: 'Car not found' });

  if (isService(req)) {
    if (existingCar.vehicle_type !== 'customer') {
      return res.status(403).json({ error: 'Service role can only manage customer vehicles' });
    }
  } else if (!isManagerOrAdmin(req) && existingCar.advisor_id !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    await db.exec('BEGIN');

    let targetPath = image_path;

    // Jeśli podano indeks zamiast ścieżki, pobieramy obrazek z bazy na podstawie sortowania i ID
    if (!targetPath && image_index !== undefined) {
      const allImages = await db.all(
        'SELECT image_path FROM car_images WHERE car_id = ? ORDER BY is_primary DESC, sort_order ASC, id ASC',
        [carId]
      );
      const targetImg = allImages[Number(image_index)];
      if (targetImg) {
        targetPath = targetImg.image_path;
      }
    }

    if (!targetPath) {
      await db.exec('ROLLBACK');
      return res.status(404).json({ error: 'Image not found for this car' });
    }

    await db.run('UPDATE car_images SET is_primary = 0 WHERE car_id = ?', [carId]);

    const result = await db.run(
      'UPDATE car_images SET is_primary = 1 WHERE car_id = ? AND image_path = ?',
      [carId, targetPath]
    );

    if (result.changes === 0) {
      await db.exec('ROLLBACK');
      return res.status(404).json({ error: 'Image not found for this car' });
    }

    await db.run('UPDATE cars SET image_path = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [targetPath, carId]);

    await db.exec('COMMIT');

    const updatedCar = await getCarWithRelations(db, carId);
    return res.json(updatedCar);
  } catch (err) {
    await db.exec('ROLLBACK');
    return res.status(500).json({ error: 'Failed to update primary image', details: err.message });
  }
});

module.exports = router;