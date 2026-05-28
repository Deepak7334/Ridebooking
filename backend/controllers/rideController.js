// rideController.js
import Ride from "../models/Ride.js";

/**
 * Get the active ride assigned to a passenger
 */
export const getAssignedRide = async (req, res) => {
  const { passengerId } = req.params;

  try {
    const ride = await Ride.findOne({ passengerId, status: { $in: ["accepted", "en route"] } });
    if (!ride) {
      return res.status(404).json({ message: "No active ride found. Maybe your driver ghosted you." });
    }

    res.status(200).json({
      message: "Active ride fetched successfully",
      ride
    });
  } catch (err) {
    console.error("Oops, something broke:", err.message);
    res.status(500).json({ message: "Server error. Blame the developer, not the database." });
  }
};

/**
 * Accept a ride (driver claims a pending ride)
 * io: Socket.io instance passed from route
 */
export const acceptRide = async (req, res, io) => {
  const { rideId, driverId } = req.body;

  try {
    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found" });

    if (ride.status !== "pending") {
      return res.status(400).json({ message: "Ride already accepted or completed" });
    }

    ride.driverId = driverId;
    ride.status = "accepted";
    await ride.save();

    // Emit real-time update to passengers with ride info
    io.to(rideId).emit("rideAccepted", { 
      ride,
      message: "Driver found! Your ride has been confirmed."
    });

    res.status(200).json({
      message: "Ride accepted successfully",
      ride
    });
  } catch (err) {
    console.error("Error accepting ride:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Verify OTP and start the ride
 * io: Socket.io instance passed from route
 */
export const verifyOTPAndStartRide = async (req, res, io) => {
  const { rideId, otp } = req.body;

  try {
    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found" });

    if (ride.status !== "accepted") {
      return res.status(400).json({ message: "Ride is not accepted yet" });
    }

    // Verify OTP
    if (ride.otp !== otp) {
      return res.status(400).json({ 
        message: "Invalid OTP. Please check and try again.",
        success: false 
      });
    }

    // Start the ride
    ride.status = "en route";
    ride.startedAt = new Date();
    await ride.save();

    // Emit ride started event
    io.to(rideId.toString()).emit("rideStarted", { 
      ride,
      message: "Your ride has started! Have a safe journey."
    });

    res.status(200).json({
      message: "Ride started successfully",
      success: true,
      ride
    });
  } catch (err) {
    console.error("Error starting ride:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Update ride with driver location
 * io: Socket.io instance passed from route
 */
export const updateDriverLocation = async (req, res, io) => {
  const { rideId, location } = req.body;

  try {
    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found" });

    // Save current driver location in DB
    ride.currentLocation = location;
    await ride.save();

    // Emit location to all passengers in the ride
    io.to(rideId.toString()).emit("ride-location-update", {
      location,
      timestamp: new Date()
    });

    res.status(200).json({
      message: "Driver location updated successfully",
      ride
    });
  } catch (err) {
    console.error("Error updating driver location:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Complete a ride
 * io: Socket.io instance passed from route
 */
export const completeRide = async (req, res, io) => {
  const { rideId } = req.params;

  try {
    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found. Did you imagine it?" });

    if (ride.status !== "accepted" && ride.status !== "en route") {
      return res.status(400).json({ message: "You can't complete a ride that isn't accepted. Nice try." });
    }

    ride.status = "completed";
    ride.completedAt = new Date();
    await ride.save();

    // Emit real-time update to passengers
    io.to(rideId.toString()).emit("rideCompleted", { 
      ride,
      message: "Your ride has been completed!"
    });

    res.status(200).json({
      message: "Ride completed successfully. Go get coffee, driver.",
      ride
    });
  } catch (err) {
    console.error("Dev made a mess again:", err.message);
    res.status(500).json({ message: "Server error. Maybe try turning it off and on again?" });
  }
};

/**
 * Get ride OTP for driver
 */
export const getRideOTP = async (req, res) => {
  const { rideId } = req.params;

  try {
    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found" });

    res.status(200).json({
      otp: ride.otp,
      rideId: ride._id
    });
  } catch (err) {
    console.error("Error getting OTP:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};
