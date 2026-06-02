import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  LogOut, MapPin, Navigation2, Search, User, Clock,
  X, ArrowLeft, Zap, Wallet, DollarSign, LocateFixed,
  ChevronRight, Shield,
} from 'lucide-react';
import axiosInstance from '../../api/axios';

/* ─── Fix Leaflet default marker icons ─── */
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
    ? `<div style="width:18px;height:18px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 0 0 4px ${color}44,0 4px 12px rgba(0,0,0,.6)"></div>`
    : `<div style="width:16px;height:16px;border-radius:4px;background:${color};border:3px solid #fff;box-shadow:0 0 0 4px ${color}44,0 4px 12px rgba(0,0,0,.6);transform:rotate(45deg)"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const PICKUP_ICON = makeIcon('#22c55e', 'circle');
const DROP_ICON   = makeIcon('#ef4444', 'square');
const DRIVER_ICON = L.divIcon({
  className: '',
  html: `<div style="font-size:26px;line-height:1;filter:drop-shadow(0 3px 8px rgba(255,200,0,.8))">🏍️</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

/* ─── MapController ─── */
function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, zoom || map.getZoom(), { duration: 0.9 });
  }, [center, map, zoom]);
  return null;
}

/* ─── Vehicles ─── */
const VEHICLES = [
  { id: 'bike', label: 'JYDO Bike', icon: '🏍️', desc: '1 seat · Fastest',     eta: '2 min', badge: 'Popular' },
  { id: 'auto', label: 'Auto',        icon: '🛺',  desc: '3 seats · Affordable', eta: '4 min', badge: '' },
  { id: 'car',  label: 'Cab',         icon: '🚗',  desc: '4 seats · Comfortable',eta: '6 min', badge: 'AC' },
];

/* ══════════════════════════════════════════════════
   LOCATION HELPERS
══════════════════════════════════════════════════ */

/**
 * Reverse geocode using Nominatim at zoom=18 (building level).
 * Returns a clean "Road, Area, City" string like Uber shows.
 */
const reverseGeocode = async (lat, lng) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&zoom=18&accept-language=en`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const d = await res.json();
    if (!d || d.error) return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

    const a = d.address || {};
    // Priority: specific place → road → neighbourhood → city
    const specific  = a.amenity || a.shop || a.building || a.tourism || a.leisure || a.office || a.name;
    const road      = a.road || a.pedestrian || a.footway || a.highway || a.path;
    const area      = a.neighbourhood || a.suburb || a.quarter || a.village;
    const city      = a.city || a.town || a.municipality || a.county;

    const parts = [specific, road, area, city].filter(Boolean);
    if (parts.length >= 2) return parts.slice(0, 3).join(', ');
    // Fallback to first 3 parts of display_name
    return d.display_name?.split(',').slice(0, 3).join(', ') || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
};

/**
 * Forward geocode – India-restricted, bias towards user location.
 * Returns Nominatim results sorted by distance.
 */
const searchPlaces = async (query, biasLat, biasLng) => {
  if (!query || query.length < 2) return [];
  try {
    const bias = biasLat && biasLng
      ? `&viewbox=${biasLng - 1.2},${biasLat + 1.2},${biasLng + 1.2},${biasLat - 1.2}&bounded=0`
      : '';
    const url =
      `https://nominatim.openstreetmap.org/search` +
      `?q=${encodeURIComponent(query)}` +
      `&format=json&limit=8&addressdetails=1&countrycodes=in` +
      bias;
    const res  = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    const data = await res.json();
    if (biasLat && biasLng && data.length > 1) {
      data.sort((a, b) => {
        const da = Math.hypot(+a.lat - biasLat, +a.lon - biasLng);
        const db = Math.hypot(+b.lat - biasLat, +b.lon - biasLng);
        return da - db;
      });
    }
    return data;
  } catch { return []; }
};

/** Parse a Nominatim result into { title, subtitle } */
const parseResult = (item) => {
  const a     = item.address || {};
  const title = a.amenity || a.shop || a.tourism || a.leisure || a.building
              || a.road || a.pedestrian
              || item.display_name.split(',')[0].trim();
  const sub   = [
    a.neighbourhood || a.suburb || a.quarter,
    a.city || a.town || a.village || a.county,
    a.state,
  ].filter(Boolean).slice(0, 2).join(', ');
  return { title: title || 'Unknown Place', subtitle: sub };
};

