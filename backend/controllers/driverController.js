import Ride from '../models/Ride.js';
import User from '../models/User.js';

// Driver controller functions
// These handle driver-specific ride logic

export const getAvailableRides = async (req, res) => {
  try {
    // Rides are created with status 'requested' — show only those
    const rides = await Ride.find({ status: 'requested', driverId: null })
      .populate('passengerId', 'name phone')
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({ rides });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching available rides', error: error.message });
  }
};

export const acceptRide = async (req, res) => {
  try {
    const { id } = req.params;
    const driverId = req.user.id;

    const ride = await Ride.findById(id);

    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    if (ride.status !== 'pending') {
      return res.status(400).json({ message: 'Ride is no longer available' });
    }

    ride.driver = driverId;
    ride.status = 'accepted';
    await ride.save();

    res.status(200).json({ message: 'Ride accepted successfully', ride });
  } catch (error) {
    res.status(500).json({ message: 'Error accepting ride', error: error.message });
  }
};

export const startRide = async (req, res) => {
  try {
    const { id } = req.params;
    const ride = await Ride.findById(id);

    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    if (ride.status !== 'accepted') {
      return res.status(400).json({ message: 'Cannot start this ride' });
    }

    ride.status = 'in-progress';
    ride.startTime = new Date();
    await ride.save();

    res.status(200).json({ message: 'Ride started successfully', ride });
  } catch (error) {
    res.status(500).json({ message: 'Error starting ride', error: error.message });
  }
};

export const completeRide = async (req, res) => {
  try {
    const { id } = req.params;
    const { otp } = req.body;
    const ride = await Ride.findById(id);

    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    if (ride.status !== 'in-progress') {
      return res.status(400).json({ message: 'Cannot complete this ride' });
    }

    // Verify OTP
    if (ride.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    ride.status = 'completed';
    ride.endTime = new Date();
    await ride.save();

    res.status(200).json({ message: 'Ride completed successfully', ride });
  } catch (error) {
    res.status(500).json({ message: 'Error completing ride', error: error.message });
  }
};

export const updateLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const driverId = req.user.id;

    // Update driver's current location
    const driver = await User.findByIdAndUpdate(
      driverId,
      { 
        'location.coordinates': [longitude, latitude],
        'location.lastUpdated': new Date()
      },
      { new: true }
    );

    res.status(200).json({ 
      message: 'Location updated successfully', 
      location: driver.location 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating location', error: error.message });
  }
};

export const getEarnings = async (req, res) => {
  try {
    const driverId = req.user.id || req.user._id;
    const { startDate, endDate } = req.query;

    const query = {
      driverId: driverId,
      status: 'completed'
    };

    // Default: today's earnings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else {
      query.createdAt = { $gte: today, $lt: tomorrow };
    }

    const rides = await Ride.find(query);

    const totalEarnings = rides.reduce((sum, ride) => sum + (ride.fare || 0), 0);
    const totalRides = rides.length;

    res.status(200).json({
      totalEarnings,
      totalRides,
      rides
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching earnings', error: error.message });
  }
};

export const updateAvailability = async (req, res) => {
  try {
    const { isOnline } = req.body;
    const driverId = req.user.id || req.user._id;

    const driver = await User.findByIdAndUpdate(
      driverId,
      { isOnline: !!isOnline },
      { new: true }
    );

    res.status(200).json({
      message: 'Availability updated successfully',
      isOnline: driver?.isOnline,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating availability', error: error.message });
  }
};

export const getAvailability = async (req, res) => {
  try {
    const driverId = req.user.id || req.user._id;
    const driver = await User.findById(driverId).select('isOnline');
    res.status(200).json({ isOnline: !!driver?.isOnline });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching availability', error: error.message });
  }
};

export const getDriverProfile = async (req, res) => {
  try {
    const driverId = req.user.id;
    
    const driver = await User.findById(driverId)
      .select('-password')
      .populate('vehicle');

    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    res.status(200).json({ driver });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching driver profile', error: error.message });
  }
};

export default {
  getAvailableRides,
  acceptRide,
  startRide,
  completeRide,
  updateLocation,
  getEarnings,
  updateAvailability,
  getAvailability,
  getDriverProfile
};
