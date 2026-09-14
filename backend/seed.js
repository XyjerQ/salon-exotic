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
  await ensureColumn(db, 'cars', 'inventory_visible', 'inventory_visible INTEGER DEFAULT 1');
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

async function seedContacts(db) {
  const countRow = await db.get('SELECT COUNT(*) AS count FROM contacts');
  if (Number(countRow?.count || 0) > 0) return;

  const sampleContacts = [
    {
      name: 'Mateusz Zielinski',
      email: 'mateusz.zielinski@example.com',
      phone: '+48 501 234 567',
      subject: 'Vehicle Availability',
      message: 'Dzien dobry, czy Porsche 911 GT3 RS jest nadal dostepne? Chetnie umowie jazde probna.'
    },
    {
      name: 'Julia Nowak',
      email: 'julia.nowak@example.com',
      phone: '+48 602 345 678',
      subject: 'Financing Question',
      message: 'Prosze o informacje dotyczace finansowania oraz wymaganej wplaty poczatkowej dla wybranego auta.'
    },
    {
      name: 'Tomasz Wisniewski',
      email: 'tomasz.wisniewski@example.com',
      phone: null,
      subject: 'Trade-In',
      message: 'Czy przyjmujecie samochody sportowe w rozliczeniu? Moglbym przeslac zdjecia i dane auta.'
    }
  ];

  for (const contact of sampleContacts) {
    await db.run(
      `INSERT INTO contacts (name, email, phone, subject, message, status)
       VALUES (?, ?, ?, ?, ?, 'new')`,
      [contact.name, contact.email, contact.phone, contact.subject, contact.message]
    );
  }
}

