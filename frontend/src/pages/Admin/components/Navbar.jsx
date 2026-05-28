import React from "react";
import { Search, Bell } from "lucide-react";

export default function Navbar() {
  return (
    <div
      style={{
        background: "#fff",
        padding: "15px 25px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid #ddd",
      }}
    >
      <h2>Admin Panel</h2>

      <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
        <Search />
        <Bell />
        <img
          src="https://i.pravatar.cc/40"
          alt=""
          style={{ borderRadius: "50%" }}
        />
      </div>
    </div>
  );
}