/** Emoji icon based on OSM type */
const placeEmoji = (type) => {
  const t = (type || '').toLowerCase();
  if (/hospital|clinic|pharmacy|health/.test(t))  return '🏥';
  if (/school|college|university|education/.test(t)) return '🏫';
  if (/restaurant|cafe|food|fast_food/.test(t))   return '🍽️';
  if (/mall|supermarket|market/.test(t))           return '🛒';
  if (/bus|train|station|railway|metro/.test(t))   return '🚉';
  if (/airport/.test(t))                           return '✈️';
  if (/park|garden|nature/.test(t))                return '🌳';
  if (/hotel|hostel|motel/.test(t))                return '🏨';
  if (/bank|atm/.test(t))                          return '🏦';
  if (/fuel|petrol|gas/.test(t))                   return '⛽';
  if (/residential|apartment|house/.test(t))       return '🏠';
  if (/road|street|highway/.test(t))               return '🛣️';
  return '📍';
};

/* ─── Route fetch via OSRM ─── */
const fetchRoute = async (pickup, drop) => {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${drop.lng},${drop.lat}?overview=full&geometries=geojson`;
    const r   = await fetch(url);
    const d   = await r.json();
    if (d.routes?.[0]) {
      return {
        coords:   d.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]),
        distance: +(d.routes[0].distance / 1000).toFixed(1),
        duration: Math.round(d.routes[0].duration / 60),
      };
    }
  } catch {}
  return null;
};

/* ══════════════════════════════════════════════════
   ADDRESS INPUT COMPONENT  (Uber-style)
══════════════════════════════════════════════════ */
const AddressInput = ({
  value, onChange, onSelect,
  placeholder, icon: Icon, iconColor,
  autoFocus, userLoc, label,
}) => {
  const [results,  setResults]  = useState([]);
  const [busy,     setBusy]     = useState(false);
  const [focused,  setFocused]  = useState(false);
  const debRef  = useRef(null);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  /* Close on outside click/tap */
  useEffect(() => {
    const close = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setFocused(false);
        setResults([]);
      }
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('touchstart', close, { passive: true });
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('touchstart', close);
    };
  }, []);

  const handleChange = (v) => {
    onChange(v);
    clearTimeout(debRef.current);
    if (!v || v.length < 2) { setResults([]); return; }
    setBusy(true);
    debRef.current = setTimeout(async () => {
      const data = await searchPlaces(v, userLoc?.lat, userLoc?.lng);
      setResults(data);
      setBusy(false);
    }, 280);
  };

  const handleSelect = (item) => {
    const { title, subtitle } = parseResult(item);
    const addr = subtitle ? `${title}, ${subtitle}` : title;
    onChange(addr);
    onSelect({ lat: +item.lat, lng: +item.lon, address: addr });
    setResults([]);
    setFocused(false);
  };

  const handleCurrentLocation = () => {
    if (!userLoc) return;
    onSelect({ lat: userLoc.lat, lng: userLoc.lng, address: value });
    setResults([]);
    setFocused(false);
  };

  const showDrop = focused;

  return (
    <div ref={wrapRef} style={{ position: 'relative', zIndex: 700 }}>
      {/* Label */}
      {label && (
        <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.35)',
          textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>
          {label}
        </p>
      )}

      {/* Input row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: focused ? 'rgba(255,255,255,.09)' : 'rgba(255,255,255,.05)',
        border: focused ? '1.5px solid rgba(245,166,35,.5)' : '1.5px solid rgba(255,255,255,.09)',
        borderRadius: 16, padding: '12px 14px',
        boxShadow: focused ? '0 0 0 3px rgba(245,166,35,.08)' : 'none',
        transition: 'all .18s ease',
      }}>
        <Icon size={16} style={{ color: iconColor === 'green' ? '#22c55e' : '#ef4444', flexShrink: 0 }} />
        <input
          ref={inputRef}
          autoFocus={autoFocus}
          value={value}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          onChange={e => handleChange(e.target.value)}
          onFocus={() => setFocused(true)}
          style={{
            flex: 1, background: 'none', border: 'none', outline: 'none',
            color: '#fff', fontSize: 14, fontWeight: 400, minWidth: 0,
            fontFamily: 'inherit',
          }}
        />
        {busy && (
          <div style={{ width: 14, height: 14, borderRadius: '50%',
            border: '2px solid rgba(255,255,255,.12)', borderTopColor: '#F5A623',
            animation: 'spin .7s linear infinite', flexShrink: 0 }} />
        )}
        {value && !busy && (
          <button
            onMouseDown={e => { e.preventDefault(); onChange(''); onSelect(null); setResults([]); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2,
              color: 'rgba(255,255,255,.3)', display: 'flex', alignItems: 'center',
              minHeight: 'unset', minWidth: 'unset', flexShrink: 0 }}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDrop && (
        <div style={{
          position: 'absolute', left: 0, right: 0, top: 'calc(100% + 8px)',
          background: '#0c0f1a', border: '1px solid rgba(255,255,255,.1)',
          borderRadius: 18, overflow: 'hidden', zIndex: 9999,
          maxHeight: 340, overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,.7)',
        }}>

          {/* ─ Use current location ─ */}
          {userLoc && (
            <button
              onMouseDown={e => { e.preventDefault(); handleCurrentLocation(); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 16px', background: 'none', border: 'none',
                borderBottom: '1px solid rgba(255,255,255,.06)',
                cursor: 'pointer', textAlign: 'left',
                transition: 'background .15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.04)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 12, flexShrink: 0,
                background: 'rgba(34,197,94,.15)', border: '1px solid rgba(34,197,94,.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <LocateFixed size={16} color="#22c55e" />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ color: '#22c55e', fontSize: 13, fontWeight: 700, margin: 0 }}>
                  Use current location
                </p>
                <p style={{ color: 'rgba(255,255,255,.3)', fontSize: 11, margin: '2px 0 0',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  maxWidth: 220 }}>
                  {value || 'Your GPS position'}
                </p>
              </div>
            </button>
          )}

          {/* ─ Searching indicator ─ */}
          {busy && results.length === 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px' }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%',
                border: '2px solid rgba(255,255,255,.1)', borderTopColor: '#F5A623',
                animation: 'spin .7s linear infinite' }} />
              <p style={{ color: 'rgba(255,255,255,.3)', fontSize: 13, margin: 0 }}>
                Searching places…
              </p>
            </div>
          )}

          {/* ─ Results ─ */}
          {results.map((r, i) => {
            const { title, subtitle } = parseResult(r);
            const emoji = placeEmoji(r.type || r.class || r.addresstype);
            return (
              <button
                key={r.place_id || i}
                onMouseDown={e => { e.preventDefault(); handleSelect(r); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '13px 16px', background: 'none', border: 'none',
                  borderBottom: i < results.length - 1 ? '1px solid rgba(255,255,255,.04)' : 'none',
                  cursor: 'pointer', textAlign: 'left', transition: 'background .15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,166,35,.05)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0, marginTop: 2,
                  background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16,
                }}>
                  {emoji}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ color: 'rgba(255,255,255,.95)', fontSize: 13, fontWeight: 600,
                    margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {title}
                  </p>
                  {subtitle && (
                    <p style={{ color: 'rgba(255,255,255,.35)', fontSize: 11, margin: '3px 0 0',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {subtitle}
                    </p>
                  )}
                </div>
              </button>
            );
          })}

          {/* ─ No results ─ */}
          {!busy && value.length >= 2 && results.length === 0 && (
            <div style={{ padding: '20px 16px', textAlign: 'center' }}>
              <p style={{ color: 'rgba(255,255,255,.3)', fontSize: 13, margin: 0 }}>
                No results for "<span style={{ color: 'rgba(255,255,255,.55)' }}>{value}</span>"
              </p>
              <p style={{ color: 'rgba(255,255,255,.18)', fontSize: 11, margin: '6px 0 0' }}>
                Try a landmark, area, or city name
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════
   MAIN HOME COMPONENT
══════════════════════════════════════════════════ */
function HomeContent() {
  const navigate = useNavigate();

  const [user,            setUser]            = useState(null);
  const [mapCenter,       setMapCenter]       = useState([20.5937, 78.9629]);
  const [pickup,          setPickup]          = useState(null);
  const [drop,            setDrop]            = useState(null);
  const [pickupAddr,      setPickupAddr]      = useState('');
  const [dropAddr,        setDropAddr]        = useState('');
  const [panel,           setPanel]           = useState('search');
  const [searchOpen,      setSearchOpen]      = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState('bike');
  const [paymentMethod,   setPaymentMethod]   = useState('cash');
  const [nearbyDrivers,   setNearbyDrivers]   = useState([]);
  const [fares,           setFares]           = useState({ bike: 50, auto: 80, car: 150 });
  const [distance,        setDistance]        = useState(null);
  const [duration,        setDuration]        = useState(null);
  const [estimating,      setEstimating]      = useState(false);
  const [booking,         setBooking]         = useState(false);
  const [routeCoords,     setRouteCoords]     = useState([]);
  const [bookError,       setBookError]       = useState('');
  const [locating,        setLocating]        = useState(false);
  const [locError,        setLocError]        = useState('');

  /* ── On mount: detect user location immediately ── */
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) { navigate('/login'); return; }
    setUser(JSON.parse(localStorage.getItem('user') || '{}'));
    detectLocation();
    // eslint-disable-next-line
  }, []);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setLocError('Geolocation not supported by your browser');
      fetchNearbyDrivers(20.5937, 78.9629);
      return;
    }
    setLocating(true);
    setLocError('');
    setPickupAddr('Detecting your location…');
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lng } }) => {
        setMapCenter([lat, lng]);
        setPickup({ lat, lng });
        fetchNearbyDrivers(lat, lng);
        // Fetch precise address
        const addr = await reverseGeocode(lat, lng);
        setPickupAddr(addr);
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        setPickupAddr('');
        if (err.code === 1) {
          setLocError('Location access denied. Please enable it in your browser settings.');
        } else {
          setLocError('Could not get your location. Please enter pickup manually.');
        }
        fetchNearbyDrivers(20.5937, 78.9629);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    );
  };

  const fetchNearbyDrivers = async (lat, lng) => {
    try {
      const res = await axiosInstance.get(`/rides/nearby-drivers?lat=${lat}&lng=${lng}`);
      setNearbyDrivers(res.data.drivers || []);
    } catch {}
  };

  const relocate = () => {
    detectLocation();
  };

  const handlePickupSelect = (res) => {
    if (!res) { setPickup(null); setPickupAddr(''); return; }
    setPickup({ lat: res.lat, lng: res.lng });
    setPickupAddr(res.address);
    setMapCenter([res.lat, res.lng]);
    fetchNearbyDrivers(res.lat, res.lng);
  };

  const handleDropSelect = (res) => {
    if (!res) { setDrop(null); setDropAddr(''); setRouteCoords([]); return; }
    setDrop({ lat: res.lat, lng: res.lng });
    setDropAddr(res.address);
  };

  /* ── Search → vehicles ── */
  const handleSearch = async () => {
    if (!pickup) return alert('Please allow location or select a pickup point.');
    if (!drop)   return alert('Please select a destination.');
    setSearchOpen(false);
    setEstimating(true);
    setPanel('vehicles');
    setRouteCoords([]);

    const route = await fetchRoute(pickup, drop);
    if (route) {
      setRouteCoords(route.coords);
      setDistance(route.distance);
      setDuration(route.duration);
      setFares({
        bike: Math.max(30,  Math.round(route.distance * 12)),
        auto: Math.max(50,  Math.round(route.distance * 18)),
        car:  Math.max(80,  Math.round(route.distance * 28)),
      });
    }
    try {
      const res = await axiosInstance.post('/rides/estimate-fare', { pickupLocation: pickup, dropoffLocation: drop });
      if (res.data.fares)    setFares(res.data.fares);
      if (res.data.distance && !route) setDistance(res.data.distance);
      if (res.data.duration && !route) setDuration(res.data.duration);
    } catch {}
    setEstimating(false);
  };

  /* ── Book ── */
  const handleBook = async () => {
    if (!pickup || !drop) return alert('Select pickup and destination first.');
    setBooking(true); setBookError('');
    try {
      const payload = {
        pickupLocation:  { lat: pickup.lat, lng: pickup.lng, address: pickupAddr },
        dropoffLocation: { lat: drop.lat,   lng: drop.lng,   address: dropAddr },
        vehicleType: selectedVehicle,
        fare: fares[selectedVehicle] || 50,
        paymentMethod,
      };
      const res = await axiosInstance.post('/rides/create', payload);
      navigate('/ride/searching', {
        state: {
          pickupLocation: pickup, dropoffLocation: drop,
          pickupAddress: pickupAddr, dropoffAddress: dropAddr,
          vehicle: selectedVehicle, fare: fares[selectedVehicle],
          rideId: res.data.ride._id, otp: res.data.ride.otp, paymentMethod,
        },
      });
    } catch (err) {
      setBookError(err.response?.data?.message || 'Failed to book. Try again.');
    } finally { setBooking(false); }
  };

  /* ════════════════════════════════════════
     RENDER
  ════════════════════════════════════════ */
  return (
    <div
      className="flex-1 flex flex-col md:flex-row overflow-hidden w-full relative"
      style={{ background: '#080a10', fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <style>{`
        @keyframes fadeSlideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin        { to{transform:rotate(360deg)} }
        @keyframes shimmer     { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes pulse2      { 0%,100%{opacity:1} 50%{opacity:.4} }

        .panel-anim  { animation: fadeSlideUp .3s cubic-bezier(.16,1,.3,1) both; }
        .shimmer-box {
          background: linear-gradient(90deg,rgba(255,255,255,.04) 25%,rgba(255,255,255,.09) 50%,rgba(255,255,255,.04) 75%);
          background-size: 200% 100%; animation: shimmer 1.5s infinite;
        }
        .glow-btn {
          background: linear-gradient(135deg,#F5A623 0%,#FF6B35 100%);
          box-shadow: 0 6px 24px rgba(245,166,35,.4), inset 0 1px 0 rgba(255,255,255,.15);
          transition: all .2s cubic-bezier(.16,1,.3,1); color: #111;
        }
        .glow-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 32px rgba(245,166,35,.5); }
        .glow-btn:active:not(:disabled){ transform: translateY(0); }
        .glow-btn:disabled             { opacity: .5; cursor: not-allowed; }
        .glass { background:rgba(10,12,20,.94); backdrop-filter:blur(24px); border-top:1px solid rgba(255,255,255,.07); }
        .v-card { transition: all .15s ease; cursor: pointer; }
        .v-card:hover { transform: translateX(3px); }
        .leaflet-pane        { z-index: 10 !important; }
        .leaflet-control     { z-index: 20 !important; }
        .leaflet-top, .leaflet-bottom { z-index: 20 !important; }
      `}</style>

      {/* ════ MAP ════ */}
      <div className="absolute inset-0 md:relative md:flex-1 md:min-h-0" style={{ zIndex: 0 }}>
        <MapContainer
          center={mapCenter} zoom={15}
          style={{ width: '100%', height: '100%' }}
          zoomControl={false} attributionControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            subdomains="abcd" maxZoom={20}
          />
          <MapController center={mapCenter} />
          {pickup  && <Marker position={[pickup.lat,  pickup.lng]}  icon={PICKUP_ICON} />}
          {drop    && <Marker position={[drop.lat,    drop.lng]}    icon={DROP_ICON} />}
          {routeCoords.length > 0 && (
            <Polyline positions={routeCoords}
              pathOptions={{ color: '#F5A623', weight: 5, opacity: .85, lineCap: 'round', lineJoin: 'round' }} />
          )}
          {nearbyDrivers.map(d => {
            const dlat = d.location?.coordinates?.[1];
            const dlng = d.location?.coordinates?.[0];
            if (!dlat || !dlng) return null;
            return <Marker key={d._id} position={[dlat, dlng]} icon={DRIVER_ICON} />;
          })}
        </MapContainer>

        {/* Gradient overlay – mobile */}
        <div className="absolute inset-x-0 top-0 h-28 pointer-events-none md:hidden"
          style={{ background: 'linear-gradient(to bottom,rgba(8,10,16,.9) 0%,rgba(8,10,16,.2) 80%,transparent 100%)', zIndex: 15 }} />

        {/* Locate-me button */}
        <button onClick={relocate} disabled={locating} title="My location"
          className="absolute right-4 z-[15] w-11 h-11 rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-60"
          style={{ bottom: 320, background: 'rgba(10,12,20,.9)', backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,.14)', boxShadow: '0 4px 20px rgba(0,0,0,.5)' }}>
          {locating
            ? <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,.15)',
                borderTopColor: '#F5A623', animation: 'spin .7s linear infinite' }} />
            : <LocateFixed size={18} className="text-amber-400" />
          }
        </button>

        {/* Nearby badge */}
        {nearbyDrivers.length > 0 && (
          <div className="absolute top-3 right-3 z-[15] flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold"
            style={{ background: 'rgba(74,222,128,.12)', border: '1px solid rgba(74,222,128,.25)', color: '#4ade80' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            {nearbyDrivers.length} driver{nearbyDrivers.length !== 1 ? 's' : ''} nearby
          </div>
        )}
      </div>

      {/* ════ FLOATING HEADER – mobile ════ */}
      <header className="absolute inset-x-0 top-0 z-[16] flex items-center justify-between px-4 py-3 md:hidden pointer-events-none">
        <div className="flex items-center gap-2.5 pointer-events-auto">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg shadow-lg"
            style={{ background: 'linear-gradient(135deg,#F5A623,#FF6B35)', boxShadow: '0 4px 14px rgba(245,166,35,.45)' }}>
            🏍️
          </div>
          <div>
            <p className="text-white font-extrabold text-lg leading-none tracking-tight">jydo</p>
            <p className="text-white/40 text-[10px] mt-0.5">Hey {user?.name?.split(' ')[0] || 'Rider'} 👋</p>
          </div>
        </div>
        <div className="flex items-center gap-2 pointer-events-auto">
          {[
            { icon: User,   fn: () => navigate('/profile'),                               bg: 'rgba(255,255,255,.07)' },
            { icon: Clock,  fn: () => navigate('/rides/history'),                         bg: 'rgba(255,255,255,.07)' },
            { icon: LogOut, fn: () => { localStorage.clear(); navigate('/login'); },      bg: 'rgba(239,68,68,.12)' },
          ].map(({ icon: Ic, fn, bg }, i) => (
            <button key={i} onClick={fn}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90"
              style={{ background: bg, border: '1px solid rgba(255,255,255,.08)' }}>
              <Ic size={15} className={i === 2 ? 'text-red-400' : 'text-white/60'} />
            </button>
          ))}
        </div>
      </header>

      {/* ════ BOOKING PANEL ════ */}
      <div className="absolute inset-x-0 bottom-0 z-[16]
                      md:relative md:inset-auto md:bottom-auto md:z-auto
                      md:w-[420px] md:flex-shrink-0 md:flex md:flex-col md:h-full
                      pointer-events-none">
        <div className="pointer-events-auto md:flex md:flex-col md:h-full">

          {/* Desktop header */}
          <div className="hidden md:flex items-center justify-between px-5 py-4 shrink-0"
            style={{ background: 'rgba(10,12,20,.98)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg shadow-lg"
                style={{ background: 'linear-gradient(135deg,#F5A623,#FF6B35)' }}>
                🏍️
              </div>
              <div>
                <p className="text-white font-extrabold text-base leading-tight">jydo</p>
                <p className="text-white/40 text-[11px] mt-0.5">Hey {user?.name?.split(' ')[0] || 'Rider'} 👋</p>
              </div>
            </div>
            <div className="flex gap-1.5">
              {[
                { icon: Clock,  fn: () => navigate('/rides/history'), cls: 'text-white/60' },
                { icon: User,   fn: () => navigate('/profile'),       cls: 'text-white/60' },
                { icon: LogOut, fn: () => { localStorage.clear(); navigate('/login'); }, cls: 'text-red-400' },
              ].map(({ icon: Ic, fn, cls }, i) => (
                <button key={i} onClick={fn}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white/10"
                  style={{ background: i === 2 ? 'rgba(239,68,68,.1)' : 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.07)' }}>
                  <Ic size={15} className={cls} />
                </button>
              ))}
            </div>
          </div>

          {/* ── SEARCH PANEL ── */}
          {panel === 'search' && (
            <div className="panel-anim glass md:bg-transparent md:border-0 md:flex-1 md:flex md:flex-col rounded-t-3xl md:rounded-none"
              style={{ maxHeight: searchOpen ? '82dvh' : 'auto' }}>

              {/* Drag pill */}
              <div className="flex justify-center pt-3 md:hidden shrink-0">
                <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,.18)' }} />
              </div>

              <div className="p-5 flex flex-col gap-4 md:flex-1 md:overflow-y-auto">

                {/* Header row */}
                <div className="flex items-center justify-between shrink-0">
                  <div>
                    <h2 className="text-white font-bold text-xl tracking-tight">Where to? 🗺️</h2>
                    <p className="text-white/30 text-xs font-light mt-0.5">Book your ride in seconds</p>
                  </div>
                  <span className="flex items-center gap-1 text-amber-400/60 text-xs font-medium">
                    <Shield size={12} /> Safe rides
                  </span>
                </div>

                {/* Location error banner */}
                {locError && (
                  <div className="flex items-start gap-2.5 rounded-xl px-3 py-3 shrink-0"
                    style={{ background: 'rgba(248,113,113,.08)', border: '1px solid rgba(248,113,113,.2)' }}>
                    <MapPin size={14} className="text-red-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-red-300 text-xs font-semibold">{locError}</p>
                      <button onClick={detectLocation}
                        className="text-amber-400 text-xs font-bold mt-1 underline underline-offset-2">
                        Try again
                      </button>
                    </div>
                  </div>
                )}

                {/* Collapsed → destination pill */}
                {!searchOpen ? (
                  <button onClick={() => setSearchOpen(true)}
                    className="w-full flex items-center gap-3 rounded-2xl p-4 text-left transition-all active:scale-[.98]"
                    style={{ background: 'rgba(245,166,35,.06)', border: '1px solid rgba(245,166,35,.18)' }}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(245,166,35,.1)' }}>
                      <Search size={15} className="text-amber-400" />
                    </div>
                    <span className="flex-1 text-sm font-light truncate"
                      style={{ color: drop ? 'rgba(255,255,255,.8)' : 'rgba(255,255,255,.3)' }}>
                      {drop ? dropAddr : 'Search destination…'}
                    </span>
                    <ChevronRight size={16} className="text-white/20 shrink-0" />
                  </button>
                ) : (
                  /* Expanded → full inputs */
                  <div className="flex gap-3 shrink-0">
                    {/* Route connector */}
                    <div className="flex flex-col items-center pt-[46px] pb-[14px] shrink-0">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#22c55e', boxShadow: '0 0 8px rgba(34,197,94,.7)' }} />
                      <div className="w-px flex-1 my-1.5" style={{ background: 'linear-gradient(to bottom,rgba(34,197,94,.4),rgba(239,68,68,.4))' }} />
                      <div className="w-2.5 h-2.5 rounded" style={{ background: '#ef4444', boxShadow: '0 0 8px rgba(239,68,68,.7)' }} />
                    </div>

                    {/* Inputs */}
                    <div className="flex-1 flex flex-col gap-3 min-w-0">
                      <AddressInput
                        label="PICKUP"
                        value={locating ? 'Detecting your location…' : pickupAddr}
                        onChange={setPickupAddr}
                        onSelect={handlePickupSelect}
                        placeholder="Enter pickup location"
                        icon={Navigation2}
                        iconColor="green"
                        userLoc={pickup}
                      />
                      <AddressInput
                        label="DROP"
                        value={dropAddr}
                        onChange={setDropAddr}
                        onSelect={handleDropSelect}
                        placeholder="Where are you going?"
                        icon={MapPin}
                        iconColor="red"
                        autoFocus
                        userLoc={pickup}
                      />
                    </div>
                  </div>
                )}

                {/* CTA */}
                <button
                  onClick={() => { if (!searchOpen) setSearchOpen(true); else handleSearch(); }}
                  disabled={searchOpen && (!pickup || !drop)}
                  className={`w-full py-4 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 transition-all shrink-0
                    ${pickup && drop ? 'glow-btn' : ''}`}
                  style={!(pickup && drop)
                    ? { background: 'rgba(255,255,255,.05)', color: 'rgba(255,255,255,.3)', border: '1px solid rgba(255,255,255,.07)', cursor: 'not-allowed' }
                    : {}}>
                  <Search size={17} />
                  <span className="font-bold">{pickup && drop ? 'Find Rides' : 'Enter Destination'}</span>
                  {pickup && drop && <ChevronRight size={15} />}
                </button>

                {/* Trust pills */}
                <div className="flex items-center justify-center gap-3 text-white/20 text-[10px] font-light shrink-0 flex-wrap">
                  <span>🔒 Verified drivers</span><span>•</span>
                  <span>📍 Live tracking</span><span>•</span>
                  <span>⭐ Rated rides</span>
                </div>
              </div>
            </div>
          )}

          {/* ── VEHICLES PANEL ── */}
          {panel === 'vehicles' && (
            <div className="panel-anim glass md:bg-transparent md:border-0 md:flex-1 md:flex md:flex-col rounded-t-3xl md:rounded-none"
              style={{ maxHeight: '82dvh' }}>

              <div className="flex justify-center pt-3 md:hidden shrink-0">
                <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,.18)' }} />
              </div>

              {/* Header */}
              <div className="px-5 pt-4 pb-2 shrink-0">
                <div className="flex items-center justify-between mb-3">
                  <button onClick={() => { setPanel('search'); setSearchOpen(true); }}
                    className="flex items-center gap-1.5 text-white/50 hover:text-white text-sm transition-colors">
                    <ArrowLeft size={16} /> Back
                  </button>
                  <h2 className="text-white font-bold text-base">Choose Ride</h2>
                  <div className="w-14" />
                </div>

                {/* Route summary */}
                <div className="rounded-2xl p-3 flex items-center gap-3 mb-1"
                  style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)' }}>
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <div className="w-px h-3.5 my-1" style={{ background: 'linear-gradient(to bottom,rgba(34,197,94,.4),rgba(239,68,68,.4))' }} />
                    <div className="w-2 h-2 rounded-sm bg-red-400" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-[11px] text-white/40 truncate leading-5">{pickupAddr || 'Pickup'}</p>
                    <div className="w-full h-px my-1" style={{ background: 'rgba(255,255,255,.04)' }} />
                    <p className="text-[11px] text-white/40 truncate leading-5">{dropAddr || 'Destination'}</p>
                  </div>
                  {distance && (
                    <div className="text-right shrink-0 ml-2 pl-3" style={{ borderLeft: '1px solid rgba(255,255,255,.07)' }}>
                      <p className="text-amber-400 font-bold text-sm">{distance} km</p>
                      <p className="text-white/30 text-[10px] uppercase tracking-wider">{duration} min</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto px-5 pb-2">
                <div className="space-y-2.5 mb-5">
                  {VEHICLES.map(v => (
                    <button key={v.id} onClick={() => setSelectedVehicle(v.id)}
                      className="v-card w-full flex items-center gap-3.5 p-4 rounded-2xl text-left"
                      style={selectedVehicle === v.id
                        ? { background: 'rgba(245,166,35,.08)', border: '1.5px solid rgba(245,166,35,.4)', boxShadow: '0 4px 20px rgba(245,166,35,.08)' }
                        : { background: 'rgba(255,255,255,.02)', border: '1.5px solid rgba(255,255,255,.06)' }}>
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
                        style={{ background: selectedVehicle === v.id ? 'rgba(245,166,35,.12)' : 'rgba(255,255,255,.04)' }}>
                        {v.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-semibold text-[15px]">{v.label}</span>
                          {v.badge && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                              style={{ background: 'rgba(245,166,35,.15)', color: '#F5A623', border: '1px solid rgba(245,166,35,.2)' }}>
                              {v.badge}
                            </span>
                          )}
                        </div>
                        <span className="text-white/30 text-xs">{v.desc}</span>
                        <span className="text-green-400/70 text-[10px] font-semibold ml-2">· {v.eta}</span>
                      </div>
                      <div className="shrink-0 text-right">
                        {estimating
                          ? <div className="w-14 h-6 rounded-lg shimmer-box" />
                          : <span className="text-amber-400 font-black text-xl">₹{fares[v.id]}</span>
                        }
                      </div>
                    </button>
                  ))}
                </div>

                {/* Payment */}
                <div className="mb-4">
                  <p className="text-white/25 text-[10px] uppercase font-semibold tracking-widest mb-2.5">Payment Method</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'cash',   label: 'Cash',   icon: DollarSign },
                      { id: 'upi',    label: 'UPI',    icon: Zap },
                      { id: 'wallet', label: 'Wallet', icon: Wallet },
                    ].map(m => (
                      <button key={m.id} onClick={() => setPaymentMethod(m.id)}
                        className="flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-semibold transition-all"
                        style={paymentMethod === m.id
                          ? { background: 'rgba(245,166,35,.1)', border: '1px solid rgba(245,166,35,.35)', color: '#F5A623' }
                          : { background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)', color: 'rgba(255,255,255,.35)' }}>
                        <m.icon size={13} /> {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Book button */}
              {bookError && <p className="px-5 py-1.5 text-rose-400 text-xs text-center">{bookError}</p>}
              <div className="p-4 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,.06)' }}>
                <button disabled={booking || estimating} onClick={handleBook}
                  className={`w-full py-4 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 transition-all
                    ${!booking && !estimating ? 'glow-btn' : ''}`}
                  style={(booking || estimating) ? { background: 'rgba(255,255,255,.04)', color: 'rgba(255,255,255,.2)', cursor: 'not-allowed' } : {}}>
                  {booking ? (
                    <><div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(17,17,17,.3)', borderTopColor: '#111', animation: 'spin .8s linear infinite' }} /> Confirming…</>
                  ) : estimating ? (
                    <><div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,.2)', borderTopColor: 'rgba(255,255,255,.6)', animation: 'spin .8s linear infinite' }} /> Calculating fares…</>
                  ) : (
                    <>
                      Book {VEHICLES.find(v => v.id === selectedVehicle)?.icon} {VEHICLES.find(v => v.id === selectedVehicle)?.label}
                      <span style={{ color: 'rgba(17,17,17,.6)', fontWeight: 900, margin: '0 4px' }}>·</span>
                      <span style={{ fontWeight: 900 }}>₹{fares[selectedVehicle]}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return <HomeContent />;
}
