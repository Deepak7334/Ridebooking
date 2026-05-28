import React from 'react';
import { Home, Wallet, Bell, User, History } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const tabs = [
  { icon: Home, label: 'Dashboard', path: '/driver' },
  { icon: History, label: 'History', path: '/driver/history' },
  { icon: Wallet, label: 'Wallet', path: '/driver/earnings' },
  { icon: User, label: 'Profile', path: '/driver/profile' },
];

const DriverBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 60,
      display: 'flex', alignItems: 'stretch', height: '64px',
      background: 'rgba(7,11,20,.96)',
      backdropFilter: 'blur(28px) saturate(1.5)',
      WebkitBackdropFilter: 'blur(28px) saturate(1.5)',
      borderTop: '1px solid rgba(255,255,255,.07)',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = location.pathname === tab.path || location.pathname.startsWith(tab.path + '/');
        
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: '4px', background: 'none', border: 'none', cursor: 'pointer',
              color: active ? '#F5A623' : 'rgba(255,255,255,.28)', 
              fontSize: '10px', fontWeight: 600, fontFamily: 'inherit', letterSpacing: '.04em',
              transition: 'color .18s ease', minHeight: '44px', WebkitTapHighlightColor: 'transparent'
            }}
          >
            <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
            <span>{tab.label}</span>
            <div style={{
              width: '4px', height: '4px', borderRadius: '50%', background: '#F5A623',
              marginTop: '1px', opacity: active ? 1 : 0, transition: 'opacity .18s'
            }} />
          </button>
        );
      })}
    </nav>
  );
};

export default DriverBottomNav;