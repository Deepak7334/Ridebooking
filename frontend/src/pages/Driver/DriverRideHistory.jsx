import React, { useEffect, useState } from 'react';
import axiosInstance from '../../api/axios';
import { History, MapPin, Navigation } from 'lucide-react';
import DriverBottomNav from './DriverBottomNav';

export default function DriverRideHistory() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await axiosInstance.get('/rides/user/history');
        setRides(data.rides || []);
      } catch (err) {
        console.error('Error fetching ride history', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="min-h-[100dvh] bg-[#070b14] text-white pb-24 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <h1 className="text-2xl md:text-3xl font-extrabold mb-8 flex items-center gap-3">
          <History className="text-[#F5A623]" size={32} />
          Ride History
        </h1>

        {loading ? (
          <div className="flex justify-center py-20 text-white/50">Loading your past rides...</div>
        ) : rides.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <History size={40} className="text-white/20" />
            </div>
            <p className="text-white/50 font-medium">No rides found in your history yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rides.map(ride => (
              <div key={ride._id} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
                  <div>
                    <p className="font-bold text-lg">₹{ride.fare}</p>
                    <p className="text-xs text-white/50">{new Date(ride.createdAt).toLocaleString()}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                    ride.status === 'completed' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                    ride.status === 'cancelled' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                    'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                  }`}>
                    {ride.status}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin size={18} className="text-green-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-white/40 uppercase tracking-widest font-bold mb-1">Pickup</p>
                      <p className="text-sm text-white/90">{ride.pickupLocation?.address || 'Unknown Location'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Navigation size={18} className="text-red-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-white/40 uppercase tracking-widest font-bold mb-1">Dropoff</p>
                      <p className="text-sm text-white/90">{ride.dropoffLocation?.address || 'Unknown Location'}</p>
                    </div>
                  </div>
                </div>

                {ride.passengerId && (
                  <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm">👤</div>
                    <div>
                      <p className="text-sm font-semibold">{ride.passengerId.name}</p>
                      <p className="text-xs text-white/50">Passenger</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <DriverBottomNav />
    </div>
  );
}