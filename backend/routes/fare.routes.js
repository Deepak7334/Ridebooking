import express from 'express';
import fareController from '../controllers/fareController.js';

const router = express.Router();

// Calculate fare estimate
router.post('/calculate', fareController.calculateFare);

// Get fare estimates for all vehicle types
router.get('/estimates', fareController.getAllFareEstimates);

export default router;
