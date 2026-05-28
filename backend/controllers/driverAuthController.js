// Separate controller for driver-specific auth/register (non-auth)

import User from '../models/User.js';

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';



export const registerDriver = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }

      const { phone, password, name, vehicleType, vehicleNumber } = req.body;



      // Check if phone already registered
      let user = await User.findOne({ phone });

      // If phone exists and is not a driver, block registration
      if (user && user.role !== 'driver') {
        return res.status(400).json({ message: 'Phone already registered as passenger. Use different number for driver.' });
      }

      // Create/Update User (auth + role)
      if (user) {
        if (user.docsVerified) {
          return res.status(400).json({ message: 'Driver already verified. Login instead.' });
        }

        user.name = name;
        user.vehicleType = vehicleType;
        user.vehicleNumber = vehicleNumber;
        user.documents = [];


      } else {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({
          phone,
          name,
          password: hashedPassword,
          role: 'driver',
          // driver profile data lives in Driver collection
        });

      }

      // Build documents payload from uploaded files
      const driverDocs = [];
      if (req.files) {

        const files = req.files;
        ['license', 'rc', 'insurance', 'profilePhoto'].forEach(field => {
          if (files[field]) {
            const file = files[field][0];
            driverDocs.push({
              name: file.filename,
              url: `/uploads/drivers/${phone}/${file.filename}`,
              docType:
                field === 'profilePhoto' ? 'profile'
                : field === 'license' ? 'license'
                : field === 'rc' ? 'rc'
                : 'insurance',
              uploadedAt: new Date(),
            });

            // Driver documents are stored only in Driver collection (not in User)
          }
        });
      }

      await user.save();

      // Write to Driver collection (migration option A: only new registrations create Driver docs)
      // Even if User existed, we create Driver doc if missing.
      let driver = await Driver.findOne({ userId: user._id });
      if (!driver) {
        driver = new Driver({ userId: user._id });
      }

      driver.vehicleType = vehicleType;
      driver.vehicleNumber = vehicleNumber;
      driver.documents = driverDocs;
      driver.docsVerified = false;


      await driver.save();

      const token = user.generateToken();

      res.status(201).json({
        message: 'Driver registered successfully. Awaiting admin verification.',
        token,
        user: user.toJSON(),
        status: driver.docsVerified ? 'verified' : 'pending',
      });
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export default {
  registerDriver
};

