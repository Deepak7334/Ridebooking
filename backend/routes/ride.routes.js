// backend/routes/ride.routes.js
import express from 'express';
import jwt from 'jsonwebtoken';
import Ride from '../models/Ride.js';
import User from '../models/User.js';
import Payment from '../models/Payment.js';
import SystemSettings from '../models/SystemSettings.js';
import PromoCode from '../models/PromoCode.js';

const router = express.Router();

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'rapido-secret-2024');
    next();
  } catch (err) {
    console.error('Auth error:', err.message);
    res.status(401).json({ message: 'Invalid token' });
  }
};

const calcDistance = (loc1, loc2) => {
  const lat1 = loc1.lat ?? loc1.coordinates?.[1];
  const lng1 = loc1.lng ?? loc1.coordinates?.[0];
  const lat2 = loc2.lat ?? loc2.coordinates?.[1];
  const lng2 = loc2.lng ?? loc2.coordinates?.[0];
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export default (io) => {

  // GET OR CREATE SETTINGS
  const getSettings = async () => {
    let settings = await SystemSettings.findOne();
    if (!settings) settings = await SystemSettings.create({});
    return settings;
  };

  // ESTIMATE FARE
  router.post('/estimate-fare', async (req, res) => {
    try {
      const { pickupLocation, dropoffLocation, promoCode } = req.body;
      if (!pickupLocation || !dropoffLocation)
        return res.status(400).json({ message: 'Pickup and dropoff locations required' });

      const distance = calcDistance(pickupLocation, dropoffLocation);
      const settings = await getSettings();
      
      let fares = {
        auto: Math.round((settings.baseFareAuto + distance * settings.perKmAuto) * settings.surgeMultiplier),
        car:  Math.round((settings.baseFareCar + distance * settings.perKmCar) * settings.surgeMultiplier),
        bike: Math.round((settings.baseFareBike + distance * settings.perKmBike) * settings.surgeMultiplier),
      };

      let discount = 0;
      let promoApplied = false;

      if (promoCode) {
        const promo = await PromoCode.findOne({ code: promoCode.toUpperCase(), isActive: true });
        if (promo && (!promo.expiresAt || promo.expiresAt > new Date())) {
          // Calculate max discount across all vehicle types to show user (or apply individually)
          // To keep it simple, we just pass the discount info back
          promoApplied = true;
          // Apply discount to each fare
          for (let type in fares) {
            if (fares[type] >= promo.minRideAmount) {
              let possibleDiscount = fares[type] * (promo.discountPercent / 100);
              let actualDiscount = Math.min(possibleDiscount, promo.maxDiscountAmount);
              fares[type] = Math.max(0, Math.round(fares[type] - actualDiscount));
            }
          }
        }
      }

      res.json({ fares, distance: Math.round(distance * 10) / 10, duration: Math.round(distance * 3), promoApplied });
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  });

  // GET NEARBY DRIVERS
  router.get('/nearby-drivers', async (req, res) => {
    try {
      const { lat, lng } = req.query;
      if (!lat || !lng) return res.status(400).json({ message: 'Lat/lng required' });

      // Online verified drivers are stored in User model (role=driver)
      const drivers = await User.find({
        role: 'driver',
        docsVerified: true,
        isOnline: true,
      }).select('name phone vehicleType vehicleNumber averageRating location');


      res.json({ drivers });
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  });

  // GET RIDE HISTORY  (must be before /:rideId to avoid wildcard conflict)
  router.get('/user/history', authMiddleware, async (req, res) => {
    try {
      const isDriver = req.user.role === 'driver';
      const query = isDriver ? { driverId: req.user.id } : { passengerId: req.user.id };
      const rides = await Ride.find(query)
        .populate('passengerId', 'name phone')
        .populate('driverId', 'name phone vehicleType vehicleNumber')
        .sort({ createdAt: -1 });
      res.json({ rides });
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  });

  // GET AVAILABLE RIDES (for driver) – must be before /:rideId
  router.get('/driver/available', authMiddleware, async (req, res) => {
    try {
      const rides = await Ride.find({ status: 'requested', driverId: null })
        .populate('passengerId', 'name phone')
        .sort({ createdAt: -1 });
      res.json({ rides });
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  });

  // CREATE RIDE
  router.post('/create', authMiddleware, async (req, res) => {
    try {
      const { pickupLocation, dropoffLocation, vehicleType, fare, paymentMethod, promoCode } = req.body;
      console.log('Create ride payload:', JSON.stringify({ pickupLocation, dropoffLocation, vehicleType, fare, paymentMethod, promoCode }));

      if (!pickupLocation || !dropoffLocation)
        return res.status(400).json({ message: 'Pickup and dropoff required' });

      // Support both {lat,lng} and {coordinates:[lng,lat]}
      const pickLng = Number(pickupLocation.lng ?? pickupLocation.coordinates?.[0] ?? 0);
      const pickLat = Number(pickupLocation.lat ?? pickupLocation.coordinates?.[1] ?? 0);
      const dropLng = Number(dropoffLocation.lng ?? dropoffLocation.coordinates?.[0] ?? 0);
      const dropLat = Number(dropoffLocation.lat ?? dropoffLocation.coordinates?.[1] ?? 0);

      if (isNaN(pickLng) || isNaN(pickLat) || isNaN(dropLng) || isNaN(dropLat))
        return res.status(400).json({ message: 'Invalid coordinates. Please re-select pickup or destination.' });

      if (pickLat === 0 && pickLng === 0)
        return res.status(400).json({ message: 'Could not detect pickup location. Please allow location access.' });

      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      const distance = calcDistance(
        { lat: pickLat, lng: pickLng },
        { lat: dropLat, lng: dropLng }
      );

      // Verify promo logic if fare isn't provided (for safety)
      let finalFare = fare;
      if (typeof finalFare !== 'number' || finalFare <= 0) {
        const settings = await getSettings();
        let base = settings.baseFareAuto;
        let perKm = settings.perKmAuto;
        if (vehicleType === 'bike') { base = settings.baseFareBike; perKm = settings.perKmBike; }
        if (vehicleType === 'car') { base = settings.baseFareCar; perKm = settings.perKmCar; }
        
        finalFare = Math.round((base + distance * perKm) * settings.surgeMultiplier);
        
        if (promoCode) {
          const promo = await PromoCode.findOne({ code: promoCode.toUpperCase(), isActive: true });
          if (promo && (!promo.expiresAt || promo.expiresAt > new Date()) && finalFare >= promo.minRideAmount) {
            let possibleDiscount = finalFare * (promo.discountPercent / 100);
            let actualDiscount = Math.min(possibleDiscount, promo.maxDiscountAmount);
            finalFare = Math.max(0, Math.round(finalFare - actualDiscount));
          }
        }
      }

      const ride = await Ride.create({
        passengerId: req.user.id,
        pickupLocation: {
          address: pickupLocation.address || '',
          coordinates: [pickLng, pickLat],
        },
        dropoffLocation: {
          address: dropoffLocation.address || '',
          coordinates: [dropLng, dropLat],
        },
        vehicleType: vehicleType || 'auto',
        fare: finalFare,
        distance: Math.round(distance * 10) / 10,
        otp,
        status: 'requested',
        paymentMethod: paymentMethod || 'cash',
      });

      console.log('Ride created:', ride._id, '| OTP:', otp, '| Fare:', finalFare);

      // Notify only online drivers (available-drivers room)
      if (io) {
        const populatedRide = await Ride.findById(ride._id).populate('passengerId', 'name phone');
        io.to('available-drivers').emit('new-ride-request', { ride: populatedRide || ride });
        console.log(`📢 Emitted new-ride-request to available-drivers room for ride ${ride._id}`);
      }

      res.status(201).json({ message: 'Ride requested! Finding drivers...', ride });
    } catch (err) {
      console.error('Create ride error:', err.message, err.stack);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  });

  // DRIVER ACCEPTS RIDE
  router.patch('/:rideId/accept', authMiddleware, async (req, res) => {
    try {
      const ride = await Ride.findById(req.params.rideId);
      if (!ride) return res.status(404).json({ message: 'Ride not found' });
      if (ride.status !== 'requested') return res.status(400).json({ message: 'Ride no longer available' });

      // Atomically claim the ride to prevent race conditions (two drivers accepting same ride)
      const claimedRide = await Ride.findOneAndUpdate(
        { _id: req.params.rideId, status: 'requested' },
        { driverId: req.user.id, status: 'accepted' },
        { new: true }
      );
      if (!claimedRide) return res.status(400).json({ message: 'Ride already taken by another driver' });

      const populatedRide = await Ride.findById(claimedRide._id)
        .populate('passengerId', 'name phone')
        .populate('driverId', 'name phone vehicleType vehicleNumber averageRating');

      if (io) {
        const passengerId = claimedRide.passengerId?.toString();
        const rideId = claimedRide._id.toString();

        // Emit to ride room (user joined via join-ride)
        io.to(rideId).emit('rideAccepted', { ride: populatedRide });

        // Also emit directly to passenger's personal room (guaranteed delivery)
        if (passengerId) {
          io.to(passengerId).emit('rideAccepted', { ride: populatedRide });
          console.log(`✅ Emitted rideAccepted to passenger ${passengerId} and ride room ${rideId}`);
        }

        // Tell all available drivers this ride is taken
        io.to('available-drivers').emit('ride-taken', { rideId });
      }

      res.json({ message: 'Ride accepted!', ride: populatedRide });
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  });

  // START RIDE (with OTP)
  router.patch('/:rideId/start', authMiddleware, async (req, res) => {
    try {
      const { otp } = req.body;
      const ride = await Ride.findById(req.params.rideId);
      if (!ride) return res.status(404).json({ message: 'Ride not found' });
      if (ride.status !== 'accepted') return res.status(400).json({ message: 'Ride must be accepted first' });
      if (ride.otp !== otp) return res.status(400).json({ message: 'Invalid OTP', success: false });

      ride.status = 'started';
      ride.startedAt = new Date();
      await ride.save();

      if (io) io.to(ride._id.toString()).emit('rideStarted', { ride });

      res.json({ message: 'Ride started!', success: true, ride });
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  });

  // COMPLETE RIDE
  router.patch('/:rideId/complete', authMiddleware, async (req, res) => {
    try {
      const ride = await Ride.findById(req.params.rideId);
      if (!ride) return res.status(404).json({ message: 'Ride not found' });
      if (!['accepted', 'started'].includes(ride.status))
        return res.status(400).json({ message: 'Cannot complete this ride' });

      ride.status = 'completed';
      ride.completedAt = new Date();
      ride.paymentStatus = 'paid';
      await ride.save();

      // Create payment record
      await Payment.create({
        rideId: ride._id,
        passengerId: ride.passengerId,
        driverId: ride.driverId,
        amount: ride.fare,
        method: ride.paymentMethod || 'cash',
        status: 'completed',
      });

      // Wallet Payout / Commission logic
      if (ride.driverId) {
        const settings = await getSettings();
        const commission = ride.fare * (settings.adminCommissionPercent / 100);
        const driverCut = ride.fare - commission;
        
        // Find driver's User record to update walletBalance
        const driverUser = await User.findById(ride.driverId);
        if (driverUser) {
          if (ride.paymentMethod === 'cash') {
            // Driver got full cash, owes platform the commission
            driverUser.walletBalance = (driverUser.walletBalance || 0) - commission;
          } else {
            // Platform got online payment, owes driver their cut
            driverUser.walletBalance = (driverUser.walletBalance || 0) + driverCut;
          }
          await driverUser.save();
        }
      }

      if (io) io.to(ride._id.toString()).emit('rideCompleted', { ride });

      res.json({ message: 'Ride completed!', ride });
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  });

  // CANCEL RIDE
  router.patch('/:rideId/cancel', authMiddleware, async (req, res) => {
    try {
      const ride = await Ride.findById(req.params.rideId);
      if (!ride) return res.status(404).json({ message: 'Ride not found' });
      if (['completed', 'cancelled'].includes(ride.status))
        return res.status(400).json({ message: 'Cannot cancel this ride' });

      ride.status = 'cancelled';
      await ride.save();

      if (io) {
        io.to(ride._id.toString()).emit('rideCancelled', { ride });
      }

      res.json({ message: 'Ride cancelled', ride });
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  });

  // RATE DRIVER
  router.patch('/:rideId/rate', authMiddleware, async (req, res) => {
    try {
      const { rating, comment } = req.body;
      const ride = await Ride.findById(req.params.rideId);
      if (!ride || ride.status !== 'completed')
        return res.status(400).json({ message: 'Can only rate completed rides' });

      ride.driverRating = rating;
      ride.driverRatingComment = comment || '';
      await ride.save();

      // Update driver's average rating
      if (ride.driverId) {
        const allRatings = await Ride.find({
          driverId: ride.driverId,
          driverRating: { $ne: null }
        });
        const avg = allRatings.reduce((s, r) => s + r.driverRating, 0) / allRatings.length;
        await User.findByIdAndUpdate(ride.driverId, {
          averageRating: Math.round(avg * 10) / 10,
          totalRatings: allRatings.length
        });
      }

      res.json({ message: 'Rating submitted!', ride });
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  });

  // UPDATE DRIVER LOCATION
  router.patch('/:rideId/location', authMiddleware, async (req, res) => {
    try {
      const { location } = req.body;
      const ride = await Ride.findByIdAndUpdate(
        req.params.rideId,
        { driverLocation: location },
        { new: true }
      );
      if (!ride) return res.status(404).json({ message: 'Ride not found' });

      if (io) io.to(req.params.rideId).emit('ride-location-update', { location });

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  });

  // GET RIDE DETAILS
  router.get('/:rideId', authMiddleware, async (req, res) => {
    try {
      const ride = await Ride.findById(req.params.rideId)
        .populate('passengerId', 'name phone averageRating')
        .populate('driverId', 'name phone vehicleType vehicleNumber averageRating');
      if (!ride) return res.status(404).json({ message: 'Ride not found' });
      res.json({ ride });
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  });

  // GET PUBLIC RIDE DETAILS (for live tracking sharing)
  router.get('/public/:rideId', async (req, res) => {
    try {
      const ride = await Ride.findById(req.params.rideId)
        .select('pickupLocation dropoffLocation status driverId')
        .populate('driverId', 'name vehicleType vehicleNumber averageRating');
      
      if (!ride) return res.status(404).json({ message: 'Ride not found' });
      res.json({ ride });
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  });

  return router;
};
