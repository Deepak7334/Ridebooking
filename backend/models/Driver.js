import mongoose from 'mongoose';

const driverSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true },

    // Driver-specific fields (moved out from User)
    vehicleType: { type: String, enum: ['auto', 'car', 'bike', null], default: null },
    vehicleNumber: { type: String, default: null },

    documents: [
      {
        name: String,
        url: String,
        docType: { type: String, enum: ['license', 'rc', 'insurance', 'profile'] },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    docsVerified: { type: Boolean, default: false },
    isOnline: { type: Boolean, default: false },

    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },
  },
  { timestamps: true }
);

// Geospatial index for nearby drivers
// Assumes coordinates are [lng, lat]
driverSchema.index({ location: '2dsphere' });

export default mongoose.model('Driver', driverSchema);

