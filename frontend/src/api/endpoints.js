// Authentication endpoints
export const AUTH_ENDPOINTS = {
  REGISTER: '/auth/register',
  LOGIN: '/auth/login',
  OTP_SEND: '/auth/otp/send',
  OTP_VERIFY: '/auth/otp/verify',
  LOGOUT: '/auth/logout',
  PROFILE: '/auth/profile',
  ME: '/auth/me',
};

// Ride endpoints
export const RIDE_ENDPOINTS = {
  CREATE_RIDE: '/rides/create',
  GET_RIDE: '/rides/:rideId',
  CANCEL_RIDE: '/rides/:rideId/cancel',
  ACCEPT_RIDE: '/rides/:rideId/accept',
  START_RIDE: '/rides/:rideId/start',
  COMPLETE_RIDE: '/rides/:rideId/complete',
  RATE_RIDE: '/rides/:rideId/rate',
  UPDATE_LOCATION: '/rides/:rideId/location',
  NEARBY_DRIVERS: '/rides/nearby-drivers',
  ESTIMATE_FARE: '/rides/estimate-fare',
  HISTORY: '/rides/user/history',
  AVAILABLE_RIDES: '/rides/driver/available',
};

// Driver endpoints
export const DRIVER_ENDPOINTS = {
  PROFILE: '/driver/profile',
  AVAILABILITY: '/driver/availability',
  LOCATION: '/driver/location',
  UPLOAD_DOCS: '/driver/documents',
  EARNINGS: '/driver/earnings',
  AVAILABLE_RIDES: '/driver/available-rides',
};

// Admin endpoints
export const ADMIN_ENDPOINTS = {
  STATS: '/admin/stats',
  ALL_USERS: '/admin/users',
  ALL_DRIVERS: '/admin/drivers',
  ALL_RIDES: '/admin/rides',
  APPROVE_DRIVER: '/admin/drivers/:id/approve',
  REJECT_DRIVER: '/admin/drivers/:id/reject',
  TOGGLE_USER: '/admin/users/:id/toggle',
};

export default { AUTH_ENDPOINTS, RIDE_ENDPOINTS, DRIVER_ENDPOINTS, ADMIN_ENDPOINTS };
