import React from 'react';
import { Outlet } from 'react-router-dom';

const MainLayout = ({ children, sidebar }) => {
  return (
    <div className="main-layout">
      <aside className="sidebar">
        {sidebar || (
          <nav>
            <ul>
              <li><a href="/home">Home</a></li>
              <li><a href="/ride-history">Ride History</a></li>
              <li><a href="/profile">Profile</a></li>
              <li><a href="/wallet">Wallet</a></li>
            </ul>
          </nav>
        )}
      </aside>
      <main className="content">
        <Outlet />
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
