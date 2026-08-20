const fs = require('fs/promises');
const path = require('path');
const bcrypt = require('bcrypt');

const employeesSeedPath = path.resolve(__dirname, '../salon-exotic/src/data/employees.json');
const carsSeedPath = path.resolve(__dirname, '../salon-exotic/src/data/cars.json');

const ADMIN_EMAIL = 'a@a.pl';
const ADMIN_PASSWORD = 'admin';

function parseMoney(value) {
  if (value === undefined || value === null || value === '') return null;
  const cleaned = String(value).replace(/[^0-9.,-]/g, '').replace(/,/g, '');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseMileage(value) {
  if (value === undefined || value === null || value === '') return null;
  const cleaned = String(value).replace(/[^0-9-]/g, '');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

async function ensureColumn(db, tableName, columnName, columnDefinition) {
  const columns = await db.all(`PRAGMA table_info(${tableName})`);
  if (!columns.some((column) => column.name === columnName)) {
    await db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnDefinition}`);
  }
}

async function ensureCarSchemaExtras(db) {
  await ensureColumn(db, 'cars', 'transmission', 'transmission TEXT');
  await ensureColumn(db, 'cars', 'drivetrain', 'drivetrain TEXT');
  await ensureColumn(db, 'cars', 'fuel_type', 'fuel_type TEXT');
}

async function upsertEmployee(db, employee, overrides = {}) {
  const email = overrides.email || employee.email;
  const existing = await db.get('SELECT id FROM employees WHERE email = ?', [email]);
  if (existing?.id) {
    await db.run(
      `UPDATE employees
       SET photo_path = COALESCE(NULLIF(photo_path, ''), ?),
           description = COALESCE(NULLIF(description, ''), ?),
           specialization = COALESCE(NULLIF(specialization, ''), ?),
           phone = COALESCE(NULLIF(phone, ''), ?)
       WHERE id = ?`,
      [
        overrides.photo_path || `/${employee.photo}`,
        overrides.description || employee.position || null,
        overrides.specialization || employee.specialization || null,
        overrides.phone || employee.phone || null,
        existing.id
      ]
    );
    return existing.id;
  }

  const hash = await bcrypt.hash(overrides.password || 'password', 10);

  await db.run(
    `INSERT INTO employees (name, email, password_hash, phone, role, description, specialization, photo_path)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      overrides.name || `${employee.firstName} ${employee.lastName}`.trim(),
      email,
      hash,
      overrides.phone || employee.phone || null,
      overrides.role || 'sales',
      overrides.description || employee.position || null,
      overrides.specialization || employee.specialization || null,
      overrides.photo_path || `/${employee.photo}`
    ]
  );

  return existing?.id || (await db.get('SELECT id FROM employees WHERE email = ?', [email]))?.id || null;
}

