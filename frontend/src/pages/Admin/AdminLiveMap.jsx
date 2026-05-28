import React, { useEffect, useState } from 'react';
import axiosInstance from '../../api/axios';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, Navigation, Car, Users } from 'lucide-react';

// Custom Icons
const driverIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const ridePickupIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const rideDropoffIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function AdminLiveMap() {
  const [drivers, setDrivers] = useState([]);
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMapData = async () => {
    try {
      const { data } = await axiosInstance.get('/admin/live-map-data');
      setDrivers(data.drivers || []);
      setRides(data.rides || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchMapData();
    // Poll every 5 seconds for live movement
    const interval = setInterval(() => { fetchMapData(); }, 5000);
    return () => clearInterval(interval);
  }, []);

  const center = [12.9716, 77.5946]; // Default to Bangalore (or wherever)

  return (
    <div className="flex flex-col gap-6 h-[80vh]">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <h2 className="text-xl font-bold text-white">God's Eye - Live Map</h2>
        <div className="flex gap-4 bg-white/5 border border-white/10 p-2 rounded-xl">
          <div className="flex items-center gap-2 text-sm text-white/70 px-2">
            <div className="w-3 h-3 rounded-full bg-amber-400"></div>
            Online Drivers ({drivers.length})
          </div>
          <div className="flex items-center gap-2 text-sm text-white/70 px-2 border-l border-white/10">
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
            <div className="w-3 h-3 rounded-full bg-red-400 -ml-3 border border-black"></div>
            Active Rides ({rides.length})
          </div>
        </div>
      </div>

      <div className="flex-1 rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative">
        {loading && <div className="absolute inset-0 bg-black/50 z-[400] flex items-center justify-center text-white/50">Loading Map Data...</div>}
        <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%', background: '#0a0c14' }}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          
          {/* Plot Online Drivers */}
          {drivers.map(d => {
            const [lng, lat] = d.location?.coordinates || [0, 0];
            if (lat === 0 && lng === 0) return null;
            return (
              <Marker key={`driver-${d._id}`} position={[lat, lng]} icon={driverIcon}>
                <Popup>
                  <div className="text-black p-1">
                    <p className="font-bold text-sm border-b pb-1 mb-1">{d.userId?.name || 'Driver'}</p>
                    <p className="text-xs">Phone: {d.userId?.phone}</p>
                    <p className="text-xs">Vehicle: {d.vehicleNumber} ({d.vehicleType})</p>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Plot Active Rides */}
          {rides.map(r => {
            const [pickLng, pickLat] = r.pickupLocation?.coordinates || [0, 0];
            const [dropLng, dropLat] = r.dropoffLocation?.coordinates || [0, 0];
            
            if (pickLat === 0 && pickLng === 0) return null;
            
            return (
              <React.Fragment key={`ride-${r._id}`}>
                <Marker position={[pickLat, pickLng]} icon={ridePickupIcon}>
                  <Popup>
                    <div className="text-black p-1">
                      <p className="font-bold text-sm text-green-600">Pickup</p>
                      <p className="text-xs">Passenger: {r.passengerId?.name}</p>
                      <p className="text-[10px] text-gray-500 line-clamp-2">{r.pickupLocation?.address}</p>
                    </div>
                  </Popup>
                </Marker>
                
                {dropLat !== 0 && (
                  <>
                    <Marker position={[dropLat, dropLng]} icon={rideDropoffIcon}>
                      <Popup>
                        <div className="text-black p-1">
                          <p className="font-bold text-sm text-red-600">Dropoff</p>
                          <p className="text-xs">Passenger: {r.passengerId?.name}</p>
                          <p className="text-[10px] text-gray-500 line-clamp-2">{r.dropoffLocation?.address}</p>
                        </div>
                      </Popup>
                    </Marker>
                    <Polyline positions={[[pickLat, pickLng], [dropLat, dropLng]]} pathOptions={{ color: '#6366f1', weight: 3, dashArray: '5, 10' }} />
                  </>
                )}
              </React.Fragment>
            );
          })}

        </MapContainer>
      </div>
    </div>
  );
}
