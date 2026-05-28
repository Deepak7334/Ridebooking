// Application constants

// Vehicle types
export const VEHICLE_TYPES = {
  CAR: 'car',
  BIKE: 'bike',
  AUTO: 'auto',
};

export const VEHICLE_NAMES = {
  [VEHICLE_TYPES.CAR]: 'Car',
  [VEHICLE_TYPES.BIKE]: 'Bike',
  [VEHICLE_TYPES.AUTO]: 'Auto',
};

// Ride status codes
export const RIDE_STATUS = {
  SEARCHING: 'searching',
  DRIVER_ASSIGNED: 'driver-assigned',
  ARRIVING: 'arriving',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

// Payment methods
export const PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
  WALLET: 'wallet',
};

// API timeout values
export const API_TIMEOUT = {
  DEFAULT: 10000,
  UPLOAD: 60000,
  SOCKET: 30000,
};

// Map default values
export const MAP_DEFAULTS = {
  DEFAULT_CENTER: { lat: 12.9716, lng: 77.5946 }, // Bangalore
  DEFAULT_ZOOM: 14,
  MIN_ZOOM: 10,
  MAX_ZOOM: 20,
};

// Socket events
export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  DRIVER_LOCATION: 'driver-location',
  RIDE_STATUS: 'ride-status',
  DRIVER_ACCEPTED: 'driver-accepted',
  DRIVER_ARRIVED: 'driver-arrived',
  RIDE_STARTED: 'ride-started',
  RIDE_COMPLETED: 'ride-completed',
  ERROR: 'error',
};

// App routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  OTP_VERIFY: '/verify-otp',
  RIDE_HISTORY: '/ride-history',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  WALLET: '/wallet',
  PAYMENT_METHODS: '/payment-methods',
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 50,
};

// Date formats
export const DATE_FORMATS = {
  DISPLAY: 'DD MMM YYYY',
  TIME: 'HH:mm',
  DATETIME: 'DD MMM YYYY, HH:mm',
  ISO: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
};

// Currency
export const CURRENCY = {
  SYMBOL: '₹',
  CODE: 'INR',
};

export default {
  VEHICLE_TYPES,
  VEHICLE_NAMES,
  RIDE_STATUS,
  PAYMENT_METHODS,
  API_TIMEOUT,
  MAP_DEFAULTS,
  SOCKET_EVENTS,
  ROUTES,
  PAGINATION,
  DATE_FORMATS,
  CURRENCY,
};
