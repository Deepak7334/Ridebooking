import express from 'express';
import { auth } from '../middleware/auth.js';
import emergencyController from '../controllers/emergencyController.js';

const router = express.Router();

// Send SOS alert
router.post('/sos', auth, emergencyController.sendSOSAlert);

// Get emergency contacts
router.get('/contacts', auth, emergencyController.getEmergencyContacts);

// Add emergency contact
router.post('/contacts', auth, emergencyController.addEmergencyContact);

export default router;
