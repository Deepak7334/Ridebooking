import React from 'react';
import { Outlet } from 'react-router-dom';

const MobileLayout = ({ children, bottomNav }) => {
  return (
    <div className="mobile-layout">
      <main className="mobile-content">
        <Outlet />
        {children}
      </main>
      <nav className="bottom-navigation">
        {bottomNav || (
          <ul>
            <li><a href="/home">Home</a></li>
            <li><a href="/ride-history">History</a></li>
            <li><a href="/profile">Profile</a></li>
          </ul>
        )}
      </nav>
    </div>
  );
};

export default MobileLayout;
