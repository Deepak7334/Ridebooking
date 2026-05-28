import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Car,
  Map,
  IndianRupee,
  AlertTriangle,
  BarChart3,
  Ticket,
  Bell,
  Settings,
} from "lucide-react";

export default function Sidebar() {
  const location = useLocation();

  const menus = [
    { name: "Dashboard", path: "/admin/dashboard", icon: <LayoutDashboard size={18} /> },
    { name: "Users", path: "/admin/users", icon: <Users size={18} /> },
    { name: "Drivers", path: "/admin/drivers", icon: <Car size={18} /> },
    { name: "Rides", path: "/admin/rides", icon: <Map size={18} /> },
    { name: "Earnings", path: "/admin/earnings", icon: <IndianRupee size={18} /> },
    { name: "Complaints", path: "/admin/complaints", icon: <AlertTriangle size={18} /> },
    { name: "Analytics", path: "/admin/analytics", icon: <BarChart3 size={18} /> },
    { name: "Coupons", path: "/admin/coupons", icon: <Ticket size={18} /> },
    { name: "Notifications", path: "/admin/notifications", icon: <Bell size={18} /> },
    { name: "Settings", path: "/admin/settings", icon: <Settings size={18} /> },
  ];

  return (
    <div
      style={{
        width: "260px",
        background: "#111827",
        color: "white",
        height: "100vh",
        padding: "20px",
        position: "fixed",
      }}
    >
      <h2 style={{ marginBottom: "30px", color: "#facc15" }}>
        RAPIDO ADMIN
      </h2>

      {menus.map((menu) => (
        <Link
          key={menu.name}
          to={menu.path}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px",
            marginBottom: "10px",
            borderRadius: "10px",
            textDecoration: "none",
            background:
              location.pathname === menu.path ? "#facc15" : "transparent",
            color:
              location.pathname === menu.path ? "#000" : "#fff",
          }}
        >
          {menu.icon}
          {menu.name}
        </Link>
      ))}
    </div>
  );
}