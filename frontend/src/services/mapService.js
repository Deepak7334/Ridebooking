// Google Maps API service helpers

class MapService {
  constructor() {
    this.geocoder = null;
    this.placesService = null;
    this.directionsService = null;
    this.directionsRenderer = null;
  }

  // Initialize services
  initialize(map) {
    if (window.google && window.google.maps) {
      this.geocoder = new window.google.maps.Geocoder();
      this.directionsService = new window.google.maps.DirectionsService();
      this.directionsRenderer = new window.google.maps.DirectionsRenderer({
        map,
        suppressMarkers: true,
        preserveViewport: true,
      });
      
      if (map) {
        this.placesService = new window.google.maps.places.PlacesService(map);
      }
    }
  }

  // Geocode an address to coordinates
  geocodeAddress(address) {
    return new Promise((resolve, reject) => {
      if (!this.geocoder) {
        reject(new Error('Geocoder not initialized'));
        return;
      }

      this.geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK' && results[0]) {
          resolve({
            lat: results[0].geometry.location.lat(),
            lng: results[0].geometry.location.lng(),
            address: results[0].formatted_address,
          });
        } else {
          reject(new Error(`Geocoding failed: ${status}`));
        }
      });
    });
  }

  // Reverse geocode coordinates to address
  reverseGeocode(lat, lng) {
    return new Promise((resolve, reject) => {
      if (!this.geocoder) {
        reject(new Error('Geocoder not initialized'));
        return;
      }

      const latlng = { lat: parseFloat(lat), lng: parseFloat(lng) };

      this.geocoder.geocode({ location: latlng }, (results, status) => {
        if (status === 'OK' && results[0]) {
          resolve({
            address: results[0].formatted_address,
            placeId: results[0].place_id,
          });
        } else {
          reject(new Error(`Reverse geocoding failed: ${status}`));
        }
      });
    });
  }

  // Calculate route between two points
  calculateRoute(origin, destination, travelMode = 'DRIVING') {
    return new Promise((resolve, reject) => {
      if (!this.directionsService) {
        reject(new Error('Directions service not initialized'));
        return;
      }

      const request = {
        origin,
        destination,
        travelMode: window.google.maps.TravelMode[travelMode],
        unitSystem: window.google.maps.UnitSystem.METRIC,
        optimizeWaypoints: true,
      };

      this.directionsService.route(request, (result, status) => {
        if (status === 'OK') {
          resolve(result);
        } else {
          reject(new Error(`Directions request failed: ${status}`));
        }
      });
    });
  }

  // Display route on map
  displayRoute(origin, destination, travelMode = 'DRIVING') {
    return this.calculateRoute(origin, destination, travelMode)
      .then((result) => {
        if (this.directionsRenderer) {
          this.directionsRenderer.setDirections(result);
        }
        return result;
      });
  }

  // Clear displayed routes
  clearRoutes() {
    if (this.directionsRenderer) {
      this.directionsRenderer.setDirections({ routes: [] });
    }
  }

  // Get distance matrix
  getDistanceMatrix(origins, destinations, travelMode = 'DRIVING') {
    return new Promise((resolve, reject) => {
      if (!window.google || !window.google.maps) {
        reject(new Error('Google Maps API not loaded'));
        return;
      }

      const service = new window.google.maps.DistanceMatrixService();
      service.getDistanceMatrix(
        {
          origins,
          destinations,
          travelMode: window.google.maps.TravelMode[travelMode],
          unitSystem: window.google.maps.UnitSystem.METRIC,
        },
        (response, status) => {
          if (status === 'OK') {
            resolve(response);
          } else {
            reject(new Error(`Distance matrix failed: ${status}`));
          }
        }
      );
    });
  }

  // Search for places (autocomplete)
  searchPlaces(query, bounds = null) {
    return new Promise((resolve, reject) => {
      if (!this.placesService) {
        reject(new Error('Places service not initialized'));
        return;
      }

      const request = {
        query,
        fields: ['name', 'geometry', 'formatted_address', 'place_id'],
      };

      if (bounds) {
        request.locationBias = bounds;
      }

      this.placesService.findPlaceFromQuery(request, (results, status) => {
        if (status === 'OK' && results) {
          resolve(results);
        } else {
          reject(new Error(`Place search failed: ${status}`));
        }
      });
    });
  }

  // Get current location
  getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }

  // Create marker on map
  createMarker(map, position, options = {}) {
    if (!window.google || !window.google.maps) {
      return null;
    }

    return new window.google.maps.Marker({
      position,
      map,
      ...options,
    });
  }

  // Create info window
  createInfoWindow(content) {
    if (!window.google || !window.google.maps) {
      return null;
    }

    return new window.google.maps.InfoWindow({
      content,
    });
  }
}

export default new MapService();
