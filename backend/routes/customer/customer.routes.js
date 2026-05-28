import express from 'express';
import { auth } from '../../middleware/auth.js';
import customerController from '../../controllers/customerController.js';

const router = express.Router();

// Customer ride routes
// These routes handle customer-specific ride functionality

// Get ride history
router.get('/ride-history', auth, customerController.getRideHistory);

// Create new ride request
router.post('/create-ride', auth, customerController.createRide);

// Get ride details
router.get('/ride/:id', auth, customerController.getRideDetails);

// Cancel ride
router.post('/ride/:id/cancel', auth, customerController.cancelRide);

// Get fare estimate
router.get('/fare-estimate', auth, customerController.getFareEstimate);

export default router;
