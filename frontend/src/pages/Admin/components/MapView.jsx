import React from "react";

export default function MapView() {
  return (
    <div
      style={{
        background: "#fff",
        padding: "20px",
        borderRadius: "12px",
        height: "400px",
      }}
    >
      <h2>Live Driver Map</h2>

      <div
        style={{
          marginTop: "20px",
          height: "300px",
          background: "#e5e7eb",
          borderRadius: "10px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        Google Map Here
      </div>
    </div>
  );
}