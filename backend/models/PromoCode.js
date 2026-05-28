import mongoose from 'mongoose';

const promoSchema = new mongoose.Schema({
  code: { type: String, unique: true, required: true, uppercase: true, trim: true },
  discountPercent: { type: Number, required: true, min: 1, max: 100 },
  maxDiscountAmount: { type: Number, required: true },
  minRideAmount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  expiresAt: { type: Date }
}, { timestamps: true });

export default mongoose.model('PromoCode', promoSchema);
