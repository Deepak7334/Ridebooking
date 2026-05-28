import React, { useEffect, useState } from 'react';
import axiosInstance from '../../api/axios';
import { PhoneCall, Navigation, MapPin } from 'lucide-react';

export default function AdminDispatch() {
  const [drivers, setDrivers] = useState([]);
  const [formData, setFormData] = useState({
    passengerName: '',
    passengerPhone: '',
    pickupAddress: '',
    dropoffAddress: '',
    vehicleType: 'auto',
    driverId: '', // optional
    fare: '' // optional override
  });
  const [loading, setLoading] = useState(false);

  // Fetch online drivers to assign
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const { data } = await axiosInstance.get('/admin/live-map-data');
        setDrivers(data.drivers || []);
      } catch (err) { console.error(err); }
    };
    fetchDrivers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        passengerName: formData.passengerName,
        passengerPhone: formData.passengerPhone,
        pickupLocation: { address: formData.pickupAddress, lat: 0, lng: 0 },
        dropoffLocation: { address: formData.dropoffAddress, lat: 0.1, lng: 0.1 },
        vehicleType: formData.vehicleType,
        driverId: formData.driverId || null,
        fare: formData.fare ? parseInt(formData.fare) : null
      };

      await axiosInstance.post('/admin/dispatch', payload);
      alert('Ride dispatched successfully!');
      setFormData({ passengerName: '', passengerPhone: '', pickupAddress: '', dropoffAddress: '', vehicleType: 'auto', driverId: '', fare: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to dispatch ride');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl flex gap-6 flex-col lg:flex-row">
      <div className="flex-1 bg-white/5 border border-white/10 rounded-3xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
            <PhoneCall size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Manual Dispatch</h2>
            <p className="text-xs text-white/50">Tele-booking portal to create rides on behalf of a caller.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Passenger Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-white/50 uppercase">Caller Name</label>
              <input required value={formData.passengerName} onChange={e => setFormData({...formData, passengerName: e.target.value})} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-400" placeholder="John Doe" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-white/50 uppercase">Phone Number</label>
              <input required value={formData.passengerPhone} onChange={e => setFormData({...formData, passengerPhone: e.target.value})} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-400" placeholder="+91 9876543210" />
            </div>
          </div>

          {/* Locations */}
          <div className="flex flex-col gap-3 relative">
            <div className="absolute left-[19px] top-10 bottom-10 w-0.5 bg-white/10"></div>
            <div className="flex gap-3 items-center">
              <MapPin size={20} className="text-green-400 shrink-0 z-10 bg-[#0a0c14]" />
              <input required value={formData.pickupAddress} onChange={e => setFormData({...formData, pickupAddress: e.target.value})} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-green-400" placeholder="Exact Pickup Address" />
            </div>
            <div className="flex gap-3 items-center">
              <Navigation size={20} className="text-red-400 shrink-0 z-10 bg-[#0a0c14]" />
              <input required value={formData.dropoffAddress} onChange={e => setFormData({...formData, dropoffAddress: e.target.value})} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-red-400" placeholder="Exact Dropoff Address" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-white/50 uppercase">Vehicle Type</label>
              <select value={formData.vehicleType} onChange={e => setFormData({...formData, vehicleType: e.target.value})} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-400">
                <option value="bike" className="bg-[#0a0c14]">Bike</option>
                <option value="auto" className="bg-[#0a0c14]">Auto</option>
                <option value="car" className="bg-[#0a0c14]">Car</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-white/50 uppercase">Fare Override (₹)</label>
              <input type="number" value={formData.fare} onChange={e => setFormData({...formData, fare: e.target.value})} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-400" placeholder="Leave empty for auto-calc" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 pt-2">
            <label className="text-xs font-bold text-white/50 uppercase">Assign Driver (Optional)</label>
            <select value={formData.driverId} onChange={e => setFormData({...formData, driverId: e.target.value})} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-400">
              <option value="" className="bg-[#0a0c14]">-- Broadcast to all nearby drivers --</option>
              {drivers.filter(d => d.vehicleType === formData.vehicleType).map(d => (
                <option key={d.userId?._id} value={d.userId?._id} className="bg-[#0a0c14]">
                  {d.userId?.name} ({d.userId?.phone}) - {d.vehicleNumber}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4 border-t border-white/10 mt-2">
            <button type="submit" disabled={loading} className="w-full py-4 bg-blue-500 hover:bg-blue-400 rounded-xl text-white font-bold text-lg transition disabled:opacity-50">
              {loading ? 'Dispatching...' : 'Dispatch Ride'}
            </button>
          </div>
        </form>
      </div>
      
      {/* Sidebar tips */}
      <div className="w-full lg:w-72 flex flex-col gap-4">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5">
          <h3 className="font-bold text-blue-400 mb-2">How it works</h3>
          <p className="text-sm text-blue-400/70 mb-3">If you assign a specific driver, the ride is automatically "Accepted" by them.</p>
          <p className="text-sm text-blue-400/70">If you leave it on Broadcast, it sends a ping to all online drivers like a normal user booking.</p>
        </div>
      </div>
    </div>
  );
}
