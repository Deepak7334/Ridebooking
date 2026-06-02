import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Phone, MessageCircle, Shield, Navigation, MapPin } from 'lucide-react';
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
const DROPOFF_ICON = makeIcon('#f87171', 'square');

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

const STATUS_CONFIG = {
  accepted:  { label: 'Navigating to Customer', color: '#4ade80', bg: 'rgba(74,222,128,.12)', border: 'rgba(74,222,128,.3)', dot: '#4ade80' },
  started:   { label: 'Ride in Progress',     color: '#60a5fa', bg: 'rgba(96,165,250,.12)', border: 'rgba(96,165,250,.3)', dot: '#60a5fa' },
};

/* Fetch route via OSRM */
const fetchRoute = async (p1, p2) => {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${p1.lng},${p1.lat};${p2.lng},${p2.lat}?overview=full&geometries=geojson`;
    const r = await fetch(url);
    const d = await r.json();
    if (d.routes?.[0]) {
      return {
        coords: d.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]),
        distance: d.routes[0].distance,
        duration: d.routes[0].duration
      };
    }
  } catch {}
  return { coords: [], distance: 0, duration: 0 };
};

export default function DriverTracking() {
  const navigate = useNavigate();
  const location = useLocation();
  const rideDataFromState = location.state?.ride;
  
  const { socket, joinRideRoom, leaveRideRoom, driverGoOnline } = useSocket();

  const [ride, setRide] = useState(rideDataFromState || null);
  const [driverLoc, setDriverLoc] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch ride if not in state
  useEffect(() => {
    const fetchRide = async () => {
      try {
        if (!rideDataFromState) {
          // fetch active ride from driver API
          const r = await axiosInstance.get('/driver/available-rides'); 
          // getAvailableRides actually returns requested. But wait, we can't get active ride this way.
          // Let's just fetch earnings and see active ride?
          // Actually, if rideDataFromState is null, redirect to dashboard.
          navigate('/driver/dashboard');
        }
      } catch (err) {
        console.error(err);
      }
    };
    if (!ride) fetchRide();
  }, [ride, rideDataFromState, navigate]);

  // Handle Geolocation
  useEffect(() => {
    if (!ride) return;
    const sendLocation = async ({ coords }) => {
      const loc = { lat: coords.latitude, lng: coords.longitude };
      setDriverLoc(loc);
      if (ride && ['accepted', 'started'].includes(ride.status)) {
        try { await axiosInstance.patch(`/rides/${ride._id}/location`, { location: loc }); } catch {}
      }
    };
    let id;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(sendLocation, err => console.warn(err), { enableHighAccuracy: true });
      id = navigator.geolocation.watchPosition(sendLocation, err => console.warn(err), { enableHighAccuracy: true, maximumAge: 5000, timeout: 8000 });
    }
    return () => { if (id) navigator.geolocation.clearWatch(id); };
  }, [ride]);

  // Handle Socket
  useEffect(() => {
    if (!ride?._id) return;
    joinRideRoom(ride._id);
    return () => {
      leaveRideRoom(ride._id);
    };
  }, [ride?._id, joinRideRoom, leaveRideRoom]);

  // Extract coords
  const extractCoords = (loc) => {
    if (!loc) return null;
    if (loc.lat && loc.lng) return { lat: loc.lat, lng: loc.lng };
    if (loc.coordinates) return { lat: loc.coordinates[1], lng: loc.coordinates[0] };
    return null;
  };

  const pickupCoords = extractCoords(ride?.pickupLocation);
  const dropoffCoords = extractCoords(ride?.dropoffLocation);

  // Route
  useEffect(() => {
    const getRoute = async () => {
      if (driverLoc && ride) {
        setLoadingRoute(true);
        let res = { coords: [], distance: 0, duration: 0 };
        if (ride.status === 'accepted' && pickupCoords) {
          res = await fetchRoute(driverLoc, pickupCoords);
        } else if (ride.status === 'started' && dropoffCoords) {
          res = await fetchRoute(driverLoc, dropoffCoords);
        }
        setRouteCoords(res.coords);
        if (res.distance > 0) setRouteInfo({ distance: res.distance, duration: res.duration });
        setLoadingRoute(false);
      }
    };
    const timeoutId = setTimeout(getRoute, 2000);
    return () => clearTimeout(timeoutId);
  }, [driverLoc?.lat, driverLoc?.lng, ride?.status]);

  if (!ride) return null;

  const mapCenter = driverLoc ? [driverLoc.lat, driverLoc.lng] : pickupCoords ? [pickupCoords.lat, pickupCoords.lng] : [28.6139, 77.2090];
  let bounds = null;
  if (driverLoc && pickupCoords && ride.status === 'accepted') {
    bounds = L.latLngBounds([driverLoc.lat, driverLoc.lng], [pickupCoords.lat, pickupCoords.lng]);
  } else if (driverLoc && dropoffCoords && ride.status === 'started') {
    bounds = L.latLngBounds([driverLoc.lat, driverLoc.lng], [dropoffCoords.lat, dropoffCoords.lng]);
  }

  const cfg = STATUS_CONFIG[ride.status] || STATUS_CONFIG.accepted;
  const vIcon = '🏍️'; // default
  const passenger = ride.passengerId || { name: 'Customer' };

  const handleStartRide = async () => {
    if (otpInput.length < 4) return setOtpError('Enter 4-digit OTP');
    setActionLoading(true); setOtpError('');
    try {
      const r = await axiosInstance.patch(`/rides/${ride._id}/start`, { otp: otpInput });
      setRide(r.data.ride);
      setOtpInput('');
    } catch (e) { 
      setOtpError(e.response?.data?.message || 'Invalid OTP'); 
    } finally { 
      setActionLoading(false); 
    }
  };

  const handleCompleteRide = async () => {
    setActionLoading(true);
    try {
      await axiosInstance.patch(`/rides/${ride._id}/complete`);
      if (socket) socket.emit('leave-ride', ride._id);
      driverGoOnline(); // Go back to available-drivers room
      navigate('/driver/dashboard');
    } catch (e) { 
      alert(e.response?.data?.message || 'Failed to complete ride'); 
    } finally { 
      setActionLoading(false); 
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-full relative" style={{ background: '#080a10', fontFamily: "'Inter', system-ui, sans-serif" }}>
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

          {pickupCoords && ride.status === 'accepted' && (
            <Marker position={[pickupCoords.lat, pickupCoords.lng]} icon={PICKUP_ICON} />
          )}
          {dropoffCoords && ride.status === 'started' && (
            <Marker position={[dropoffCoords.lat, dropoffCoords.lng]} icon={DROPOFF_ICON} />
          )}
          
          {driverLoc && (
            <Marker position={[driverLoc.lat, driverLoc.lng]} icon={getDriverIcon(ride.driverId?.vehicleType || 'bike')} />
          )}

          {routeCoords.length > 0 && (
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
        <div className="absolute top-4 right-4 z-[16] flex flex-col gap-2 items-end pointer-events-auto">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-xl"
            style={{ background: 'rgba(10,12,20,.8)', backdropFilter: 'blur(12px)', border: `1px solid ${cfg.border}` }}>
            <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: cfg.dot, boxShadow: `0 0 10px ${cfg.dot}` }} />
            <span className="font-bold text-xs" style={{ color: cfg.color }}>{cfg.label}</span>
          </div>
          
          {routeInfo && (
            <div className="flex items-center gap-4 px-5 py-3 rounded-xl shadow-xl"
              style={{ background: 'rgba(10,12,20,.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex flex-col items-center">
                <span className="text-white/40 text-[9px] font-black uppercase tracking-widest mb-0.5">Distance</span>
                <span className="text-white font-extrabold text-sm">{(routeInfo.distance / 1000).toFixed(1)} <span className="text-white/60 text-xs">km</span></span>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="flex flex-col items-center">
                <span className="text-white/40 text-[9px] font-black uppercase tracking-widest mb-0.5">ETA</span>
                <span className="text-amber-400 font-extrabold text-sm">{Math.ceil(routeInfo.duration / 60)} <span className="text-amber-400/60 text-xs">min</span></span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ════════════ INFO PANEL ════════════ */}
      <div className="absolute inset-x-0 bottom-0 z-[16] panel-anim glass md:relative md:w-[400px] md:h-full md:border-t-0 md:border-l md:border-white/[.06] rounded-t-[32px] md:rounded-none flex flex-col pointer-events-auto"
        style={{ maxHeight: '65dvh' }}>
        <div className="flex justify-center pt-3 pb-2 shrink-0 md:hidden"><div className="w-12 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,.15)' }} /></div>
        
        <div className="p-5 md:p-6 flex-1 overflow-y-auto pb-32">
          {/* Passenger Profile & Actions */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-16 h-16 rounded-[20px] flex items-center justify-center text-4xl shrink-0"
                style={{ background: 'linear-gradient(135deg,rgba(74,222,128,.15),rgba(22,163,74,.15))', border: '1px solid rgba(74,222,128,.3)', boxShadow: '0 8px 24px rgba(74,222,128,.15)' }}>
                👤
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white font-bold text-lg mb-0.5 truncate">{passenger.name}</p>
                <div className="flex items-center gap-2 text-white/40 text-[11px] font-bold uppercase tracking-widest mb-1.5">
                  <span className="truncate">Customer</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 shrink-0 ml-3">
              {passenger.phone && (
                <div className="flex gap-2">
                  <a href={`tel:${passenger.phone}`} className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-105"
                    style={{ background: 'rgba(74,222,128,.15)', color: '#4ade80' }}><Phone size={16} /></a>
                  <a href={`sms:${passenger.phone}`} className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-105"
                    style={{ background: 'rgba(96,165,250,.15)', color: '#60a5fa' }}><MessageCircle size={16} /></a>
                </div>
              )}
              <button 
                onClick={() => {
                  const url = `https://www.google.com/maps/dir/?api=1&destination=${ride.status === 'accepted' ? pickupCoords?.lat + ',' + pickupCoords?.lng : dropoffCoords?.lat + ',' + dropoffCoords?.lng}`;
                  window.open(url, '_blank');
                }}
                className="flex items-center justify-center gap-1.5 w-full h-8 rounded-full text-xs font-bold transition-all hover:scale-105"
                style={{ background: 'rgba(99,102,241,.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,.3)' }}
              >
                <Navigation size={12} /> Google Maps
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
                <p className="text-white/90 text-sm font-medium mb-3.5 truncate">{ride.pickupAddress || ride.pickupLocation?.address || 'Pickup Location'}</p>
                <div className="h-px w-full mb-3" style={{ background: 'rgba(255,255,255,.05)' }} />
                <p className="text-white/40 text-sm font-medium truncate">{ride.dropoffAddress || ride.dropoffLocation?.address || 'Destination'}</p>
              </div>
            </div>
          </div>

          {/* OTP Box / Start Ride */}
          {ride.status === 'accepted' && (
            <div className="rounded-2xl p-5 mb-6"
              style={{ background: 'linear-gradient(135deg,rgba(167,139,250,.1),rgba(167,139,250,.02))', border: '1px solid rgba(167,139,250,.2)' }}>
              <div className="flex items-center gap-1.5 text-purple-300/80 font-bold text-[11px] uppercase tracking-widest mb-3">
                <Shield size={14} className="text-purple-400" /> Enter Customer OTP to Start Ride
              </div>
              <div className="flex items-center gap-3">
                <input 
                  type="text" 
                  value={otpInput} 
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').substring(0, 4))}
                  placeholder="0000"
                  className="bg-black/40 border-2 border-indigo-500/30 rounded-xl px-4 py-3 text-white text-2xl tracking-[0.5em] font-mono w-32 outline-none focus:border-indigo-500/80 text-center"
                />
                <button
                  disabled={actionLoading || otpInput.length < 4}
                  onClick={handleStartRide}
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl py-4 text-white font-bold text-sm uppercase tracking-wider disabled:opacity-50 transition-all active:scale-95"
                >
                  {actionLoading ? 'Verifying...' : 'Start Ride'}
                </button>
              </div>
              {otpError && <p className="text-red-400 text-xs mt-2 font-bold">{otpError}</p>}
            </div>
          )}

          {/* Complete Ride */}
          {ride.status === 'started' && (
            <div className="rounded-2xl p-5 mb-6 text-center"
              style={{ background: 'rgba(74,222,128,.1)', border: '1px solid rgba(74,222,128,.2)' }}>
              <p className="text-green-400/80 text-sm font-bold mb-4">Ride is currently in progress</p>
              <button
                disabled={actionLoading}
                onClick={handleCompleteRide}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl py-4 text-white font-bold text-sm uppercase tracking-wider disabled:opacity-50 transition-all active:scale-95"
              >
                {actionLoading ? 'Completing...' : 'Complete Ride'}
              </button>
            </div>
          )}

        </div>

        {/* Footer info (Fare) */}
        <div className="absolute bottom-0 inset-x-0 p-5 bg-black/50 backdrop-blur-md" style={{ borderTop: '1px solid rgba(255,255,255,.05)' }}>
          <div className="flex justify-between items-center glass-card px-5 py-4">
            <span className="text-white/40 text-[13px] font-medium uppercase tracking-wider">Collect Cash</span>
            <span className="text-amber-400 font-extrabold text-2xl">₹{ride.fare || '—'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
