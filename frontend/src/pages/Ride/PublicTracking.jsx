import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { io } from 'socket.io-client';
import axiosInstance from '../../api/axios';
import { Shield, Navigation } from 'lucide-react';

/* ─── Fix Leaflet default marker icons broken by webpack ─── */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl:       require('leaflet/dist/images/marker-icon.png'),
  shadowUrl:     require('leaflet/dist/images/marker-shadow.png'),
});

/* ─── Custom markers ─── */
const makeIcon = (color) => L.divIcon({
  className: '',
  html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 0 4px ${color}33,0 2px 10px rgba(0,0,0,.5)"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const PICKUP_ICON = makeIcon('#4ade80');
const DROP_ICON = makeIcon('#f87171');

const getDriverIcon = (vType) => L.divIcon({
  className: '',
  html: `<div style="font-size:28px;line-height:1;filter:drop-shadow(0 2px 8px rgba(245,166,35,.8)); transform:translateY(-4px)">${vType === 'car' ? '🚗' : vType === 'auto' ? '🛺' : '🏍️'}</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

/* ─── MapController ─── */
function MapController({ center, bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    } else if (center) {
      map.flyTo(center, 15, { duration: 0.8 });
    }
  }, [center, bounds, map]);
  return null;
}

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5001';

export default function PublicTracking() {
  const { rideId } = useParams();
  
  const [driverLoc, setDriverLoc] = useState(null);
  const [rideDetails, setRideDetails] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // 1. Fetch static ride details (requires public bypass or a guest endpoint)
    // Actually, since we need to fetch ride details, we should either bypass auth for GET /rides/:id OR use a public endpoint.
    // Wait, the regular GET /rides/:id requires authMiddleware.
    // So parents wouldn't be able to fetch the pickup/dropoff coords without auth!
    // I should create a public endpoint for ride details OR just rely on socket updates.
    // Let's create a temporary connection for the socket first.
    
    const socket = io(SOCKET_URL, {
      auth: { publicTracking: true },
      transports: ['websocket']
    });

    socket.on('connect', () => {
      socket.emit('join-ride', rideId);
    });

    socket.on('ride-location-update', ({ location: loc }) => {
      if (loc?.lat && loc?.lng) setDriverLoc(loc);
    });
    
    // We can also listen for ride completed events
    socket.on('rideCompleted', () => {
      setError('This ride has been completed.');
    });
    
    socket.on('rideCancelled', () => {
      setError('This ride has been cancelled.');
    });

    return () => {
      socket.emit('leave-ride', rideId);
      socket.close();
    };
  }, [rideId]);
  
  // Try to fetch ride details without auth - I need to modify the backend or just show driver location.
  // We'll fetch a new public endpoint /rides/public/:rideId
  useEffect(() => {
    const fetchPublicRide = async () => {
      try {
        const res = await axiosInstance.get(`/rides/public/${rideId}`);
        setRideDetails(res.data.ride);
      } catch (err) {
        // Just rely on socket if api fails
        console.warn('Could not fetch static ride details. Waiting for driver location...');
      }
    };
    fetchPublicRide();
  }, [rideId]);

  const pickupCoords = rideDetails?.pickupLocation?.coordinates ? { lat: rideDetails.pickupLocation.coordinates[1], lng: rideDetails.pickupLocation.coordinates[0] } : null;
  const dropCoords = rideDetails?.dropoffLocation?.coordinates ? { lat: rideDetails.dropoffLocation.coordinates[1], lng: rideDetails.dropoffLocation.coordinates[0] } : null;

  const mapCenter = driverLoc ? [driverLoc.lat, driverLoc.lng] : (pickupCoords ? [pickupCoords.lat, pickupCoords.lng] : [20.5937, 78.9629]);
  
  const bounds = (driverLoc && dropCoords) 
    ? L.latLngBounds([driverLoc.lat, driverLoc.lng], [dropCoords.lat, dropCoords.lng]) 
    : null;

  if (error) {
    return (
      <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center text-white p-6 font-['Inter',sans-serif]">
        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-2xl mb-4">🏁</div>
        <h1 className="text-xl font-bold">{error}</h1>
        <p className="text-white/50 mt-2 text-center text-sm">The live tracking link is no longer active.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] w-full relative" style={{ background: '#080a10', fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* MAP */}
      <div className="absolute inset-0 z-0">
        <MapContainer
          center={mapCenter}
          zoom={15}
          style={{ width: '100%', height: '100%' }}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; OSM'
            maxZoom={20}
          />
          <MapController center={mapCenter} bounds={bounds} />

          {pickupCoords && <Marker position={[pickupCoords.lat, pickupCoords.lng]} icon={PICKUP_ICON} />}
          {dropCoords && <Marker position={[dropCoords.lat, dropCoords.lng]} icon={DROP_ICON} />}
          
          {driverLoc && (
            <Marker position={[driverLoc.lat, driverLoc.lng]} icon={getDriverIcon(rideDetails?.driverId?.vehicleType || 'bike')} />
          )}
        </MapContainer>
        
        {/* Top gradient */}
        <div className="absolute inset-x-0 top-0 h-24 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom,rgba(8,10,16,.9) 0%,rgba(8,10,16,.3) 70%,transparent 100%)', zIndex: 15 }} />
          
        {/* Header */}
        <div className="absolute top-4 left-4 z-[16] flex items-center gap-2.5 pointer-events-auto">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-lg"
            style={{ background: 'linear-gradient(135deg,#F5A623,#FF6B35)', boxShadow: '0 4px 14px rgba(245,166,35,.45)' }}>
            🏍️
          </div>
          <div>
            <p className="text-white font-extrabold text-base leading-none tracking-tight">jydo</p>
            <p className="text-green-400 text-[10px] font-bold tracking-widest uppercase mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" /> Live Tracking
            </p>
          </div>
        </div>
      </div>
      
      {/* Bottom Panel */}
      <div className="absolute inset-x-0 bottom-0 z-[16] p-4 pointer-events-none">
        <div className="bg-[#0a0c14]/95 backdrop-blur-xl border border-white/10 p-5 rounded-3xl shadow-2xl pointer-events-auto">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-widest mb-4">
            <Shield size={14} /> Passenger is sharing their ride
          </div>
          
          {!driverLoc && !rideDetails && (
            <div className="flex flex-col items-center py-4">
              <div className="w-6 h-6 border-2 border-white/20 border-t-amber-400 rounded-full animate-spin mb-3" />
              <p className="text-white/50 text-sm">Connecting to driver's GPS...</p>
            </div>
          )}
          
          {rideDetails && (
            <div className="space-y-4">
               {rideDetails.driverId && (
                 <div className="flex items-center gap-3">
                   <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl">
                     🧑🏽‍✈️
                   </div>
                   <div>
                     <p className="text-white font-bold text-sm">{rideDetails.driverId.name}</p>
                     <p className="text-white/50 text-xs">
                       {rideDetails.driverId.vehicleType.toUpperCase()} • {rideDetails.driverId.vehicleNumber}
                     </p>
                   </div>
                 </div>
               )}
               
               <div className="bg-white/5 rounded-2xl p-3">
                 <div className="flex items-center gap-3">
                    <Navigation size={14} className="text-rose-400" />
                    <p className="text-white/90 text-xs font-medium truncate">
                      {rideDetails.dropoffLocation?.address || 'Destination'}
                    </p>
                 </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

