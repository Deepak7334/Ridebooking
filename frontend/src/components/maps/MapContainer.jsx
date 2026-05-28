import React, { useEffect, useRef } from 'react';
import { MapContainer as LeafletMapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// India bounds (approximate)
const INDIA_BOUNDS = [
  [6.5, 68.0], // Southwest
  [35.5, 97.5] // Northeast
];

// India center coordinates
const INDIA_CENTER = [20.5937, 78.9629];

// Default zoom level for India
const DEFAULT_ZOOM = 5;

// Component to handle location updates
const LocationMarker = ({ position, setPosition }) => {
  const map = useMap();
  
  useEffect(() => {
    if (position) {
      map.flyTo(position, 14, { animate: true });
    }
  }, [position, map]);
  
  return position ? (
    <Marker position={position}>
      <Popup>Your Location</Popup>
    </Marker>
  ) : null;
};

// Component to handle bounds
const BoundsHandler = ({ bounds }) => {
  const map = useMap();
  
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);
  
  return null;
};

const MapContainer = ({ 
  pickupLocation, 
  dropoffLocation, 
  userLocation, 
  onLocationSelect,
  showRoute = false 
}) => {
  const mapRef = useRef(null);

  // Custom pickup icon
  const pickupIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  // Custom dropoff icon
  const dropoffIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  // Calculate route between points (simple straight line for now)
  const getRouteCoordinates = () => {
    if (pickupLocation && dropoffLocation) {
      return [pickupLocation, dropoffLocation];
    }
    return [];
  };

  const routeCoords = getRouteCoordinates();

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden shadow-lg">
      <LeafletMapContainer
        ref={mapRef}
        center={INDIA_CENTER}
        zoom={DEFAULT_ZOOM}
        style={{ height: '100%', width: '100%' }}
        minZoom={4}
        maxBounds={INDIA_BOUNDS}
        maxBoundsViscosity={1.0}
      >
        {/* OpenStreetMap tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        {/* User location marker */}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={pickupIcon}>
            <Popup>Your Location</Popup>
          </Marker>
        )}
        
        {/* Pickup location marker */}
        {pickupLocation && (
          <Marker 
            position={pickupLocation} 
            icon={pickupIcon}
            eventHandlers={{
              click: () => onLocationSelect?.('pickup', pickupLocation),
            }}
          >
            <Popup>Pickup Location</Popup>
          </Marker>
        )}
        
        {/* Dropoff location marker */}
        {dropoffLocation && (
          <Marker 
            position={dropoffLocation} 
            icon={dropoffIcon}
            eventHandlers={{
              click: () => onLocationSelect?.('dropoff', dropoffLocation),
            }}
          >
            <Popup>Drop Location</Popup>
          </Marker>
        )}
        
        {/* Route polyline */}
        {showRoute && routeCoords.length === 2 && (
          <RoutePolyline positions={routeCoords} />
        )}
        
        {/* Map click handler for location selection */}
        <MapClickHandler onLocationSelect={onLocationSelect} />
      </LeafletMapContainer>
    </div>
  );
};

// Component to handle map clicks
const MapClickHandler = ({ onLocationSelect }) => {
  const map = useMap();
  
  useEffect(() => {
    const handleClick = (e) => {
      if (onLocationSelect) {
        const { lat, lng } = e.latlng;
        onLocationSelect('click', { lat, lng });
      }
    };
    
    map.on('click', handleClick);
    
    return () => {
      map.off('click', handleClick);
    };
  }, [map, onLocationSelect]);
  
  return null;
};

// Simple route polyline component
const RoutePolyline = ({ positions }) => {
  const map = useMap();
  
  useEffect(() => {
    if (positions.length === 2) {
      const polyline = L.polyline(positions, {
        color: '#4F46E5',
        weight: 4,
        opacity: 0.8,
        dashArray: '10, 10'
      }).addTo(map);
      
      // Fit bounds to show entire route
      map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
      
      return () => {
        map.removeLayer(polyline);
      };
    }
  }, [positions, map]);
  
  return null;
};

export default MapContainer;
