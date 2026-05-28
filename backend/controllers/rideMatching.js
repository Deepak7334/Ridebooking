// Auto ride matching system
import Ride from '../models/Ride.js';
import Driver from '../models/Driver.js';
import User from '../models/User.js';


export const autoMatchRide = async (rideId, io) => {
  try {
    const ride = await Ride.findById(rideId).populate('passengerId', 'phone');
    if (!ride || ride.status !== 'pending') {
      return;
    }

    const lng = ride.pickupLocation.coordinates[0];
    const lat = ride.pickupLocation.coordinates[1];

// Find nearby verified available drivers (10km radius)
    const drivers = await User.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [lng, lat]
          },
          distanceField: "distance",
          maxDistance: 10000, // 10km
          spherical: true,
          query: {
            docsVerified: true,
            isOnline: true
          }
        }
      },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          name: '$user.name',
          phone: '$user.phone',
          vehicleType: 1,
          vehicleNumber: 1,
          averageRating: '$user.averageRating',
          distance: 1
        }
      }
    ]);


    if (drivers.length === 0) {
      io.to(ride.passengerId._id.toString()).emit('no-drivers-found', { rideId });
      return;
    }

    // Emit ride request to top 3 drivers (available-drivers room or individual)
    const rideRequestData = {
      rideId: ride._id,
      passengerPhone: ride.passengerId.phone,
      pickup: ride.pickupLocation.address,
      dropoff: ride.dropoffLocation.address,
      fare: ride.fare,
      vehicleType: ride.vehicleType,
      etaSeconds: Math.round(drivers[0].distance / 70) // avg speed 70km/h
    };

    io.to('available-drivers').emit('ride-request', rideRequestData);

    // 30s timeout - check if still pending
    setTimeout(async () => {
      const updatedRide = await Ride.findById(rideId);
      if (updatedRide.status === 'pending') {
        io.to(updatedRide.passengerId).emit('driver-search-timeout', { rideId });
        // Could cancel ride or expand radius
      }
    }, 30000);

  } catch (error) {
    console.error('Auto matching error:', error);
  }
};

// Driver responds to ride request
export const handleRideRequestResponse = async (rideId, driverId, response) => { // accept/reject
  const ride = await Ride.findById(rideId);
  if (!ride || ride.status !== 'pending') return;

  if (response === 'accept') {
    ride.driverId = driverId;
    ride.status = 'accepted';
    await ride.save();

    // Notify passenger and driver
    io.to(ride.passengerId).emit('driver-assigned', ride);
    io.to(driverId).emit('ride-accepted', ride);

    // Notify other drivers they lost
    io.to('available-drivers').emit('ride-request-cancelled', { rideId });
  } else {
    // Reject - continue searching (handled by timeout)
  }
};

export default {
  autoMatchRide,
  handleRideRequestResponse
};

