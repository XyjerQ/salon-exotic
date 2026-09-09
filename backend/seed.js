const fs = require('fs/promises');
const path = require('path');
const bcrypt = require('bcrypt');
const { PERMISSIONS, BUILTIN_ROLE_PERMISSIONS } = require('./permissions');

const employeesSeedPath = path.resolve(__dirname, '../salon-exotic/src/data/employees.json');
const carsSeedPath = path.resolve(__dirname, '../salon-exotic/src/data/cars.json');
const faqSeedPath = path.resolve(__dirname, '../salon-exotic/src/data/faq.json');

const ADMIN_EMAIL = 'a@a.pl';
const ADMIN_PASSWORD = 'admin';

const DEFAULT_SITE_SETTINGS = {
  site_name: 'Blackline Salon',
  headline: 'Blackline',
  site_tagline: 'Premium & exotic cars showroom.',
  address: '123 Luxury Ave, Warsaw, PL',
  phone: '+48 600 000 000',
  email: 'info@blackline.com',
  instagram_url: 'https://instagram.com',
  facebook_url: 'https://facebook.com',
  linkedin_url: 'https://linkedin.com',
  tiktok_url: '',
  copyright_text: '© 2026 Blackline Salon. All rights reserved.'
};

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

async function seedTestDrives(db) {
  const countRow = await db.get('SELECT COUNT(*) AS count FROM test_drives');
  if ((countRow?.count || 0) > 0) return;

  const cars = await db.all('SELECT id FROM cars LIMIT 5');
  const carIds = cars.map(c => c.id);

  const sampleTestDrives = [
    {
      customer_name: 'Adam Małysz',
      customer_email: 'adam.malysz@example.com',
      customer_phone: '+48 500 600 700',
      car_id: carIds.length > 0 ? carIds[0] : null,
      requested_date: '2026-09-15',
      status: 'confirmed',
      notes: 'Klient prosił o przygotowanie auta w czarnym kolorze i pełny bak.'
    },
    {
      customer_name: 'Katarzyna Figura',
      customer_email: 'k.figura@interia.pl',
      customer_phone: '+48 601 702 803',
      car_id: null,
      requested_date: '2026-09-18',
      status: 'pending',
      notes: 'Zgłoszenie z formularza głównego, wymaga kontaktu telefonicznego.'
    },
    {
      customer_name: 'Robert Kubica',
      customer_email: 'f1.robert@kubica.pl',
      customer_phone: '+48 999 888 777',
      car_id: carIds.length > 1 ? carIds[1] : (carIds.length > 0 ? carIds[0] : null),
      requested_date: '2026-09-10',
      status: 'completed',
      notes: 'Jazda odbyła się pomyślnie, klient wstępnie zainteresowany zakupem.'
    },
    {
      customer_name: 'Janusz Tracz',
      customer_email: 'tracz@interes.pl',
      customer_phone: '+48 700 800 900',
      car_id: null,
      requested_date: '2026-09-22',
      status: 'cancelled',
      notes: 'Klient odwołał wizytę z powodu wyjazdu.'
    }
  ];

  for (const td of sampleTestDrives) {
    await db.run(
      `INSERT INTO test_drives (customer_name, customer_email, customer_phone, car_id, requested_date, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        td.customer_name,
        td.customer_email,
        td.customer_phone,
        td.car_id,
        td.requested_date,
        td.status,
        td.notes
      ]
    );
  }
}

async function seedNewsletterSubscribers(db) {
  const subscribers = [
    'alex.morgan@example.com',
    'olivia.carter@example.com',
    'noah.bennett@example.com',
    'emma.rivers@example.com',
    'liam.hudson@example.com',
    'sophia.wells@example.com'
  ];

  for (const email of subscribers) {
    await db.run(
      'INSERT OR IGNORE INTO newsletter_subscribers (email, active) VALUES (?, 1)',
      [email]
    );
  }
}

async function seedSiteSettings(db) {
  for (const [key, value] of Object.entries(DEFAULT_SITE_SETTINGS)) {
    await db.run(
      `INSERT INTO site_settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = CASE
         WHEN site_settings.value IS NULL OR site_settings.value = '' THEN excluded.value
         ELSE site_settings.value
       END, updated_at = CURRENT_TIMESTAMP`,
      [key, value]
    );
  }
}

async function seedRoles(db) {
  for (const permission of PERMISSIONS) {
    await db.run('INSERT OR IGNORE INTO permissions (key, label) VALUES (?, ?)', [permission.key, permission.label]);
  }

  for (const [roleName, permissionKeys] of Object.entries(BUILTIN_ROLE_PERMISSIONS)) {
    await db.run(
      `INSERT INTO roles (name, display_name, is_system) VALUES (?, ?, 1)
       ON CONFLICT(name) DO UPDATE SET display_name = excluded.display_name`,
      [roleName, roleName.charAt(0).toUpperCase() + roleName.slice(1)]
    );
    const role = await db.get('SELECT id FROM roles WHERE name = ?', [roleName]);
    for (const permissionKey of permissionKeys) {
      const permission = await db.get('SELECT id FROM permissions WHERE key = ?', [permissionKey]);
      await db.run('INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)', [role.id, permission.id]);
    }
  }

  await db.run(`
    UPDATE employees
    SET role_id = (SELECT id FROM roles WHERE roles.name = employees.role)
    WHERE role_id IS NULL
  `);
}

async function seedFaq(db) {
  const existing = await db.get('SELECT COUNT(*) AS count FROM faq_categories');
  if (Number(existing?.count || 0) > 0) return;

  const categories = await readJson(faqSeedPath);
  for (let categoryIndex = 0; categoryIndex < categories.length; categoryIndex += 1) {
    const category = categories[categoryIndex];
    const categoryResult = await db.run(
      'INSERT INTO faq_categories (name, icon, sort_order) VALUES (?, ?, ?)',
      [category.category, category.icon || '', categoryIndex]
    );

    for (let questionIndex = 0; questionIndex < (category.questions || []).length; questionIndex += 1) {
      const question = category.questions[questionIndex];
      await db.run(
        'INSERT INTO faq_questions (category_id, question, answer, sort_order) VALUES (?, ?, ?, ?)',
        [categoryResult.lastID, question.q, question.a, questionIndex]
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
  await seedRoles(db);
  await seedSiteSettings(db);
  await seedFaq(db);
  if (databaseHasData) {
    await seedMissingCarFeatures(db);
    await seedTestDrives(db);
    await seedNewsletterSubscribers(db);
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
  await seedTestDrives(db);
  await seedNewsletterSubscribers(db);
}

module.exports = {
  ensureSeedData,
  ensureCarSchemaExtras,
  DEFAULT_SITE_SETTINGS
};