import express from 'express';
import { auth } from '../middleware/auth.js';
import paymentController from '../controllers/paymentController.js';

const router = express.Router();

// Payment methods
router.post('/payment-methods', auth, paymentController.addPaymentMethod);
router.get('/payment-methods', auth, paymentController.getPaymentMethods);
router.delete('/payment-methods/:id', auth, paymentController.deletePaymentMethod);

// Wallet
router.get('/wallet/balance', auth, paymentController.getWalletBalance);
router.post('/wallet/add', auth, paymentController.addWalletMoney);
router.get('/wallet/history', auth, paymentController.getWalletHistory);

// Ride payment processing
router.post('/rides/:rideId/pay', auth, paymentController.processRidePayment);

export default router;

