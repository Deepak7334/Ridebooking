// backend/routes/admin.routes.js
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Ride from '../models/Ride.js';
import Payment from '../models/Payment.js';
import Driver from '../models/Driver.js';
import SystemSettings from '../models/SystemSettings.js';
import PromoCode from '../models/PromoCode.js';

const router = express.Router();

// Admin auth middleware
const adminOnly = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'rapido-secret-2024');
    if (decoded.role !== 'admin')
      return res.status(403).json({ message: 'Admin access required' });
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// DASHBOARD STATS
router.get('/stats', adminOnly, async (req, res) => {
  try {
    const [totalCustomers, totalDrivers, totalRides, completedRides, activeRides, payments] = await Promise.all([
      User.countDocuments({ role: { $in: ['customer', 'passenger'] } }),
      User.countDocuments({ role: 'driver' }),
      Ride.countDocuments(),
      Ride.countDocuments({ status: 'completed' }),
      Ride.countDocuments({ status: { $in: ['requested', 'accepted', 'started'] } }),
      Payment.find({ status: 'completed' }),
    ]);

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const pendingDriverApprovals = await Driver.countDocuments({ docsVerified: false, 'documents.0': { $exists: true } });

    res.json({ totalCustomers, totalDrivers, totalRides, completedRides, activeRides, totalRevenue, pendingDriverApprovals });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET ALL USERS
router.get('/users', adminOnly, async (req, res) => {
  try {
    const users = await User.find({ role: { $in: ['customer', 'passenger'] } }).select('-password').sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// GET ALL DRIVERS (auth from User, profile from Driver)
router.get('/drivers', adminOnly, async (req, res) => {
  try {
    const drivers = await Driver.find({}).sort({ createdAt: -1 })
      .populate('userId', '-password');

    res.json({ drivers });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// CREATE NEW DRIVER
router.post('/drivers', adminOnly, async (req, res) => {
  try {
    const { firstName, lastName, phone, alternatePhone, aadharNumber, panCard, address, password, vehicleType, vehicleNumber } = req.body;
    
    // Create user
    const user = new User({
      name: `${firstName} ${lastName}`.trim(),
      firstName,
      lastName,
      phone,
      alternatePhone,
      aadharNumber,
      panCard,
      address,
      password,
      role: 'driver',
      createdBy: 'admin',
      isActive: true,
      vehicleType,
      vehicleNumber
    });
    await user.save();

    // Create driver profile
    const driver = new Driver({
      userId: user._id,
      vehicleType: vehicleType || null,
      vehicleNumber: vehicleNumber || null,
      docsVerified: true // Auto-verify if admin creates
    });
    await driver.save();
    
    const populated = await Driver.findById(driver._id).populate('userId', '-password');
    res.status(201).json({ message: 'Driver created successfully', driver: populated });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Phone number already registered' });
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// UPDATE DRIVER
router.put('/drivers/:id', adminOnly, async (req, res) => {
  try {
    // :id is User._id
    const { firstName, lastName, phone, alternatePhone, aadharNumber, panCard, address, vehicleType, vehicleNumber } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Driver not found' });
    
    if (firstName || lastName) user.name = `${firstName || user.firstName || ''} ${lastName || user.lastName || ''}`.trim();
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (alternatePhone) user.alternatePhone = alternatePhone;
    if (aadharNumber) user.aadharNumber = aadharNumber;
    if (panCard) user.panCard = panCard;
    if (address) user.address = address;
    if (vehicleType) user.vehicleType = vehicleType;
    if (vehicleNumber) user.vehicleNumber = vehicleNumber;
    await user.save();

    const driver = await Driver.findOneAndUpdate(
      { userId: req.params.id },
      { vehicleType, vehicleNumber },
      { new: true }
    ).populate('userId', '-password');

    res.json({ message: 'Driver updated', driver });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Phone number already in use' });
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// APPROVE DRIVER
router.patch('/drivers/:id/approve', adminOnly, async (req, res) => {
  try {
    const updated = await Driver.findOneAndUpdate(
      { userId: req.params.id },
      { docsVerified: true, isOnline: false },
      { new: true }
    ).populate('userId', '-password');

    if (!updated) return res.status(404).json({ message: 'Driver not found' });
    await User.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true });
    res.json({ message: 'Driver approved', driver: updated });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// REJECT DRIVER
router.patch('/drivers/:id/reject', adminOnly, async (req, res) => {
  try {
    const updated = await Driver.findOneAndUpdate(
      { userId: req.params.id },
      { docsVerified: false },
      { new: true }
    ).populate('userId', '-password');

    if (!updated) return res.status(404).json({ message: 'Driver not found' });
    await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    res.json({ message: 'Driver rejected', driver: updated });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// DELETE DRIVER
router.delete('/drivers/:id', adminOnly, async (req, res) => {
  try {
    // :id is User._id
    await User.findByIdAndDelete(req.params.id);
    await Driver.findOneAndDelete({ userId: req.params.id });
    res.json({ message: 'Driver deleted' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// GET ALL RIDES
router.get('/rides', adminOnly, async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const query = status ? { status } : {};
    const rides = await Ride.find(query)
      .populate('passengerId', 'name phone')
      .populate('driverId', 'name phone vehicleType vehicleNumber')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    const total = await Ride.countDocuments(query);
    res.json({ rides, total });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// ADMIN CANCEL RIDE
router.patch('/rides/:id/cancel', adminOnly, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    if (['completed', 'cancelled'].includes(ride.status))
      return res.status(400).json({ message: 'Cannot cancel this ride' });
    ride.status = 'cancelled';
    await ride.save();
    res.json({ message: 'Ride cancelled by admin', ride });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// ADMIN FORCE COMPLETE RIDE
router.patch('/rides/:id/complete', adminOnly, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    ride.status = 'completed';
    ride.completedAt = new Date();
    ride.paymentStatus = 'paid';
    await ride.save();
    try { await Payment.create({ rideId: ride._id, passengerId: ride.passengerId, driverId: ride.driverId, amount: ride.fare, method: ride.paymentMethod || 'cash', status: 'completed' }); } catch {}
    res.json({ message: 'Ride force-completed', ride });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// TOGGLE USER ACTIVE STATUS
router.patch('/users/:id/toggle', adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ message: `User ${user.isActive ? 'activated' : 'deactivated'}`, user });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// ----------------------------------------------------
// SYSTEM SETTINGS
// ----------------------------------------------------
router.get('/settings', adminOnly, async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) settings = await SystemSettings.create({});
    res.json({ settings });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.put('/settings', adminOnly, async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) settings = new SystemSettings(req.body);
    else Object.assign(settings, req.body);
    await settings.save();
    res.json({ message: 'Settings updated', settings });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// ----------------------------------------------------
// PROMO CODES
// ----------------------------------------------------
router.get('/promos', adminOnly, async (req, res) => {
  try {
    const promos = await PromoCode.find().sort({ createdAt: -1 });
    res.json({ promos });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.post('/promos', adminOnly, async (req, res) => {
  try {
    const promo = await PromoCode.create(req.body);
    res.status(201).json({ message: 'Promo created', promo });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Promo code already exists' });
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/promos/:id', adminOnly, async (req, res) => {
  try {
    const promo = await PromoCode.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!promo) return res.status(404).json({ message: 'Promo not found' });
    res.json({ message: 'Promo updated', promo });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.delete('/promos/:id', adminOnly, async (req, res) => {
  try {
    await PromoCode.findByIdAndDelete(req.params.id);
    res.json({ message: 'Promo deleted' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// ----------------------------------------------------
// PAYOUTS / WALLET
// ----------------------------------------------------
router.get('/payouts', adminOnly, async (req, res) => {
  try {
    // Find all users who are drivers and have non-zero wallet balance
    const drivers = await User.find({ role: 'driver', walletBalance: { $ne: 0, $exists: true } })
      .select('name phone walletBalance')
      .sort({ walletBalance: -1 }); // Positive means platform owes driver, Negative means driver owes platform
    res.json({ drivers });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.post('/payouts/settle/:id', adminOnly, async (req, res) => {
  try {
    // :id is User._id
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const oldBalance = user.walletBalance;
    user.walletBalance = 0;
    await user.save();
    res.json({ message: `Settled balance of ₹${oldBalance}`, user });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// ----------------------------------------------------
// LIVE MAP DATA (GOD'S EYE)
// ----------------------------------------------------
router.get('/live-map-data', adminOnly, async (req, res) => {
  try {
    // 1. Get online drivers with valid coordinates
    const drivers = await Driver.find({
      isOnline: true,
      'location.coordinates': { $ne: [0, 0] }
    }).populate('userId', 'name phone').select('userId vehicleType vehicleNumber location');

    // 2. Get active rides (requested, accepted, started)
    const rides = await Ride.find({ status: { $in: ['requested', 'accepted', 'started'] } })
      .populate('passengerId', 'name phone')
      .populate('driverId', 'name phone vehicleType');
      
    res.json({ drivers, rides });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// ----------------------------------------------------
// MANUAL DISPATCH
// ----------------------------------------------------
router.post('/dispatch', adminOnly, async (req, res) => {
  try {
    const { passengerPhone, passengerName, pickupLocation, dropoffLocation, vehicleType, driverId, fare } = req.body;
    
    // Find or create passenger
    let passenger = await User.findOne({ phone: passengerPhone, role: 'passenger' });
    if (!passenger) {
      passenger = await User.create({
        name: passengerName || 'Guest User',
        phone: passengerPhone,
        role: 'passenger',
        password: Math.random().toString(36).slice(-8) // random password
      });
    }

    const pickLng = Number(pickupLocation.lng || 0);
    const pickLat = Number(pickupLocation.lat || 0);
    const dropLng = Number(dropoffLocation.lng || 0);
    const dropLat = Number(dropoffLocation.lat || 0);

    const distance = Math.sqrt(Math.pow(pickLat - dropLat, 2) + Math.pow(pickLng - dropLng, 2)) * 111; // rough approx km

    const ride = await Ride.create({
      passengerId: passenger._id,
      driverId: driverId || null,
      pickupLocation: {
        address: pickupLocation.address || 'Manual Dispatch Pickup',
        coordinates: [pickLng, pickLat],
      },
      dropoffLocation: {
        address: dropoffLocation.address || 'Manual Dispatch Dropoff',
        coordinates: [dropLng, dropLat],
      },
      vehicleType: vehicleType || 'auto',
      fare: fare || Math.round(30 + distance * 12),
      distance: Math.round(distance * 10) / 10,
      otp: Math.floor(1000 + Math.random() * 9000).toString(),
      status: driverId ? 'accepted' : 'requested', // Auto-accept if assigned
      paymentMethod: 'cash',
    });

    res.status(201).json({ message: 'Ride manually dispatched successfully', ride });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;
