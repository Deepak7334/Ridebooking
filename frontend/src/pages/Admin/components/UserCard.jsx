import React from "react";

export default function UserCard({ user }) {
  return (
    <div
      style={{
        background: "#fff",
        padding: "20px",
        borderRadius: "12px",
        marginBottom: "15px",
      }}
    >
      <h3>{user.name}</h3>

      <p>Email: {user.email}</p>

      <p>Phone: {user.phone}</p>
    </div>
  );
}