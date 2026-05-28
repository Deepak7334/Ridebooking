import React, { useEffect, useState } from 'react';
import axiosInstance from '../../api/axios';
import { Wallet, TrendingUp, Car } from 'lucide-react';
import DriverBottomNav from './DriverBottomNav';

export default function DriverEarnings() {
  const [earnings, setEarnings] = useState({ totalEarnings: 0, totalRides: 0, rides: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const { data } = await axiosInstance.get('/driver/earnings');
        setEarnings({
          totalEarnings: data.totalEarnings || 0,
          totalRides: data.totalRides || 0,
          rides: data.rides || []
        });
      } catch (err) {
        console.error('Error fetching earnings', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEarnings();
  }, []);

  const today = new Date().setHours(0, 0, 0, 0);
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const todaysEarnings = earnings.rides
    .filter(r => new Date(r.createdAt).setHours(0, 0, 0, 0) === today)
    .reduce((sum, r) => sum + (r.fare || 0), 0);

  const weeklyEarnings = earnings.rides
    .filter(r => new Date(r.createdAt) >= oneWeekAgo)
    .reduce((sum, r) => sum + (r.fare || 0), 0);

  return (
    <div className="min-h-[100dvh] bg-[#070b14] text-white pb-24 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <h1 className="text-2xl md:text-3xl font-extrabold mb-8">Earnings Dashboard</h1>

        {loading ? (
          <div className="flex justify-center py-20 text-white/50">Loading earnings data...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-green-500/10 border border-green-500/20 rounded-3xl p-6 hover:bg-green-500/20 transition-colors">
                <Wallet className="text-green-400" size={28} />
                <h2 className="text-3xl font-extrabold mt-4 text-green-400">₹{todaysEarnings}</h2>
                <p className="text-white/50 mt-1 font-semibold text-xs uppercase tracking-widest">Today's Earnings</p>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-3xl p-6 hover:bg-blue-500/20 transition-colors">
                <TrendingUp className="text-blue-400" size={28} />
                <h2 className="text-3xl font-extrabold mt-4 text-blue-400">₹{weeklyEarnings}</h2>
                <p className="text-white/50 mt-1 font-semibold text-xs uppercase tracking-widest">Weekly Earnings</p>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-3xl p-6 hover:bg-yellow-500/20 transition-colors">
                <Car className="text-yellow-400" size={28} />
                <h2 className="text-3xl font-extrabold mt-4 text-yellow-400">{earnings.totalRides}</h2>
                <p className="text-white/50 mt-1 font-semibold text-xs uppercase tracking-widest">Lifetime Rides</p>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-white/10 bg-white/5">
                <h3 className="font-bold text-lg">Recent Payouts</h3>
              </div>
              <div className="p-4">
                {earnings.rides.length === 0 ? (
                  <p className="text-white/40 text-center py-6">No completed rides yet.</p>
                ) : (
                  <div className="space-y-4">
                    {earnings.rides.slice(0, 10).map((ride, idx) => (
                      <div key={ride._id || idx} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition">
                        <div>
                          <p className="font-bold text-sm">Ride #{ride._id?.slice(-6) || 'Unknown'}</p>
                          <p className="text-xs text-white/50 mt-1">{new Date(ride.createdAt).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-400 text-lg">₹{ride.fare}</p>
                          <p className="text-xs text-white/50 capitalize">{ride.paymentMethod || 'cash'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <DriverBottomNav />
    </div>
  );
}