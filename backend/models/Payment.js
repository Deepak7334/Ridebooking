import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    rideId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride', required: true },
    passengerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amount: { type: Number, required: true },
    method: { type: String, enum: ['cash', 'upi', 'wallet'], default: 'cash' },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    transactionId: { type: String, default: null }
  },
  { timestamps: true }
);

export default mongoose.model('Payment', paymentSchema);
