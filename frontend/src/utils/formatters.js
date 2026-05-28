import { CURRENCY, DATE_FORMATS } from './constants';

// Format currency
export const formatCurrency = (amount, currency = CURRENCY.CODE) => {
  if (amount === null || amount === undefined) return '';
  
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);

  return formatted;
};

// Format currency with symbol
export const formatCurrencyWithSymbol = (amount) => {
  if (amount === null || amount === undefined) return '';
  return `${CURRENCY.SYMBOL}${amount.toFixed(2)}`;
};

// Format date
export const formatDate = (date, format = DATE_FORMATS.DISPLAY) => {
  if (!date) return '';
  
  const d = new Date(date);
  
  if (isNaN(d.getTime())) return '';
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleString('en-IN', { month: 'short' });
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  switch (format) {
    case DATE_FORMATS.DISPLAY:
      return `${day} ${month} ${year}`;
    case DATE_FORMATS.TIME:
      return `${hours}:${minutes}`;
    case DATE_FORMATS.DATETIME:
      return `${day} ${month} ${year}, ${hours}:${minutes}`;
    case DATE_FORMATS.ISO:
      return d.toISOString();
    default:
      return `${day} ${month} ${year}`;
  }
};

// Format relative time
export const formatRelativeTime = (date) => {
  if (!date) return '';
  
  const now = new Date();
  const d = new Date(date);
  const diffMs = now - d;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHour < 24) return `${diffHour} hr ago`;
  if (diffDay < 7) return `${diffDay} day ago`;
  
  return formatDate(date, DATE_FORMATS.DISPLAY);
};

// Format distance
export const formatDistance = (meters) => {
  if (meters === null || meters === undefined) return '';
  
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  
  return `${(meters / 1000).toFixed(1)} km`;
};

// Format duration
export const formatDuration = (seconds) => {
  if (seconds === null || seconds === undefined) return '';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours} hr ${minutes} min`;
  }
  
  return `${minutes} min`;
};

// Format phone number
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  
  return phone;
};

// Format ride status
export const formatRideStatus = (status) => {
  const statusMap = {
    searching: 'Searching for driver',
    'driver-assigned': 'Driver assigned',
    arriving: 'Driver arriving',
    'in-progress': 'Ride in progress',
    completed: 'Ride completed',
    cancelled: 'Ride cancelled',
  };
  
  return statusMap[status] || status;
};

// Format vehicle type
export const formatVehicleType = (type) => {
  const vehicleMap = {
    car: 'Car',
    bike: 'Bike',
    auto: 'Auto',
  };
  
  return vehicleMap[type] || type;
};

// Truncate text
export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};

// Format ride ID
export const formatRideId = (id) => {
  if (!id) return '';
  return `#${id.slice(-6).toUpperCase()}`;
};

// Parse address components
export const parseAddress = (address) => {
  if (!address) return { area: '', city: '', state: '', pincode: '' };
  
  const parts = address.split(',').map(p => p.trim());
  
  return {
    full: address,
    area: parts[0] || '',
    city: parts[parts.length - 3] || '',
    state: parts[parts.length - 2] || '',
    pincode: parts[parts.length - 1] || '',
  };
};

export default {
  formatCurrency,
  formatCurrencyWithSymbol,
  formatDate,
  formatRelativeTime,
  formatDistance,
  formatDuration,
  formatPhoneNumber,
  formatRideStatus,
  formatVehicleType,
  truncateText,
  formatRideId,
  parseAddress,
};