async function seedCars(db, employeeMap) {
  const cars = await readJson(carsSeedPath);

  for (const car of cars) {
    const advisorId = employeeMap.get(car.assignedEmployee) || null;
    const isFeatured = car.featured ? 1 : 0;

    const existing = car.vin
      ? await db.get('SELECT * FROM cars WHERE vin = ?', [car.vin])
      : await db.get(
          'SELECT * FROM cars WHERE make = ? AND model = ? AND year = ?',
          [car.make || null, car.model || null, Number(car.year) || null]
        );

    let carId = existing?.id || null;

    if (existing) {
      await db.run(
        `UPDATE cars
         SET make=?, model=?, year=?, price=?, description=?, vin=?, vehicle_type=?, owner_name=?, owner_contact=?,
             transmission=?, drivetrain=?, fuel_type=?, engine=?, mileage_km=?, horsepower_hp=?, exterior_color=?, interior_color=?,
             advisor_id=?, featured=?, updated_at=CURRENT_TIMESTAMP
         WHERE id=?`,
        [
          car.make || existing.make,
          car.model || existing.model,
          Number(car.year) || existing.year,
          parseMoney(car.price) ?? existing.price,
          car.description || existing.description || null,
          car.vin || existing.vin || null,
          existing.vehicle_type || 'inventory',
          existing.owner_name || null,
          existing.owner_contact || null,
          car.transmission || existing.transmission || null,
          car.drivetrain || existing.drivetrain || null,
          car.fuelType || existing.fuel_type || null,
          car.engine || existing.engine || null,
          parseMileage(car.mileage) ?? existing.mileage_km,
          Number(car.horsepower) || existing.horsepower_hp || null,
          car.color || existing.exterior_color || null,
          car.interiorColor || existing.interior_color || null,
          advisorId || existing.advisor_id || null,
          isFeatured,
          existing.id
        ]
      );
    } else {
      const result = await db.run(
        `INSERT INTO cars (
          make, model, year, price, description, vin, vehicle_type, owner_name, owner_contact,
          transmission, drivetrain, fuel_type, engine, mileage_km, horsepower_hp, exterior_color, interior_color,
          image_path, advisor_id, featured
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          car.make || null,
          car.model || null,
          Number(car.year) || null,
          parseMoney(car.price),
          car.description || null,
          car.vin || null,
          'inventory',
          null,
          null,
          car.transmission || null,
          car.drivetrain || null,
          car.fuelType || null,
          car.engine || null,
          parseMileage(car.mileage),
          Number(car.horsepower) || null,
          car.color || null,
          car.interiorColor || null,
          null,
          advisorId,
          isFeatured
        ]
      );
      carId = result.lastID;
    }

    const imagesCount = await db.get('SELECT COUNT(*) AS count FROM car_images WHERE car_id = ?', [carId]);
    if ((imagesCount?.count || 0) === 0) {
      for (let index = 0; index < (car.images || []).length; index += 1) {
        const imagePath = `/${car.images[index]}`;
        await db.run(
          'INSERT INTO car_images (car_id, image_path, is_primary, sort_order) VALUES (?, ?, ?, ?)',
          [carId, imagePath, index === 0 ? 1 : 0, index]
        );
      }

      if ((car.images || []).length > 0) {
        await db.run('UPDATE cars SET image_path = ? WHERE id = ?', [`/${car.images[0]}`, carId]);
      }
    }

    const featureCount = await db.get('SELECT COUNT(*) AS count FROM car_features WHERE car_id = ?', [carId]);
    if ((featureCount?.count || 0) === 0) {
      for (let index = 0; index < (car.features || []).length; index += 1) {
        await db.run(
          'INSERT INTO car_features (car_id, feature, sort_order) VALUES (?, ?, ?)',
          [carId, car.features[index], index]
        );
      }
    }
  }
}

async function seedMissingCarFeatures(db) {
  const cars = await readJson(carsSeedPath);

  for (const car of cars) {
    if (!Array.isArray(car.features) || car.features.length === 0) continue;

    const existing = car.vin
      ? await db.get('SELECT id FROM cars WHERE vin = ?', [car.vin])
      : await db.get('SELECT id FROM cars WHERE make = ? AND model = ? AND year = ?', [car.make || null, car.model || null, Number(car.year) || null]);

    if (!existing?.id) continue;

    const featureCount = await db.get('SELECT COUNT(*) AS count FROM car_features WHERE car_id = ?', [existing.id]);
    if ((featureCount?.count || 0) > 0) continue;

    for (let index = 0; index < car.features.length; index += 1) {
      await db.run(
        'INSERT INTO car_features (car_id, feature, sort_order) VALUES (?, ?, ?)',
        [existing.id, car.features[index], index]
      );
    }
  }
}

async function ensureSeedData(db) {
  const tables = [
    'employees',
    'cars',
    'car_images',
    'car_features',
    'car_service_history',
    'test_drives',
    'contacts',
    'newsletter_subscribers'
  ];

  const counts = await Promise.all(
    tables.map(async (tableName) => {
      const row = await db.get(`SELECT COUNT(*) AS count FROM ${tableName}`);
      return Number(row?.count || 0);
    })
  );

  const databaseHasData = counts.some((count) => count > 0);
  if (databaseHasData) {
    await seedMissingCarFeatures(db);
    return;
  }

  const employees = await readJson(employeesSeedPath);
  const employeeMap = new Map();

  const adminId = await upsertEmployee(db, {
    firstName: 'admin',
    lastName: '',
    email: ADMIN_EMAIL,
    phone: null,
    position: 'Admin, CEO',
    photo: 'img/employees/piotr.png',
    specialization: 'Supercars'
  }, {
    name: 'admin',
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    role: 'admin',
    description: 'Admin, CEO',
    specialization: 'Supercars',
    photo_path: '/img/employees/piotr.png',
    phone: null
  });
  employeeMap.set('admin', adminId);

  for (const employee of employees) {
    const id = await upsertEmployee(db, employee, {
      password: 'password',
      role: 'sales',
      description: employee.position,
      specialization: employee.specialization,
      photo_path: `/${employee.photo}`
    });
    employeeMap.set(employee.id, id);
  }

  await seedCars(db, employeeMap);
}

module.exports = {
  ensureSeedData,
  ensureCarSchemaExtras
};