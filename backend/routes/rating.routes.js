import express from 'express';
import { auth } from '../middleware/auth.js';
import ratingController from '../controllers/ratingController.js';

const router = express.Router();

// Submit rating for a ride
router.post('/ride/:rideId/rate', auth, ratingController.submitRating);

// Get driver rating
router.get('/driver/:driverId/rating', ratingController.getDriverRating);

export default router;
