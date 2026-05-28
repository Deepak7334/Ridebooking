import User from '../models/User.js';

// Add payment method to user
export const addPaymentMethod = async (req, res) => {
  try {
    const { type, cardNumberLast4, expiryMonth, expiryYear, provider } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const paymentMethod = {
      type,
      cardNumberLast4,
      expiryMonth,
      expiryYear,
      provider
    };

    user.paymentMethods.push(paymentMethod);
    await user.save();

    res.status(201).json({ 
      message: 'Payment method added successfully',
      paymentMethod 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user payment methods
export const getPaymentMethods = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('paymentMethods');

    res.status(200).json({ 
      paymentMethods: user.paymentMethods 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete payment method
export const deletePaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.paymentMethods = user.paymentMethods.filter(pm => pm._id.toString() !== id);
    await user.save();

    res.status(200).json({ message: 'Payment method deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get wallet balance
export const getWalletBalance = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('walletBalance');

    res.status(200).json({ 
      walletBalance: user.walletBalance || 0 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add money to wallet
export const addWalletMoney = async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.walletBalance += amount;
    user.walletTransactions.push({
      amount,
      type: 'add',
      description: `Added ₹${amount} to wallet`
    });

    await user.save();

    res.status(200).json({ 
      message: 'Wallet topped up successfully',
      newBalance: user.walletBalance,
      transaction: user.walletTransactions[user.walletTransactions.length - 1]
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get wallet transaction history
export const getWalletHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('walletTransactions');

    res.status(200).json({ 
      transactions: user.walletTransactions 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Process ride payment (called on ride complete)
export const processRidePayment = async (req, res) => {
  try {
    const { rideId, paymentMethod } = req.body;
    const userId = req.user.id;

    const ride = await Ride.findById(rideId).populate('passengerId');
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    if (ride.passengerId._id.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (ride.status !== 'completed') {
      return res.status(400).json({ message: 'Ride not completed yet' });
    }

    if (ride.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Already paid' });
    }

    const fare = ride.fare;

    let success = false;
    let transaction;

    if (paymentMethod === 'cash') {
      // Cash - no processing needed, mark as paid
      success = true;
    } else if (paymentMethod === 'wallet') {
      // Wallet payment
      const user = await User.findById(userId);
      if (user.walletBalance < fare) {
        return res.status(400).json({ message: 'Insufficient wallet balance' });
      }
      user.walletBalance -= fare;
      user.walletTransactions.push({
        amount: -fare,
        type: 'ride_payment',
        description: `Ride payment #${ride._id}`
      });
      await user.save();
      success = true;
    } else {
      // Card/UPI - Stub success (integrate Stripe/Razorpay in production)
      success = true; // Assume success
    }

    if (success) {
      ride.paymentMethod = paymentMethod;
      ride.paymentStatus = 'paid';
      await ride.save();

      transaction = {
        amount: fare,
        method: paymentMethod,
        status: 'success',
        rideId: ride._id
      };
    }

    res.status(200).json({ 
      success,
      transaction,
      message: success ? 'Payment successful' : 'Payment failed'
    });
  } catch (error) {
    res.status(500).json({ message: 'Payment processing error', error: error.message });
  }
};

export default {
  addPaymentMethod,
  getPaymentMethods,
  deletePaymentMethod,
  getWalletBalance,
  addWalletMoney,
  getWalletHistory,
  processRidePayment
};

