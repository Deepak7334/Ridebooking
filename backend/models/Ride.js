import mongoose from 'mongoose';

const rideSchema = new mongoose.Schema(
  {
    passengerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    pickupLocation: {
      address: { type: String, default: '' },
      coordinates: { type: [Number], required: true } // [lng, lat]
    },
    dropoffLocation: {
      address: { type: String, default: '' },
      coordinates: { type: [Number], required: true } // [lng, lat]
    },
    status: {
      type: String,
      enum: ['requested', 'accepted', 'started', 'completed', 'cancelled'],
      default: 'requested'
    },
    vehicleType: {
      type: String,
      enum: ['auto', 'car', 'bike'],
      default: 'auto'
    },
    fare: { type: Number, default: 0 },
    distance: { type: Number, default: null },
    duration: { type: Number, default: null },
    otp: { type: String, default: null },
    paymentMethod: {
      type: String,
      enum: ['cash', 'upi', 'wallet'],
      default: 'cash'
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid'],
      default: 'pending'
    },
    driverRating: { type: Number, min: 1, max: 5, default: null },
    driverRatingComment: { type: String, default: null },
    passengerRating: { type: Number, min: 1, max: 5, default: null },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    driverLocation: {
      lat: Number,
      lng: Number
    }
  },
  { timestamps: true }
);

// NOTE: No 2dsphere index on ride locations — they are stored as plain [lng, lat] arrays
// The 2dsphere index is on User.location for finding nearby drivers

export default mongoose.model('Ride', rideSchema);
