const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || (fs.existsSync(path.join(process.cwd(), 'backend/data')) ? path.join(process.cwd(), 'backend/data') : path.join(__dirname, '../../data'));
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Default initial accounts
const DEFAULT_USERS = [
  {
    id: 'usr_nurse_1',
    name: 'Nurse Sarah Jenkins',
    email: 'nurse@stjude.org',
    password: 'password123',
    role: 'Clinical Staff / Nurse',
    department: 'Operating Theater',
    avatar: '👩‍⚕️',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr_officer_2',
    name: 'Officer Marcus Cole',
    email: 'officer@stjude.org',
    password: 'password123',
    role: 'Biohazard Safety Officer',
    department: 'Central Holding Bay',
    avatar: '👨‍🔬',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr_driver_3',
    name: 'Robert Langdon',
    email: 'driver@cbwtf.org',
    password: 'password123',
    role: 'CBWTF Transport Custodian',
    department: 'Apex Bio-Clean Logistics',
    avatar: '🚚',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr_admin_4',
    name: 'Dr. Aaron Patel',
    email: 'admin@stjude.org',
    password: 'password123',
    role: 'Chief Medical Superintendent',
    department: 'Hospital Administration',
    avatar: '🩺',
    createdAt: new Date().toISOString(),
  },
];

const loadUsers = () => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(USERS_FILE)) {
      const raw = fs.readFileSync(USERS_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    fs.writeFileSync(USERS_FILE, JSON.stringify(DEFAULT_USERS, null, 2), 'utf8');
    return DEFAULT_USERS;
  } catch (err) {
    console.error('Error loading users file:', err.message);
    return DEFAULT_USERS;
  }
};

const saveUsers = (users) => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving users file:', err.message);
  }
};

// POST /api/auth/register - Register with original email
exports.register = (req, res) => {
  const { name, fullName, email, password, role, department } = req.body;
  const resolvedName = (name || fullName || '').trim();

  if (!resolvedName || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Full name, valid email, and password are required to register.',
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid original email address (e.g. yourname@domain.com).',
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long.',
    });
  }

  const users = loadUsers();
  const normalizedEmail = email.trim().toLowerCase();

  const existing = users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (existing) {
    return res.status(400).json({
      success: false,
      message: `An account with email "${normalizedEmail}" is already registered. Please sign in instead.`,
    });
  }

  const newUser = {
    id: `usr_${Date.now()}`,
    name: resolvedName,
    email: normalizedEmail,
    password: password,
    role: role || 'Clinical Staff / Nurse',
    department: department || 'General Ward',
    avatar: role?.includes('Officer') ? '👨‍🔬' : role?.includes('Driver') ? '🚚' : role?.includes('Superintendent') ? '🩺' : '👩‍⚕️',
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);

  const { password: _, ...userData } = newUser;
  res.status(201).json({
    success: true,
    message: `Account created successfully! Welcome to MED_WASTE, ${newUser.name}.`,
    user: userData,
    token: `token_${newUser.id}_${Date.now()}`,
  });
};

// POST /api/auth/login - Login with registered email
exports.login = (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide your email address and password.',
    });
  }

  const users = loadUsers();
  const normalizedEmail = email.trim().toLowerCase();
  const user = users.find((u) => u.email.toLowerCase() === normalizedEmail);

  if (!user || user.password !== password) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password. Please check your credentials or create a new account.',
    });
  }

  const { password: _, ...userData } = user;
  res.json({
    success: true,
    message: `Welcome back, ${user.name}! Logged in successfully.`,
    user: userData,
    token: `token_${user.id}_${Date.now()}`,
  });
};

exports.getMe = (req, res) => {
  const users = loadUsers();
  const { password: _, ...userData } = users[0];
  res.json({ success: true, user: userData });
};

exports.getDemoUsers = (req, res) => {
  const users = loadUsers();
  const publicUsers = users.slice(0, 4).map(({ password: _, ...u }) => u);
  res.json({ success: true, users: publicUsers });
};
