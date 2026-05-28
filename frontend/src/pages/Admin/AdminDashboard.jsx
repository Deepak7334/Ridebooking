import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Car, Activity, LogOut, Menu, X, Map, Wallet, Tag, Settings, PhoneCall } from 'lucide-react';
import axiosInstance from '../../api/axios';

import AdminOverview from './AdminOverview';
import AdminRides from './AdminRides';
import AdminDrivers from './AdminDrivers';
import AdminUsers from './AdminUsers';
import AdminSettings from './AdminSettings';
import AdminPromos from './AdminPromos';
import AdminPayouts from './AdminPayouts';
import AdminDispatch from './AdminDispatch';
import AdminLiveMap from './AdminLiveMap';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async (hideLoading = false) => {
    if (!hideLoading) setLoading(true);
    try {
      const { data } = await axiosInstance.get('/admin/stats');
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch admin stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Auto-refresh stats every 10 seconds for real-time dashboard feel
    const interval = setInterval(() => {
      fetchStats(true);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'map', label: 'Gods Eye Map', icon: Map },
    { id: 'rides', label: 'Rides', icon: Activity },
    { id: 'drivers', label: 'Drivers', icon: Car },
    { id: 'users', label: 'Customers', icon: Users },
    { id: 'dispatch', label: 'Dispatch', icon: PhoneCall },
    { id: 'payouts', label: 'Payouts', icon: Wallet },
    { id: 'promos', label: 'Promo Codes', icon: Tag },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <AdminOverview stats={stats} statsLoading={loading} onNavigate={setActiveTab} onRefresh={fetchStats} />;
      case 'map': return <AdminLiveMap />;
      case 'rides': return <AdminRides />;
      case 'drivers': return <AdminDrivers onRefreshStats={fetchStats} />;
      case 'users': return <AdminUsers />;
      case 'dispatch': return <AdminDispatch />;
      case 'payouts': return <AdminPayouts />;
      case 'promos': return <AdminPromos />;
      case 'settings': return <AdminSettings />;
      default: return <AdminOverview />;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100dvh', background: '#070b14', color: '#fff', fontFamily: "'Plus Jakarta Sans', sans-serif", overflow: 'hidden' }}>
      <style>{`
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
      `}</style>
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 shrink-0" style={{ background: 'rgba(255,255,255,.02)', borderRight: '1px solid rgba(255,255,255,.06)', zIndex: 50 }}>
        <div className="p-6 pb-2">
          <div className="flex items-center gap-3 mb-8">
            <div style={{ background: 'linear-gradient(135deg,#F5A623,#FF6B35)' }} className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow-lg">🛡️</div>
            <div>
              <p className="font-extrabold text-lg leading-tight tracking-tight">RAPIDO</p>
              <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Admin Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                style={{
                  background: active ? 'rgba(255,255,255,.08)' : 'transparent',
                  color: active ? '#fff' : 'rgba(255,255,255,.5)',
                  fontWeight: active ? '600' : '500'
                }}
              >
                <Icon size={18} style={{ color: active ? '#F5A623' : 'currentColor' }} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all font-medium">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Mobile Nav */}
      <div className="md:hidden fixed top-0 inset-x-0 h-16 flex items-center justify-between px-4 z-50" style={{ background: 'rgba(7,11,20,.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
        <div className="flex items-center gap-2">
          <div style={{ background: 'linear-gradient(135deg,#F5A623,#FF6B35)' }} className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shadow-lg">🛡️</div>
          <p className="font-extrabold text-base leading-tight tracking-tight">RAPIDO</p>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 bg-white/5 rounded-lg border border-white/10 text-white/70">
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-[#070b14] pt-20 px-4 flex flex-col">
          <nav className="flex-1 space-y-2">
            {navItems.map(item => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-4 rounded-xl transition-all"
                  style={{ background: active ? 'rgba(255,255,255,.08)' : 'rgba(255,255,255,.02)', color: active ? '#fff' : 'rgba(255,255,255,.6)' }}
                >
                  <Icon size={20} style={{ color: active ? '#F5A623' : 'currentColor' }} />
                  {item.label}
                </button>
              );
            })}
          </nav>
          <div className="pb-8 pt-4">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-4 rounded-xl bg-red-500/10 text-red-400 font-bold border border-red-500/20">
              <LogOut size={20} /> Logout
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pt-16 md:pt-0">
        <div className="max-w-6xl mx-auto p-3 sm:p-4 md:p-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white mb-4 md:mb-6 capitalize">{activeTab.replace(/-/g,' ')}</h1>
          <div className="admin-table-wrap">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}
