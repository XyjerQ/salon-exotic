const PERMISSIONS = [
  { key: 'dashboard.view', label: 'Open dashboard' },
  { key: 'cars.view', label: 'View cars' },
  { key: 'cars.create', label: 'Add cars' },
  { key: 'cars.edit', label: 'Edit cars' },
  { key: 'cars.delete', label: 'Delete cars' },
  { key: 'cars.manage_all', label: 'Manage all cars' },
  { key: 'employees.view', label: 'View employees' },
  { key: 'employees.create', label: 'Add employees' },
  { key: 'employees.edit', label: 'Edit employees' },
  { key: 'employees.delete', label: 'Delete employees' },
  { key: 'transactions.view', label: 'View transaction history' },
  { key: 'transactions.create', label: 'Add transactions' },
  { key: 'transactions.edit', label: 'Edit transactions' },
  { key: 'transactions.delete', label: 'Delete transactions' },
  { key: 'transactions.manage_all', label: 'Manage all transaction history' },
  { key: 'test_drives.view', label: 'View test drives' },
  { key: 'test_drives.manage', label: 'Manage test drives' },
  { key: 'messages.view', label: 'View messages' },
  { key: 'messages.reply', label: 'Reply to messages' },
  { key: 'site_settings.manage', label: 'Manage site settings' },
  { key: 'faq.manage', label: 'Manage FAQ' },
  { key: 'roles.manage', label: 'Manage roles and permissions' }
];

const allPermissions = PERMISSIONS.map((permission) => permission.key);
const BUILTIN_ROLE_PERMISSIONS = {
  admin: allPermissions,
  manager: [
    'dashboard.view', 'cars.view', 'cars.create', 'cars.edit', 'cars.delete', 'cars.manage_all',
    'employees.view', 'employees.create', 'employees.edit',
    'transactions.view', 'transactions.create', 'transactions.edit', 'transactions.delete', 'transactions.manage_all',
    'test_drives.view', 'test_drives.manage', 'messages.view', 'messages.reply',
    'site_settings.manage', 'faq.manage'
  ],
  sales: ['dashboard.view', 'cars.view', 'cars.create', 'cars.edit', 'transactions.view', 'transactions.create', 'transactions.edit', 'transactions.delete', 'test_drives.manage', 'test_drives.view', 'messages.view', 'messages.reply'],
  service: ['dashboard.view', 'cars.view', 'cars.create', 'cars.edit', 'transactions.view', 'transactions.create', 'transactions.edit', 'transactions.delete', 'test_drives.view', 'messages.view', 'messages.reply']
};

module.exports = { PERMISSIONS, BUILTIN_ROLE_PERMISSIONS };
