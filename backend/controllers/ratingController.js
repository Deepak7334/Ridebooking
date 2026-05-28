import Ride from '../models/Ride.js';
import User from '../models/User.js';

/**
 * Submit rating for a completed ride
 */
export const submitRating = async (req, res) => {
  try {
    const { rideId } = req.params;
    const { rating, comment, type } = req.body; // type: 'driver' or 'passenger'
    const userId = req.user.id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    if (ride.status !== 'completed') {
      return res.status(400).json({ message: 'Can only rate completed rides' });
    }

    // Verify the user is part of this ride
    const isPassenger = ride.passengerId.toString() === userId;
    const isDriver = ride.driverId && ride.driverId.toString() === userId;

    if (!isPassenger && !isDriver) {
      return res.status(403).json({ message: 'You are not authorized to rate this ride' });
    }

    // Update rating based on type
    if (type === 'driver') {
      if (!isPassenger) {
        return res.status(403).json({ message: 'Only passengers can rate drivers' });
      }
      ride.driverRating = rating;
      ride.driverRatingComment = comment || null;
    } else if (type === 'passenger') {
      if (!isDriver) {
        return res.status(403).json({ message: 'Only drivers can rate passengers' });
      }
      ride.passengerRating = rating;
      ride.passengerRatingComment = comment || null;
    }

    await ride.save();

    // Update driver's average rating
    if (type === 'driver' && ride.driverId) {
      const allRatings = await Ride.find({ 
        driverId: ride.driverId, 
        driverRating: { $exists: true, $ne: null } 
      });
      
      const totalRating = allRatings.reduce((sum, r) => sum + r.driverRating, 0);
      const avgRating = totalRating / allRatings.length;

      await User.findByIdAndUpdate(ride.driverId, { 
        averageRating: Math.round(avgRating * 10) / 10 
      });
    }

    res.status(200).json({
      message: 'Rating submitted successfully',
      rating: type === 'driver' ? ride.driverRating : ride.passengerRating
    });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting rating', error: error.message });
  }
};

/**
 * Get driver rating
 */
export const getDriverRating = async (req, res) => {
  try {
    const { driverId } = req.params;

    const rides = await Ride.find({ 
      driverId, 
      driverRating: { $exists: true, $ne: null } 
    });

    if (rides.length === 0) {
      return res.status(200).json({ 
        driverId, 
        averageRating: 0, 
        totalRatings: 0 
      });
    }

    const totalRating = rides.reduce((sum, r) => sum + r.driverRating, 0);
    const averageRating = totalRating / rides.length;

    res.status(200).json({
      driverId,
      averageRating: Math.round(averageRating * 10) / 10,
      totalRatings: rides.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Error getting rating', error: error.message });
  }
};

export default {
  submitRating,
  getDriverRating
};
