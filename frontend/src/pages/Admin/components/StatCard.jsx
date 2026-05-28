import React from "react";

export default function StatCard({ title, value, color }) {
  return (
    <div
      style={{
        background: "#fff",
        padding: "20px",
        borderRadius: "12px",
        width: "220px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
      }}
    >
      <h4 style={{ color: "#666" }}>{title}</h4>

      <h1 style={{ color: color || "#111", marginTop: "10px" }}>
        {value}
      </h1>
    </div>
  );
}