import Ride from '../models/Ride.js';

// Fare rates per km for different vehicle types
const FARE_RATES = {
  bike: {
    baseFare: 20,
    perKm: 8,
    perMin: 1
  },
  auto: {
    baseFare: 30,
    perKm: 12,
    perMin: 2
  },
  car: {
    baseFare: 50,
    perKm: 18,
    perMin: 3
  }
};

/**
 * Calculate fare estimate based on distance and vehicle type
 */
export const calculateFare = async (req, res) => {
  try {
    const { pickup, dropoff, vehicleType, distance, duration } = req.body;

    if (!pickup || !dropoff || !vehicleType) {
      return res.status(400).json({ message: 'Pickup, dropoff and vehicle type are required' });
    }

    // Use provided distance or estimate (in km)
    const distanceKm = distance || 5;
    const durationMin = duration || 15;

    // Get fare rates for the vehicle type
    const rates = FARE_RATES[vehicleType] || FARE_RATES.auto;

    // Calculate fare
    const distanceFare = distanceKm * rates.perKm;
    const timeFare = durationMin * rates.perMin;
    const totalFare = rates.baseFare + distanceFare + timeFare;

    // Round to nearest integer
    const estimatedFare = Math.round(totalFare);

    res.status(200).json({
      fare: estimatedFare,
      breakdown: {
        baseFare: rates.baseFare,
        distanceFare: Math.round(distanceFare),
        timeFare: Math.round(timeFare),
        distance: distanceKm,
        duration: durationMin
      },
      vehicleType
    });
  } catch (error) {
    res.status(500).json({ message: 'Error calculating fare', error: error.message });
  }
};

/**
 * Get fare estimates for all vehicle types
 */
export const getAllFareEstimates = async (req, res) => {
  try {
    const { pickup, dropoff, distance, duration } = req.query;

    const distanceKm = distance || 5;
    const durationMin = duration || 15;

    const estimates = {};

    for (const [type, rates] of Object.entries(FARE_RATES)) {
      const distanceFare = distanceKm * rates.perKm;
      const timeFare = durationMin * rates.perMin;
      const totalFare = rates.baseFare + distanceFare + timeFare;

      estimates[type] = {
        fare: Math.round(totalFare),
        breakdown: {
          baseFare: rates.baseFare,
          distanceFare: Math.round(distanceFare),
          timeFare: Math.round(timeFare),
          distance: distanceKm,
          duration: durationMin
        }
      };
    }

    res.status(200).json({
      estimates,
      pickup,
      dropoff
    });
  } catch (error) {
    res.status(500).json({ message: 'Error calculating fares', error: error.message });
  }
};

export default {
  calculateFare,
  getAllFareEstimates
};
