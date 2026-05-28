import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    email: { type: String, lowercase: true, unique: true, sparse: true },
    phone: { type: String, required: true, unique: true },
    alternatePhone: { type: String, trim: true },
    password: { type: String, minlength: 6 },
    role: {
      type: String,
      enum: ['customer', 'driver', 'admin', 'passenger'],
      default: 'customer'
    },
    createdBy: { type: String, enum: ['self', 'admin'], default: 'self' },
    profilePic: { type: String, default: null },
    // Driver-specific profile fields
    aadharNumber: { type: String, trim: true },
    panCard: { type: String, trim: true },
    address: { type: String, trim: true },
    // Driver-specific fields
    vehicleType: { type: String, enum: ['auto', 'car', 'bike', null], default: null },
    vehicleNumber: { type: String, default: null },
    documents: [{
      name: String,
      url: String,
      docType: { type: String, enum: ['license', 'rc', 'insurance', 'profile'] },
      uploadedAt: { type: Date, default: Date.now }
    }],
    docsVerified: { type: Boolean, default: false },
    isOnline: { type: Boolean, default: false },  // Driver online/offline
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }
    },
    // Customer-specific fields
    walletBalance: { type: Number, default: 0 },
    // Common
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalRatings: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateToken = function () {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET || 'rapido-secret-2024',
    { expiresIn: '30d' }
  );
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

userSchema.index({ location: '2dsphere' });

export default mongoose.model('User', userSchema);
