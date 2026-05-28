import React from "react";

export default function RideCard({ ride }) {
  return (
    <div
      style={{
        background: "#fff",
        padding: "20px",
        borderRadius: "12px",
        marginBottom: "15px",
      }}
    >
      <h3>{ride.user}</h3>

      <p>Pickup: {ride.pickup}</p>

      <p>Drop: {ride.drop}</p>

      <p>Fare: ₹{ride.fare}</p>

      <p>Status: {ride.status}</p>
    </div>
  );
}