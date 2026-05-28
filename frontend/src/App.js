import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import { RideProvider } from './context/RideContext';
import { AuthProvider } from './context/AuthContext';

// Auth
import Signup from './pages/Auth/Signup';
import Login from './pages/Auth/Login';

// Customer
import Home from './pages/Home/Home';
import ConfirmRide from './pages/Ride/ConfirmRide';
import LookingForDriver from './pages/Ride/LookingForDriver';
import LiveTracking from './pages/Ride/LiveTracking';
import PublicTracking from './pages/Ride/PublicTracking';
import RideCompleted from './pages/Ride/RideCompleted';
import RideHistory from './pages/History/RideHistory';
import Profile from './pages/Profile/Profile';

// Driver
import DriverDashboard from './pages/Driver/DriverDashboard';
import DriverDocuments from './pages/Driver/DriverDocuments';
import DriverProfile from './pages/Driver/DriverProfile';
import DriverEarnings from './pages/Driver/DriverEarnings';
import DriverRideHistory from './pages/Driver/DriverRideHistory';
import DriverWallet from './pages/Driver/DriverWallet';
import DriverNotifications from './pages/Driver/DriverNotifications';
import DriverRatings from './pages/Driver/DriverRatings';
import DriverBottomNav from './pages/Driver/DriverBottomNav';
import DriverSupport from './pages/Driver/DriverSupport';


// Admin
import AdminDashboard from './pages/Admin/AdminDashboard';

const RequireAuth = ({ children, role }) => {
  const token = localStorage.getItem('authToken');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!token) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/login" replace />;
  return children;
};

const App = () => (
  <AuthProvider>
    <SocketProvider>
      <RideProvider>
        <BrowserRouter>
          {/* Full viewport responsive shell */}
          <div style={{ width: '100%', minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: '#0a0c10' }}>

            <Routes>
              <Route path="/" element={<Navigate to="/login" />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/track/:rideId" element={<PublicTracking />} />

              {/* Customer */}
              <Route path="/home" element={<RequireAuth><Home /></RequireAuth>} />
              <Route path="/ride/confirm" element={<RequireAuth><ConfirmRide /></RequireAuth>} />
              <Route path="/ride/searching" element={<RequireAuth><LookingForDriver /></RequireAuth>} />
              <Route path="/ride/tracking" element={<RequireAuth><LiveTracking /></RequireAuth>} />
              <Route path="/ride/completed" element={<RequireAuth><RideCompleted /></RequireAuth>} />
              <Route path="/rides/history" element={<RequireAuth><RideHistory /></RequireAuth>} />
              <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />

              {/* Driver */}
              <Route path="/driver" element={<RequireAuth role="driver"><DriverDashboard /></RequireAuth>} />
              <Route path="/driver/documents" element={<RequireAuth role="driver"><DriverDocuments /></RequireAuth>} />
              <Route path="/driver/profile" element={<RequireAuth role="driver"><DriverProfile /></RequireAuth>} />
              <Route path="/driver/earnings" element={<RequireAuth role="driver"><DriverEarnings /></RequireAuth>} />
              <Route path="/driver/history" element={<RequireAuth role="driver"><DriverRideHistory /></RequireAuth>} />
              <Route path="/driver/wallet" element={<RequireAuth role="driver"><DriverWallet /></RequireAuth>} />
              <Route path="/driver/notifications" element={<RequireAuth role="driver"><DriverNotifications /></RequireAuth>} />
              <Route path="/driver/ratings" element={<RequireAuth role="driver"><DriverRatings /></RequireAuth>} />
              <Route path="/driver/support" element={<RequireAuth role="driver"><DriverSupport /></RequireAuth>} />


              {/* Admin */}
              <Route path="/admin" element={<RequireAuth role="admin"><AdminDashboard /></RequireAuth>} />

              <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
          </div>
        </BrowserRouter>
      </RideProvider>
    </SocketProvider>
  </AuthProvider>
);

export default App;
