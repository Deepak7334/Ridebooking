import Ride from '../models/Ride.js';
import User from '../models/User.js';

/**
 * Handle SOS emergency alert
 */
export const sendSOSAlert = async (req, res) => {
  try {
    const { rideId, location } = req.body;
    const userId = req.user.id;

    // Find the ride
    const ride = await Ride.findById(rideId).populate('driverId');
    
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    // Verify user is part of this ride
    const isPassenger = ride.passengerId.toString() === userId;
    const isDriver = ride.driverId && ride.driverId.toString() === userId;

    if (!isPassenger && !isDriver) {
      return res.status(403).json({ message: 'Not authorized for this ride' });
    }

    // In production, this would:
    // 1. Send SMS/Call to emergency contacts
    // 2. Notify local authorities
    // 3. Send alert to company safety team
    // 4. Store emergency event in database

    const sosEvent = {
      rideId,
      userId,
      location,
      timestamp: new Date(),
      status: 'triggered',
      rideDetails: {
        pickup: ride.pickupLocation,
        dropoff: ride.dropoffLocation,
        driverName: ride.driverId?.name,
        driverPhone: ride.driverId?.phone,
        vehicleNumber: ride.driverId?.vehicleNumber
      }
    };

    // Log the SOS event (in production, store in database)
    console.log('🚨 SOS ALERT TRIGGERED:', sosEvent);

    res.status(200).json({
      message: 'Emergency alert sent successfully',
      sosEventId: Date.now(), // In production, this would be a proper ID
      timestamp: sosEvent.timestamp
    });
  } catch (error) {
    res.status(500).json({ message: 'Error sending SOS alert', error: error.message });
  }
};

/**
 * Get emergency contacts for a user
 */
export const getEmergencyContacts = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select('emergencyContacts');
    
    res.status(200).json({
      emergencyContacts: user?.emergencyContacts || []
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching contacts', error: error.message });
  }
};

/**
 * Add emergency contact
 */
export const addEmergencyContact = async (req, res) => {
  try {
    const { name, phone, relationship } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    
    if (!user.emergencyContacts) {
      user.emergencyContacts = [];
    }

    user.emergencyContacts.push({
      name,
      phone,
      relationship,
      createdAt: new Date()
    });

    await user.save();

    res.status(201).json({
      message: 'Emergency contact added successfully',
      emergencyContacts: user.emergencyContacts
    });
  } catch (error) {
    res.status(500).json({ message: 'Error adding contact', error: error.message });
  }
};

export default {
  sendSOSAlert,
  getEmergencyContacts,
  addEmergencyContact
};
