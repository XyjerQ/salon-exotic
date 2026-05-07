const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const auth = require('../middleware/auth');

const uploadDir = path.resolve(process.env.UPLOAD_DIR || './public/uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({ storage });

const isAdmin = (req) => req.user?.role === 'admin';
const canManageCars = (req) => req.user?.role === 'admin' || req.user?.role === 'sales';

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

  return {
    ...car,
    images,
    features: features.map((f) => f.feature),
    features_detailed: features,
    service_history
  };
}

async function upsertCarRelations(db, carId, payload) {
  const {
    uploadedImages = [],
    imagePaths = [],
    features = [],
    serviceHistory = [],
    replaceImages = false,
    replaceFeatures = false,
    replaceServiceHistory = false,
    primaryImageIndex = 0
  } = payload;

  if (replaceImages) {
    await db.run('DELETE FROM car_images WHERE car_id = ?', [carId]);
  }

  const normalizedUploaded = (uploadedImages || []).map((f) => '/uploads/' + path.basename(f.path));
  const normalizedImagePaths = (imagePaths || [])
    .filter((p) => typeof p === 'string' && p.trim() !== '')
    .map((p) => p.trim());

  const allImages = normalizedUploaded.concat(normalizedImagePaths);

  if (allImages.length > 0) {
    for (let i = 0; i < allImages.length; i += 1) {
      await db.run(
        'INSERT INTO car_images (car_id, image_path, is_primary, sort_order) VALUES (?, ?, ?, ?)',
        [carId, allImages[i], i === Number(primaryImageIndex) ? 1 : 0, i]
      );
    }

    const first = await db.get(
      'SELECT image_path FROM car_images WHERE car_id = ? ORDER BY is_primary DESC, sort_order ASC, id ASC LIMIT 1',
      [carId]
    );

    await db.run('UPDATE cars SET image_path = ? WHERE id = ?', [first?.image_path || null, carId]);
  }

  if (replaceFeatures) {
    await db.run('DELETE FROM car_features WHERE car_id = ?', [carId]);
  }

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

  if (replaceServiceHistory) {
    await db.run('DELETE FROM car_service_history WHERE car_id = ?', [carId]);
  }

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

router.get('/', async (req, res) => {
  const db = req.app.get('db');
  const { q, advisor_id, minPrice, maxPrice, featured, vin } = req.query;

  let sql = 'SELECT c.* FROM cars c WHERE 1=1';
  const params = [];

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

// add single service entry for car
router.post('/:id/service', auth, async (req, res) => {
  const db = req.app.get('db');
  const carId = req.params.id;

  // any logged-in sales/admin can add service records
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const { service_date, service_type, description, mileage_km, cost, provider } = req.body;
  if (!service_date || !service_type) {
    return res.status(400).json({ error: 'service_date and service_type are required' });
  }

  try {
    const result = await db.run(
      'INSERT INTO car_service_history (car_id, service_date, service_type, description, mileage_km, cost, provider) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [carId, service_date, service_type, description ?? null, maybeNumber(mileage_km), maybeNumber(cost), provider ?? null]
    );

    const inserted = await db.get('SELECT * FROM car_service_history WHERE id = ?', [result.lastID]);
    res.status(201).json(inserted);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add service entry', details: err.message });
  }
});

// update a service entry
router.put('/service/:id', auth, async (req, res) => {
  const db = req.app.get('db');
  const id = req.params.id;

  const existing = await db.get('SELECT * FROM car_service_history WHERE id = ?', [id]);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  // permission: admin or sales assigned to car
  if (!isAdmin(req)) {
    const car = await db.get('SELECT advisor_id FROM cars WHERE id = ?', [existing.car_id]);
    if (!car || car.advisor_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  }

  const { service_date, service_type, description, mileage_km, cost, provider } = req.body;
  if (!service_date || !service_type) return res.status(400).json({ error: 'service_date and service_type required' });

  try {
    await db.run(
      'UPDATE car_service_history SET service_date=?, service_type=?, description=?, mileage_km=?, cost=?, provider=? WHERE id=?',
      [service_date, service_type, description ?? null, maybeNumber(mileage_km), maybeNumber(cost), provider ?? null, id]
    );

    const updated = await db.get('SELECT * FROM car_service_history WHERE id = ?', [id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Update failed', details: err.message });
  }
});

// delete a service entry
router.delete('/service/:id', auth, async (req, res) => {
  const db = req.app.get('db');
  const id = req.params.id;

  const existing = await db.get('SELECT * FROM car_service_history WHERE id = ?', [id]);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  if (!isAdmin(req)) {
    const car = await db.get('SELECT advisor_id FROM cars WHERE id = ?', [existing.car_id]);
    if (!car || car.advisor_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  }

  try {
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
      return res.status(403).json({ error: 'Only sales/admin can manage cars' });
    }

    const db = req.app.get('db');
    const {
      make,
      model,
      year,
      price,
      description,
      featured,
      advisor_id: advisorBody,
      engine,
      mileage_km,
      horsepower_hp,
      exterior_color,
      interior_color,
      vin,
      vehicle_type,
      owner_name,
      owner_contact
    } = req.body;

    const advisor_id = isAdmin(req) ? (advisorBody ?? req.user.id) : req.user.id;
    const isFeatured = isAdmin(req) ? toBoolInt(featured, 0) : 0;

    const uploaded = []
      .concat(req.files?.image || [])
      .concat(req.files?.images || []);

    const imagePaths = parseArrayField(req.body.image_paths, []);
    const features = parseArrayField(req.body.features, []);
    const serviceHistory = parseArrayField(req.body.service_history, []);
    const primaryImageIndex = req.body.primary_image_index ?? 0;

    await db.exec('BEGIN');
    try {
      const result = await db.run(
        'INSERT INTO cars (make, model, year, price, description, engine, mileage_km, horsepower_hp, exterior_color, interior_color, image_path, advisor_id, featured, vin, vehicle_type, owner_name, owner_contact) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          make ?? null,
          model ?? null,
          maybeNumber(year),
          maybeNumber(price),
          description ?? null,
          engine ?? null,
          maybeNumber(mileage_km),
          maybeNumber(horsepower_hp),
          exterior_color ?? null,
          interior_color ?? null,
          null,
          advisor_id,
          isFeatured,
          vin ?? null,
          vehicle_type ?? 'inventory',
          owner_name ?? null,
          owner_contact ?? null
        ]
      );

      await upsertCarRelations(db, result.lastID, {
        uploadedImages: uploaded,
        imagePaths,
        features,
        serviceHistory,
        replaceImages: true,
        replaceFeatures: true,
        replaceServiceHistory: true,
        primaryImageIndex
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
      return res.status(403).json({ error: 'Only sales/admin can manage cars' });
    }

    const db = req.app.get('db');
    const existing = await db.get('SELECT * FROM cars WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Not found' });

    if (!isAdmin(req) && existing.advisor_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const {
      make,
      model,
      year,
      price,
      description,
      featured,
      advisor_id: advisorBody,
      engine,
      mileage_km,
      horsepower_hp,
      exterior_color,
      interior_color,
      vin,
      vehicle_type,
      owner_name,
      owner_contact
    } = req.body;

    const advisor_id = isAdmin(req)
      ? (advisorBody ?? existing.advisor_id)
      : existing.advisor_id;

    const isFeatured =
      isAdmin(req) && featured !== undefined
        ? toBoolInt(featured, existing.featured)
        : existing.featured;

    const uploaded = []
      .concat(req.files?.image || [])
      .concat(req.files?.images || []);

    const hasImagePaths = req.body.image_paths !== undefined;
    const hasFeatures = req.body.features !== undefined;
    const hasServiceHistory = req.body.service_history !== undefined;

    const imagePaths = parseArrayField(req.body.image_paths, []);
    const features = parseArrayField(req.body.features, []);
    const serviceHistory = parseArrayField(req.body.service_history, []);
    const primaryImageIndex = req.body.primary_image_index ?? 0;

    const replaceImages = toBoolInt(req.body.replace_images, 0) === 1 || hasImagePaths || uploaded.length > 0;
    const replaceFeatures = toBoolInt(req.body.replace_features, 0) === 1 || hasFeatures;
    const replaceServiceHistory = toBoolInt(req.body.replace_service_history, 0) === 1 || hasServiceHistory;

    await db.exec('BEGIN');
    try {
      await db.run(
        'UPDATE cars SET make=?, model=?, year=?, price=?, description=?, engine=?, mileage_km=?, horsepower_hp=?, exterior_color=?, interior_color=?, advisor_id=?, featured=?, vin=?, vehicle_type=?, owner_name=?, owner_contact=?, updated_at=CURRENT_TIMESTAMP WHERE id=?',
        [
          make ?? existing.make,
          model ?? existing.model,
          maybeNumber(year) ?? existing.year,
          maybeNumber(price) ?? existing.price,
          description ?? existing.description,
          engine ?? existing.engine,
          maybeNumber(mileage_km) ?? existing.mileage_km,
          maybeNumber(horsepower_hp) ?? existing.horsepower_hp,
          exterior_color ?? existing.exterior_color,
          interior_color ?? existing.interior_color,
          advisor_id,
          isFeatured,
          vin ?? existing.vin,
          vehicle_type ?? existing.vehicle_type,
          owner_name ?? existing.owner_name,
          owner_contact ?? existing.owner_contact,
          req.params.id
        ]
      );

      await upsertCarRelations(db, req.params.id, {
        uploadedImages: uploaded,
        imagePaths,
        features,
        serviceHistory,
        replaceImages,
        replaceFeatures,
        replaceServiceHistory,
        primaryImageIndex
      });

      await db.exec('COMMIT');
      const updated = await getCarWithRelations(db, req.params.id);
      return res.json(updated);
    } catch (err) {
      await db.exec('ROLLBACK');
      return res.status(500).json({ error: 'Update failed', details: err.message });
    }
  }
);

router.delete('/:id', auth, async (req, res) => {
  if (!canManageCars(req)) {
    return res.status(403).json({ error: 'Only sales/admin can manage cars' });
  }

  const db = req.app.get('db');
  const existing = await db.get('SELECT * FROM cars WHERE id = ?', [req.params.id]);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  if (!isAdmin(req) && existing.advisor_id !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  await db.run('DELETE FROM cars WHERE id = ?', [req.params.id]);
  res.status(204).end();
});

module.exports = router;