async function seedTransactionHistory(db) {
  const countRow = await db.get('SELECT COUNT(*) AS count FROM transaction_history');
  if (Number(countRow?.count || 0) > 0) return;

  const cars = await db.all('SELECT id, make, model FROM cars ORDER BY id LIMIT 4');
  const salesEmployee = await db.get("SELECT id FROM employees WHERE role = 'sales' ORDER BY id LIMIT 1");
  const serviceEmployee = await db.get("SELECT id FROM employees WHERE role = 'service' ORDER BY id LIMIT 1");
  const manager = await db.get("SELECT id FROM employees WHERE role = 'manager' ORDER BY id LIMIT 1");
  const salesId = salesEmployee?.id || manager?.id || null;
  const serviceId = serviceEmployee?.id || manager?.id || salesId;

  const records = [
    {
      type: 'vehicle_sale', carId: cars[0]?.id || null, employeeId: salesId,
      customer: 'Piotr Kowalczyk', email: 'piotr.kowalczyk@example.com', phone: '+48 500 111 222',
      title: `${cars[0]?.make || 'Porsche'} ${cars[0]?.model || '911'} sale`, description: 'Finalized vehicle sale after inspection and test drive.',
      amount: 147000, payment: 'leasing', status: 'completed', date: '2026-08-28', notes: 'Delivery arranged to Warsaw.'
    },
    {
      type: 'vehicle_sale', carId: cars[1]?.id || null, employeeId: salesId,
      customer: 'Anna Zielinska', email: 'anna.zielinska@example.com', phone: '+48 601 222 333',
      title: `${cars[1]?.make || 'BMW'} ${cars[1]?.model || 'M4'} sale`, description: 'Vehicle sold with ceramic coating package.',
      amount: 82250, payment: 'transfer', status: 'completed', date: '2026-08-21', notes: null
    },
    {
      type: 'service', carId: cars[2]?.id || null, employeeId: serviceId,
      customer: 'Marek Wroblewski', email: 'marek.wroblewski@example.com', phone: '+48 602 333 444',
      title: 'Full vehicle inspection', description: 'Pre-purchase inspection, diagnostics and fluid check.',
      amount: 250, payment: 'card', status: 'completed', date: '2026-09-02', notes: 'Customer requested a written report.'
    },
    {
      type: 'detailing', carId: cars[3]?.id || cars[0]?.id || null, employeeId: serviceId,
      customer: 'Karol Jablonski', email: 'karol.jablonski@example.com', phone: '+48 603 444 555',
      title: 'Paint correction and ceramic coating', description: 'Two-stage correction, ceramic coating and interior detailing.',
      amount: 1550, payment: 'cash', status: 'completed', date: '2026-08-30', notes: 'Maintenance wash recommended every two weeks.'
    },
    {
      type: 'service', carId: cars[0]?.id || null, employeeId: serviceId,
      customer: 'Salon Exotic', email: null, phone: null,
      title: 'Seasonal fleet service', description: 'Oil, filters and brake inspection for showroom vehicle.',
      amount: 700, payment: 'transfer', status: 'in_progress', date: '2026-09-08', notes: 'Waiting for brake parts.'
    }
  ];

  for (const record of records) {
    await db.run(
      `INSERT INTO transaction_history
       (transaction_type, car_id, employee_id, customer_name, customer_email, customer_phone, title, description, amount, payment_method, status, transaction_date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [record.type, record.carId, record.employeeId, record.customer, record.email, record.phone, record.title, record.description, record.amount, record.payment, record.status, record.date, record.notes]
    );
  }
}

async function syncSoldCarsFromTransactions(db) {
  await db.run(`
    UPDATE cars
    SET status = 'sold', inventory_visible = 0, updated_at = CURRENT_TIMESTAMP
    WHERE id IN (
      SELECT car_id FROM transaction_history
      WHERE transaction_type = 'vehicle_sale' AND status = 'completed' AND car_id IS NOT NULL
    )
  `);
}

async function seedServiceTransactions(db) {
  const serviceEntries = await db.all(`
    SELECT csh.*, c.owner_name, c.owner_email, c.owner_contact
    FROM car_service_history csh
    LEFT JOIN cars c ON c.id = csh.car_id
    LEFT JOIN transaction_history th ON th.service_history_id = csh.id
    WHERE th.id IS NULL
  `);
  if (serviceEntries.length === 0) return;

  const employee = await db.get("SELECT id FROM employees WHERE role IN ('service', 'manager', 'admin') ORDER BY CASE role WHEN 'service' THEN 1 WHEN 'manager' THEN 2 ELSE 3 END LIMIT 1");
  for (const entry of serviceEntries) {
    await db.run(
      `INSERT INTO transaction_history
       (transaction_type, service_history_id, car_id, employee_id, customer_name, customer_email, customer_phone, title, description, amount, status, transaction_date, notes)
       VALUES ('service', ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?)`,
      [
        entry.id,
        entry.car_id,
        employee?.id || null,
        entry.owner_name || 'Salon Exotic',
        entry.owner_email || null,
        entry.owner_contact || null,
        entry.service_type,
        entry.description || null,
        Number(entry.cost) || 0,
        entry.service_date,
        entry.provider || null
      ]
    );
  }
}

async function seedServiceHistory(db) {
  const countRow = await db.get('SELECT COUNT(*) AS count FROM car_service_history');
  if (Number(countRow?.count || 0) > 0) return;

  const cars = await db.all('SELECT id, make, model FROM cars LIMIT 4');
  if (cars.length === 0) return;

  const sampleServiceEntries = [
    {
      carId: cars[0].id,
      serviceDate: '2026-05-12',
      serviceType: 'Wymiana oleju i filtrów',
      provider: 'ASO BMW Warszawa',
      mileage: 122400,
      cost: 2500,
      description: 'Standardowy przegląd okresowy, wymiana oleju silnikowego oraz filtrów kabinowych.'
    },
    {
      carId: cars[0].id,
      serviceDate: '2026-07-20',
      serviceType: 'Wymiana klocków hamulcowych',
      provider: 'Serwis Sportowy Blackline',
      mileage: 124200,
      cost: 4200,
      description: 'Montaż nowych klocków hamulcowych przód/tył oraz kontrola płynu hamulcowego.'
    },
    {
      carId: cars[1]?.id || cars[0].id,
      serviceDate: '2026-06-10',
      serviceType: 'Detailing i zabezpieczenie lakieru',
      provider: 'Car Spa Studio',
      mileage: 5100,
      cost: 3500,
      description: 'Jednostopniowa korekta lakieru oraz aplikacja powłoki ceramicznej.'
    },
    {
      carId: cars[2]?.id || cars[0].id,
      serviceDate: '2026-08-01',
      serviceType: 'Diagnostyka elektroniki',
      provider: 'Autoryzowany Serwis',
      mileage: 24000,
      cost: 650,
      description: 'Aktualizacja oprogramowania sterującego oraz pełna diagnostyka komputerowa.'
    }
  ];

  for (const entry of sampleServiceEntries) {
    await db.run(
      `INSERT INTO car_service_history 
       (car_id, service_date, service_type, provider, mileage_km, cost, description)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        entry.carId,
        entry.serviceDate,
        entry.serviceType,
        entry.provider,
        entry.mileage,
        entry.cost,
        entry.description
      ]
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
  await seedContacts(db);
  
  if (databaseHasData) {
    // Nawet jeśli baza ma już dane, upewnijmy się, że historia serwisowa jest zasilona
    await seedServiceHistory(db);
    await seedTransactionHistory(db);
    await seedServiceTransactions(db);
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
  await seedServiceHistory(db);       
  await seedTransactionHistory(db);
  await seedServiceTransactions(db);
  await syncSoldCarsFromTransactions(db);
  await seedTestDrives(db);
  await seedNewsletterSubscribers(db);
}

module.exports = {
  ensureSeedData,
  ensureCarSchemaExtras,
  DEFAULT_SITE_SETTINGS
};