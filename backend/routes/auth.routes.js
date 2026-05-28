import express from 'express';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// In-memory OTP storage (5-min expiry)
const otpStore = new Map();

const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'rapido-secret-2024');
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// SEND OTP (works for both login + registration)
router.post('/otp/send', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || phone.length < 10)
      return res.status(400).json({ message: 'Valid phone number is required' });

    const otp = generateOTP();
    otpStore.set(phone, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });

    console.log(`📱 OTP for ${phone}: ${otp}`);

    res.json({
      message: 'OTP sent successfully',
      otp, // shown on screen for demo
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// VERIFY OTP + LOGIN or REGISTER
router.post('/otp/verify', async (req, res) => {
  try {
    const { phone, otp, name, role } = req.body;
    if (!phone || !otp)
      return res.status(400).json({ message: 'Phone and OTP are required' });

    const stored = otpStore.get(phone);
    if (!stored) return res.status(400).json({ message: 'OTP not found or expired. Please resend.' });
    if (Date.now() > stored.expiresAt) {
      otpStore.delete(phone);
      return res.status(400).json({ message: 'OTP expired. Please resend.' });
    }
    if (stored.otp !== otp.toString())
      return res.status(401).json({ message: 'Invalid OTP' });

    otpStore.delete(phone);

    // Find or create user
    let user = await User.findOne({ phone });
    if (!user) {
      // New user registration via OTP
      if (!name) return res.status(400).json({ message: 'Name is required for new account' });
      user = await User.create({
        phone,
        name,
        role: role || 'customer',
      });
    }

    const token = user.generateToken();
    res.json({ message: 'Login successful', token, user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// TRADITIONAL LOGIN (email + password, kept for backward compat)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email });
    if (!user || !user.password)
      return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = user.generateToken();
    // Smart redirect based on role
    const redirectTo = user.role === 'driver' ? '/driver' : user.role === 'admin' ? '/admin' : '/home';
    res.json({ message: 'Login successful', token, user, redirectTo });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// REGISTER (traditional email+password)
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, role, vehicleType, vehicleNumber } = req.body;
    if (!name || !phone || !password)
      return res.status(400).json({ message: 'Name, phone and password are required' });

    if (email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) return res.status(409).json({ message: 'Email already in use' });
    }

    const existingPhone = await User.findOne({ phone });
    if (existingPhone) return res.status(409).json({ message: 'Phone already registered' });

    const user = await User.create({
      name, email, phone, password,
      role: role || 'customer',
      vehicleType: role === 'driver' ? vehicleType : null,
      vehicleNumber: role === 'driver' ? vehicleNumber : null,
    });

    const token = user.generateToken();
    const redirectTo = user.role === 'driver' ? '/driver' : user.role === 'admin' ? '/admin' : '/home';
    res.status(201).json({ message: 'Registered successfully', token, user, redirectTo });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Signup alias
router.post('/signup', async (req, res) => {
  req.url = '/register';
  router.handle(req, res, () => {});
});

// GET PROFILE (authenticated)
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// UPDATE PROFILE
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, email, vehicleType, vehicleNumber } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (vehicleType) updates.vehicleType = vehicleType;
    if (vehicleNumber) updates.vehicleNumber = vehicleNumber;

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password');
    res.json({ message: 'Profile updated', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/logout', (req, res) => res.json({ message: 'Logged out successfully' }));

export default router;
