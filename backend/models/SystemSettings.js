import mongoose from 'mongoose';

const systemSettingsSchema = new mongoose.Schema({
  baseFareBike: { type: Number, default: 20 },
  perKmBike: { type: Number, default: 8 },
  
  baseFareAuto: { type: Number, default: 30 },
  perKmAuto: { type: Number, default: 12 },
  
  baseFareCar: { type: Number, default: 50 },
  perKmCar: { type: Number, default: 18 },
  
  surgeMultiplier: { type: Number, default: 1.0 },
  adminCommissionPercent: { type: Number, default: 20 }
}, { timestamps: true });

export default mongoose.model('SystemSettings', systemSettingsSchema);
