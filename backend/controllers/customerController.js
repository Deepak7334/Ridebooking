import Ride from '../models/Ride.js';
import User from '../models/User.js';

// Customer controller functions
// These handle customer-specific ride logic

export const getRideHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const rides = await Ride.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate('driver', 'name phone vehicle');
    
    res.status(200).json({ rides });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching ride history', error: error.message });
  }
};

export const createRide = async (req, res) => {
  try {
    const { pickupLocation, dropoffLocation, vehicleType } = req.body;
    const userId = req.user.id;

    const ride = new Ride({
      user: userId,
      pickup: pickupLocation,
      dropoff: dropoffLocation,
      vehicleType,
      status: 'pending'
    });

    await ride.save();
    
    res.status(201).json({ message: 'Ride created successfully', ride });
  } catch (error) {
    res.status(500).json({ message: 'Error creating ride', error: error.message });
  }
};

export const getRideDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const ride = await Ride.findById(id)
      .populate('driver', 'name phone vehicle rating')
      .populate('user', 'name phone');

    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    res.status(200).json({ ride });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching ride details', error: error.message });
  }
};

export const cancelRide = async (req, res) => {
  try {
    const { id } = req.params;
    const ride = await Ride.findById(id);

    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    if (ride.status === 'completed' || ride.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot cancel this ride' });
    }

    ride.status = 'cancelled';
    await ride.save();

    res.status(200).json({ message: 'Ride cancelled successfully', ride });
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling ride', error: error.message });
  }
};

export const getFareEstimate = async (req, res) => {
  try {
    const { pickup, dropoff } = req.query;
    
    // TODO: Implement actual fare calculation logic
    const baseFare = 25;
    const perKmRate = 10;
    const estimatedDistance = 5; // This should be calculated from actual distance
    
    const estimate = {
      baseFare,
      perKmRate,
      estimatedDistance,
      estimatedFare: baseFare + (perKmRate * estimatedDistance)
    };

    res.status(200).json({ estimate });
  } catch (error) {
    res.status(500).json({ message: 'Error calculating fare', error: error.message });
  }
};

export default {
  getRideHistory,
  createRide,
  getRideDetails,
  cancelRide,
  getFareEstimate
};
