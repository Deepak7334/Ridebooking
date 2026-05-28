import React from 'react';

// Central export/entry for admin area routing.
// Currently maps to the existing AdminDashboard component.
import AdminDashboard from './AdminDashboard';

export { AdminDashboard };

export default function AdminRoutes() {
  return <AdminDashboard />;
}


