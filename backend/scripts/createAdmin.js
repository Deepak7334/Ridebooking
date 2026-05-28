// Run this once: node backend/scripts/createAdmin.js
// This creates the admin account in MongoDB

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath   = join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) dotenv.config({ path: envPath });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rapido';

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, lowercase: true, unique: true, sparse: true },
  phone:    { type: String, required: true, unique: true },
  password: String,
  role:     { type: String, enum: ['customer','driver','admin','passenger'], default: 'customer' },
  isActive: { type: Boolean, default: true },
  docsVerified: { type: Boolean, default: false },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

const ADMIN = {
  name:     'Admin Owner',
  email:    'admin@rapido.com',
  phone:    '9999999999',
  password: 'Admin@1234',
  role:     'admin',
  isActive: true,
};

async function createAdmin() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB\n');

  const existing = await User.findOne({ $or: [{ phone: ADMIN.phone }, { email: ADMIN.email }] });

  if (existing) {
    // Update to admin if already exists
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(ADMIN.password, salt);
    await User.findByIdAndUpdate(existing._id, {
      role: 'admin', isActive: true, password: hashed, name: ADMIN.name, email: ADMIN.email,
    });
    console.log('✅ Existing account upgraded to admin!');
  } else {
    const salt   = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(ADMIN.password, salt);
    await User.create({ ...ADMIN, password: hashed });
    console.log('✅ Admin account created!');
  }

  console.log('\n╔═══════════════════════════════════════╗');
  console.log('║         ADMIN LOGIN CREDENTIALS       ║');
  console.log('╠═══════════════════════════════════════╣');
  console.log(`║  URL   :  http://localhost:3000/login ║`);
  console.log(`║  Method:  Email + Password            ║`);
  console.log(`║  Email :  ${ADMIN.email}       ║`);
  console.log(`║  Pass  :  ${ADMIN.password}             ║`);
  console.log('╚═══════════════════════════════════════╝');
  console.log('\n📌 Use the "Email" tab on the login page.\n');

  await mongoose.disconnect();
  process.exit(0);
}

createAdmin().catch(e => { console.error('❌', e.message); process.exit(1); });
