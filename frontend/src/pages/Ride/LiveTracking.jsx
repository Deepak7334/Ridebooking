import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Phone, MessageCircle, Shield, Star, Navigation, MapPin } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import axiosInstance from '../../api/axios';

/* ─── Fix Leaflet default marker icons broken by webpack ─── */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl:       require('leaflet/dist/images/marker-icon.png'),
  shadowUrl:     require('leaflet/dist/images/marker-shadow.png'),
});

/* ─── Custom markers ─── */
const makeIcon = (color, shape = 'circle') => L.divIcon({
  className: '',
  html: shape === 'circle'
    ? `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 0 4px ${color}33,0 2px 10px rgba(0,0,0,.5)"></div>`
    : `<div style="width:14px;height:14px;border-radius:3px;background:${color};border:2px solid #fff;box-shadow:0 0 0 4px ${color}33,0 2px 10px rgba(0,0,0,.5);transform:rotate(45deg)"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const PICKUP_ICON = makeIcon('#4ade80', 'circle');

const getDriverIcon = (vType) => L.divIcon({
  className: '',
  html: `<div style="font-size:28px;line-height:1;filter:drop-shadow(0 2px 8px rgba(245,166,35,.8)); transform:translateY(-4px)">${vType === 'car' ? '🚗' : vType === 'auto' ? '🛺' : '🏍️'}</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

/* ─── MapController – centers map ─── */
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

const VEHICLE_ICONS = { auto: '🛺', car: '🚗', bike: '🏍️' };

const STATUS_CONFIG = {
  accepted:  { label: 'Driver is on the way', color: '#4ade80', bg: 'rgba(74,222,128,.12)', border: 'rgba(74,222,128,.3)', dot: '#4ade80' },
  started:   { label: 'Ride in progress',     color: '#60a5fa', bg: 'rgba(96,165,250,.12)', border: 'rgba(96,165,250,.3)', dot: '#60a5fa' },
  completed: { label: 'Ride completed',       color: '#a78bfa', bg: 'rgba(167,139,250,.12)', border: 'rgba(167,139,250,.3)', dot: '#a78bfa' },
};

/* Fetch route via OSRM */
const fetchRoute = async (p1, p2) => {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${p1.lng},${p1.lat};${p2.lng},${p2.lat}?overview=full&geometries=geojson`;
    const r = await fetch(url);
    const d = await r.json();
    if (d.routes?.[0]) {
      return d.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
    }
  } catch {}
  return [];
};

const LiveTracking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const rideData = location.state || {};
  const { socket, joinRideRoom, leaveRideRoom } = useSocket();

  const [driverLoc, setDriverLoc] = useState(null);
  const [status, setStatus] = useState(rideData.status || 'accepted');
  const [routeCoords, setRouteCoords] = useState([]);
  const [rideFromApi, setRideFromApi] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);

  // Fallback to fetch ride data if not in state
  useEffect(() => {
    const fetchRide = async () => {
      try {
        const id = rideData.rideId || params.rideId;
        if (!id) return;
        const res = await axiosInstance.get(`/rides/${id}`);
        setRideFromApi(res.data.ride);
        setStatus(res.data.ride.status);
      } catch (err) {
        console.error("Failed to fetch ride", err);
      }
    };
    if (!rideData.driver) fetchRide();
  }, [rideData, params.rideId]);

  const driver = rideData.driver || rideFromApi?.driverId || { name: 'Your Driver', vehicleType: 'bike', vehicleNumber: '—', averageRating: 5.0, phone: '' };
  
  const extractCoords = (loc) => {
    if (!loc) return null;
    if (loc.lat && loc.lng) return { lat: loc.lat, lng: loc.lng };
    if (loc.coordinates) return { lat: loc.coordinates[1], lng: loc.coordinates[0] };
    return null;
  };

  const pickupCoords = extractCoords(rideData.pickupLocation) || extractCoords(rideFromApi?.pickupLocation) || { lat: 28.6139, lng: 77.2090 };

  useEffect(() => {
    const rideId = rideData.rideId || params.rideId;
    if (!rideId) return;

    joinRideRoom(rideId);

    const handleLocUpdate = ({ location: loc }) => {
      if (loc?.lat && loc?.lng) setDriverLoc(loc);
    };
    const handleStarted = () => setStatus('started');
    const handleCompleted = () => {
      setStatus('completed');
      setTimeout(() => navigate('/ride/completed', { state: { ...rideData, ...(rideFromApi || {}) } }), 1500);
    };

    socket?.on('ride-location-update', handleLocUpdate);
    socket?.on('rideStarted', handleStarted);
    socket?.on('rideCompleted', handleCompleted);

    return () => {
      if (rideId) leaveRideRoom(rideId);
      socket?.off('ride-location-update', handleLocUpdate);
      socket?.off('rideStarted', handleStarted);
      socket?.off('rideCompleted', handleCompleted);
    };
  }, [rideData, rideFromApi, params.rideId, socket, navigate, joinRideRoom, leaveRideRoom]);

  // Update Route
  useEffect(() => {
    const getRoute = async () => {
      if (driverLoc && pickupCoords && status === 'accepted') {
        setLoadingRoute(true);
        const coords = await fetchRoute(driverLoc, pickupCoords);
        setRouteCoords(coords);
        setLoadingRoute(false);
      }
    };
    // throttle route fetching so we don't spam OSRM
    const timeoutId = setTimeout(getRoute, 2000);
    return () => clearTimeout(timeoutId);
  }, [driverLoc?.lat, driverLoc?.lng, status]); // depend on lat/lng to avoid object ref issues

  const mapCenter = driverLoc ? [driverLoc.lat, driverLoc.lng] : [pickupCoords.lat, pickupCoords.lng];
  const bounds = (driverLoc && pickupCoords && status === 'accepted') 
    ? L.latLngBounds([driverLoc.lat, driverLoc.lng], [pickupCoords.lat, pickupCoords.lng]) 
    : null;

  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.accepted;
  const vIcon = VEHICLE_ICONS[driver.vehicleType] || '🏍️';

  return (
    <div className="flex flex-col md:flex-row h-full w-full relative" style={{ background: '#080a10', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @keyframes fadeSlideUp { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
        .panel-anim { animation: fadeSlideUp .3s cubic-bezier(.16,1,.3,1) both; }
        .glass { background:rgba(10,12,20,.95); backdrop-filter:blur(24px); border-top:1px solid rgba(255,255,255,.07); }
        .glass-card { background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.06); border-radius:16px; }
        .leaflet-pane { z-index: 10 !important; }
        .leaflet-control { z-index: 20 !important; }
        .leaflet-top, .leaflet-bottom { z-index: 20 !important; }
      `}</style>

      {/* ════════════ MAP ════════════ */}
      <div className="absolute inset-0 md:relative md:flex-1 md:min-h-0" style={{ zIndex: 0 }}>
        <MapContainer
          center={mapCenter}
          zoom={15}
          style={{ width: '100%', height: '100%' }}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            subdomains="abcd"
            maxZoom={20}
          />
          <MapController center={mapCenter} bounds={bounds} />

          <Marker position={[pickupCoords.lat, pickupCoords.lng]} icon={PICKUP_ICON} />
          
          {driverLoc && (
            <Marker position={[driverLoc.lat, driverLoc.lng]} icon={getDriverIcon(driver.vehicleType)} />
          )}

          {routeCoords.length > 0 && status === 'accepted' && (
            <Polyline
              positions={routeCoords}
              pathOptions={{ color: '#F5A623', weight: 5, opacity: 0.85, lineCap: 'round', lineJoin: 'round' }}
            />
          )}
        </MapContainer>

        {/* Top gradient overlay */}
        <div className="absolute inset-x-0 top-0 h-24 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom,rgba(8,10,16,.9) 0%,rgba(8,10,16,.3) 70%,transparent 100%)', zIndex: 15 }} />

        {/* Logo overlay */}
        <div className="absolute top-4 left-4 z-[16] flex items-center gap-2.5 pointer-events-auto">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm shadow-lg"
            style={{ background: 'linear-gradient(135deg,#F5A623,#FF6B35)', boxShadow: '0 4px 14px rgba(245,166,35,.45)' }}>
            🏍️
          </div>
          <p className="text-white font-extrabold text-base leading-none tracking-tight">jydo</p>
        </div>

        {/* Status Badge on Map */}
        <div className="absolute top-4 right-4 z-[16] flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-xl pointer-events-auto"
          style={{ background: 'rgba(10,12,20,.8)', backdropFilter: 'blur(12px)', border: `1px solid ${cfg.border}` }}>
          <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: cfg.dot, boxShadow: `0 0 10px ${cfg.dot}` }} />
          <span className="font-bold text-xs" style={{ color: cfg.color }}>{cfg.label}</span>
        </div>
      </div>

      {/* ════════════ INFO PANEL ════════════ */}
      <div className="absolute inset-x-0 bottom-0 z-[16] panel-anim glass md:relative md:w-[400px] md:h-full md:border-t-0 md:border-l md:border-white/[.06] rounded-t-[32px] md:rounded-none flex flex-col pointer-events-auto"
        style={{ maxHeight: '55dvh' }}>
        <div className="flex justify-center pt-3 pb-2 shrink-0 md:hidden"><div className="w-12 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,.15)' }} /></div>
        
        <div className="p-5 md:p-6 flex-1 overflow-y-auto">
          {/* Driver Profile & Actions */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-16 h-16 rounded-[20px] flex items-center justify-center text-4xl shrink-0"
                style={{ background: 'linear-gradient(135deg,rgba(245,166,35,.15),rgba(255,107,53,.15))', border: '1px solid rgba(245,166,35,.3)', boxShadow: '0 8px 24px rgba(245,166,35,.15)' }}>
                {vIcon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white font-bold text-lg mb-0.5 truncate">{driver.name}</p>
                <div className="flex items-center gap-2 text-white/40 text-[11px] font-bold uppercase tracking-widest mb-1.5">
                  <span className="truncate">{driver.vehicleType}</span> •
                  <span className="text-white/70 font-mono tracking-widest">{driver.vehicleNumber}</span>
                </div>
                <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold bg-amber-400/10 w-max px-2 py-0.5 rounded-md">
                  <Star size={11} fill="currentColor" /> {driver.averageRating?.toFixed(1) || '5.0'}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 shrink-0 ml-3">
              {driver.phone && (
                <div className="flex gap-2">
                  <a href={`tel:${driver.phone}`} className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-105"
                    style={{ background: 'rgba(74,222,128,.15)', color: '#4ade80' }}><Phone size={16} /></a>
                  <a href={`sms:${driver.phone}`} className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-105"
                    style={{ background: 'rgba(96,165,250,.15)', color: '#60a5fa' }}><MessageCircle size={16} /></a>
                </div>
              )}
              <button 
                onClick={() => {
                  const url = `${window.location.origin}/track/${rideData.rideId || params.rideId}`;
                  navigator.clipboard.writeText(url);
                  alert('Tracking link copied to clipboard! Share it with your parents.');
                }}
                className="flex items-center justify-center gap-1.5 w-full h-8 rounded-full text-xs font-bold transition-all hover:scale-105"
                style={{ background: 'rgba(245,166,35,.15)', color: '#F5A623', border: '1px solid rgba(245,166,35,.3)' }}
              >
                <Navigation size={12} /> Share Ride
              </button>
            </div>
          </div>

          {/* Route Summary */}
          <div className="glass-card p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center pt-1.5 shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                <div className="w-px h-6 my-1" style={{ background: 'linear-gradient(to bottom,rgba(74,222,128,.4),rgba(251,113,133,.4))' }} />
                <div className="w-2.5 h-2.5 rounded bg-rose-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white/90 text-sm font-medium mb-3.5 truncate">{rideData.pickupAddress || rideFromApi?.pickupLocation?.address || 'Pickup Location'}</p>
                <div className="h-px w-full mb-3" style={{ background: 'rgba(255,255,255,.05)' }} />
                <p className="text-white/40 text-sm font-medium truncate">{rideData.dropoffAddress || rideFromApi?.dropoffLocation?.address || 'Destination'}</p>
              </div>
            </div>
          </div>

          {/* OTP Box */}
          {status === 'accepted' && (rideData.otp || rideFromApi?.otp) && (
            <div className="rounded-2xl p-5 mb-6 flex items-center justify-between"
              style={{ background: 'linear-gradient(135deg,rgba(167,139,250,.1),rgba(167,139,250,.02))', border: '1px solid rgba(167,139,250,.2)', boxShadow: 'inset 0 2px 10px rgba(167,139,250,.05)' }}>
              <div>
                <div className="flex items-center gap-1.5 text-purple-300/80 font-bold text-[11px] uppercase tracking-widest mb-1">
                  <Shield size={14} className="text-purple-400" /> Share OTP
                </div>
                <p className="text-purple-300/50 text-xs">Verify your ride</p>
              </div>
              <span className="text-white text-[32px] font-black tracking-[0.3em] font-mono leading-none ms-2"
                style={{ textShadow: '0 2px 10px rgba(167,139,250,.4)' }}>
                {rideData.otp || rideFromApi?.otp}
              </span>
            </div>
          )}
        </div>

        {/* Footer info (Fare) */}
        <div className="p-5 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,.05)' }}>
          <div className="flex justify-between items-center glass-card px-5 py-4">
            <span className="text-white/40 text-[13px] font-medium uppercase tracking-wider">Total Fare</span>
            <span className="text-amber-400 font-extrabold text-2xl">₹{rideData.fare || rideFromApi?.fare || '—'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTracking;

