import express from 'express';

import * as driverController from '../../controllers/driverController.js';
import { auth } from '../../middleware/auth.js';


const router = express.Router();

// Online/offline + profile/ride APIs for driver UI
router.get('/health', (req, res) => {
  res.json({ status: 'driver routes ok' });
});

// Driver API (authenticated)
router.get('/earnings', auth, driverController.getEarnings);
router.get('/available-rides', auth, driverController.getAvailableRides);

router.get('/availability', auth, driverController.getAvailability);
router.put('/availability', auth, driverController.updateAvailability);

router.get('/profile', auth, driverController.getDriverProfile);

router.patch('/location', auth, driverController.updateLocation);

// Keep ride handlers under /rides for compatibility with frontend endpoints
// (Frontend uses /rides/:rideId/...)

export default router;


