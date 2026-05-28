import React, { useEffect, useState } from 'react';
import axiosInstance from '../../api/axios';
import { User, Phone, Mail, Car, ShieldCheck, LogOut } from 'lucide-react';
import DriverBottomNav from './DriverBottomNav';
import { useNavigate } from 'react-router-dom';

export default function DriverProfile() {
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axiosInstance.get('/driver/profile');
        setDriver(data.driver);
      } catch (err) {
        console.error('Error fetching driver profile', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-[#070b14] flex justify-center py-20 text-white/50">
        Loading profile...
        <DriverBottomNav />
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="min-h-[100dvh] bg-[#070b14] flex justify-center py-20 text-white/50">
        Profile not found
        <DriverBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#070b14] text-white pb-24 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="max-w-3xl mx-auto p-4 md:p-8">
        
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
            <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-[#F5A623] to-[#FF6B35] flex items-center justify-center text-4xl shadow-xl shadow-orange-500/20 flex-shrink-0">
              🧑🏽‍✈️
            </div>
            
            <div className="flex-1 mt-2 md:mt-0">
              <h1 className="text-3xl font-extrabold">{driver.name}</h1>
              <p className="text-[#F5A623] font-bold text-sm tracking-widest uppercase mt-1">Rapido Captain</p>
              
              <div className="flex items-center justify-center md:justify-start gap-4 mt-4">
                <div className="px-3 py-1.5 bg-white/5 rounded-lg border border-white/10 flex items-center gap-2 text-sm font-bold">
                  ⭐ {driver.averageRating || '4.9'}
                </div>
                <div className="px-3 py-1.5 bg-green-500/10 text-green-400 rounded-lg border border-green-500/20 flex items-center gap-2 text-sm font-bold">
                  <ShieldCheck size={16} /> Verified
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-5 mt-10">
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Full Name</label>
              <div className="bg-black/30 border border-white/10 rounded-2xl p-4 flex items-center gap-3 text-white/90">
                <User size={18} className="text-white/40" />
                <span className="font-semibold">{driver.name}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Phone</label>
              <div className="bg-black/30 border border-white/10 rounded-2xl p-4 flex items-center gap-3 text-white/90">
                <Phone size={18} className="text-white/40" />
                <span className="font-semibold">{driver.phone}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Vehicle Type</label>
              <div className="bg-black/30 border border-white/10 rounded-2xl p-4 flex items-center gap-3 text-white/90">
                <Car size={18} className="text-white/40" />
                <span className="font-semibold capitalize">{driver.vehicleType || 'Auto'}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Vehicle Number</label>
              <div className="bg-black/30 border border-white/10 rounded-2xl p-4 flex items-center gap-3 text-white/90">
                <Car size={18} className="text-white/40" />
                <span className="font-semibold uppercase">{driver.vehicleNumber || 'Unregistered'}</span>
              </div>
            </div>
          </div>

          <button onClick={handleLogout} className="mt-8 w-full bg-red-500/10 border border-red-500/20 text-red-400 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-500/20 transition-colors">
            <LogOut size={18} /> Sign Out
          </button>
        </div>

      </div>
      <DriverBottomNav />
    </div>
  );
}