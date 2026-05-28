import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

export const authDriver = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.user.role !== 'driver') {
        return res.status(403).json({ message: 'Access denied. Drivers only.' });
      }
      next();
    });
  } catch (error) {
    res.status(401).json({ message: 'Authorization denied' });
  }
};

export const authPassenger = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.user.role !== 'passenger') {
        return res.status(403).json({ message: 'Access denied. Passengers only.' });
      }
      next();
    });
  } catch (error) {
    res.status(401).json({ message: 'Authorization denied' });
  }
};
