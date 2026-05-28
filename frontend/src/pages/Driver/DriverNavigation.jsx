import React from 'react';
import {
  Home,
  Wallet,
  Bell,
  User,
  History,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const tabs = [
  {
    icon: Home,
    path: '/driver',
  },
  {
    icon: Wallet,
    path: '/driver/wallet',
  },
  {
    icon: History,
    path: '/driver/history',
  },
  {
    icon: Bell,
    path: '/driver/notifications',
  },
  {
    icon: User,
    path: '/driver/profile',
  },
];

const DriverBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white/10 border border-white/10 backdrop-blur-xl rounded-3xl px-6 py-4 flex items-center gap-6 z-50">
      {tabs.map((tab, index) => {
        const Icon = tab.icon;
        const active = location.pathname === tab.path;

        return (
          <button
            key={index}
            onClick={() => navigate(tab.path)}
            className={`transition ${
              active
                ? 'text-yellow-400 scale-125'
                : 'text-white/50'
            }`}
          >
            <Icon size={24} />
          </button>
        );
      })}
    </div>
  );
};

export default DriverBottomNav;