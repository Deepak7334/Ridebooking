import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Zap, Wallet, DollarSign } from 'lucide-react';
import axiosInstance from '../../api/axios';

const VEHICLE_META = {
  bike: { label: 'Rapido Bike', icon: '🏍️', desc: '1 seat · Fastest & Cheapest', eta: '2 min', badge: 'POPULAR' },
  auto: { label: 'Auto',        icon: '🛺', desc: '3 seats · Affordable',        eta: '4 min', badge: '' },
  car:  { label: 'Cab',         icon: '🚗', desc: '4 seats · Comfortable',       eta: '6 min', badge: '' },
};

const ConfirmRide = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const rideData = location.state || {};

  const [selected, setSelected] = useState('bike');
  const [fares, setFares] = useState({ auto: 80, car: 150, bike: 50 });
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(false);
  const [estimating, setEstimating] = useState(true);

  useEffect(() => {
    const fetchFare = async () => {
      setEstimating(true);
      try {
        const res = await axiosInstance.post('/rides/estimate-fare', {
          pickupLocation: rideData.pickupLocation,
          dropoffLocation: rideData.dropoffLocation,
        });
        setFares(res.data.fares);
        setDistance(res.data.distance);
        setDuration(res.data.duration);
      } catch {}
      finally { setEstimating(false); }
    };
    if (rideData.pickupLocation && rideData.dropoffLocation) fetchFare();
    else setEstimating(false);
  }, [rideData]);

  const handleBook = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.post('/rides/create', {
        pickupLocation: rideData.pickupLocation, dropoffLocation: rideData.dropoffLocation,
        vehicleType: selected, fare: fares[selected], paymentMethod,
      });
      navigate('/ride/searching', {
        state: {
          ...rideData, vehicle: selected, fare: fares[selected],
          rideId: res.data.ride._id, otp: res.data.ride.otp,
        }
      });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to book ride');
    } finally { setLoading(false); }
  };

  const meta = VEHICLE_META[selected] || VEHICLE_META.bike;

  return (
    <div className="flex flex-col h-full bg-[#0a0c10] overflow-hidden w-full md:max-w-md mx-auto md:border-x border-white/5 md:shadow-2xl relative">
      {/* Header */}
      <header className="flex items-center gap-3 p-4 bg-[#11141c] border-b border-white/5 sticky top-0 z-50">
        <button onClick={() => navigate('/home')} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 transition flex items-center justify-center text-white shrink-0">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-white font-bold text-lg leading-tight">Choose a Ride</h1>
          <p className="text-white/40 text-xs font-medium">Pick your vehicle type</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 pb-28 no-scrollbar">
        {/* Route Card */}
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 mb-5 shadow-sm">
          <div className="flex gap-3 items-stretch">
            <div className="flex flex-col items-center pt-1 shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-green-400 border-[2px] border-[#16a34a]" />
              <div className="w-[1.5px] bg-white/10 my-1.5 min-h-[1.5rem] flex-1" />
              <div className="w-2.5 h-2.5 bg-red-400 border-[2px] border-[#dc2626]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/30 text-[10px] font-bold uppercase tracking-wider mb-1">Pickup</p>
              <p className="text-white text-[13px] font-medium truncate mb-3">{rideData.pickupAddress || 'Your location'}</p>
              <p className="text-white/30 text-[10px] font-bold uppercase tracking-wider mb-1">Drop</p>
              <p className="text-white text-[13px] font-medium truncate">{rideData.dropoffAddress || 'Destination'}</p>
            </div>
          </div>
          {distance && (
            <div className="flex gap-3 mt-4 pt-4 border-t border-white/5">
              <div className="flex-1 text-center bg-white/5 py-2 px-3 rounded-xl border border-white/5">
                <p className="text-yellow-400 font-bold mb-0.5">{distance} km</p>
                <p className="text-white/40 text-[10px] font-medium uppercase tracking-wider">Distance</p>
              </div>
              <div className="flex-1 text-center bg-white/5 py-2 px-3 rounded-xl border border-white/5">
                <p className="text-yellow-400 font-bold mb-0.5">{duration} min</p>
                <p className="text-white/40 text-[10px] font-medium uppercase tracking-wider">Est. Time</p>
              </div>
            </div>
          )}
        </div>

        {/* Vehicles */}
        <div className="mb-5">
          <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-3 px-1">Select Vehicle</p>
          <div className="space-y-3">
            {Object.entries(VEHICLE_META).map(([id, v]) => (
              <button key={id} onClick={() => setSelected(id)} 
                className={`w-full flex items-center gap-3.5 p-3.5 rounded-2xl border-2 transition-colors text-left
                  ${selected === id ? 'bg-yellow-400/10 border-yellow-400' : 'bg-white/[0.02] border-transparent hover:bg-white/5'}
                `}>
                <div className={`w-14 h-14 rounded-[14px] flex items-center justify-center text-3xl shrink-0 ${selected === id ? 'bg-yellow-400/20' : 'bg-white/5'}`}>
                  {v.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-bold text-sm tracking-wide">{v.label}</span>
                    {v.badge && <span className="text-[9px] bg-yellow-400/20 text-yellow-400 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">{v.badge}</span>}
                    <span className="bg-green-500/15 text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">{v.eta}</span>
                  </div>
                  <p className="text-white/40 text-xs truncate">{v.desc}</p>
                </div>
                <div className="text-right shrink-0 ml-2">
                  {estimating ? <div className="w-10 h-5 bg-white/10 rounded animate-pulse" /> : <span className="text-yellow-400 font-black text-lg">₹{fares[id]}</span>}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Payment */}
        <div>
          <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-3 px-1">Payment Method</p>
          <div className="grid grid-cols-3 gap-2">
            {[{ id: 'cash', label: 'Cash', icon: DollarSign }, { id: 'upi', label: 'UPI', icon: Zap }, { id: 'wallet', label: 'Wallet', icon: Wallet }].map(m => (
              <button key={m.id} onClick={() => setPaymentMethod(m.id)}
                className={`flex items-center justify-center gap-1.5 py-3 rounded-xl border text-[13px] font-semibold transition-all
                  ${paymentMethod === m.id ? 'bg-yellow-400/10 border-yellow-400 text-yellow-400' : 'bg-white/[0.02] border-white/5 text-white/50 hover:bg-white/5'}
                `}>
                <m.icon size={15} /> {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky Book Button relative to app container */}
      <div className="absolute bottom-0 w-full p-4 bg-[#0a0c10]/95 backdrop-blur-md border-t border-white/5">
        <button disabled={loading || estimating} onClick={handleBook}
          className={`w-full py-4 rounded-xl font-extrabold text-[15px] transition-all flex justify-center items-center gap-2
            ${loading || estimating ? 'bg-white/5 text-white/30 cursor-not-allowed' : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 shadow-[0_8px_30px_rgba(255,140,0,0.3)] hover:-translate-y-0.5'}
          `}>
          {loading ? 'Booking...' : estimating ? 'Calculating fare...' : `Book ${meta.label} • ₹${fares[selected]}`}
        </button>
      </div>
    </div>
  );
};
export default ConfirmRide;
