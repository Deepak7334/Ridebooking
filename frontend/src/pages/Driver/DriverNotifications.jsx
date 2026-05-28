import React from 'react';
import { Bell } from 'lucide-react';

const notifications = [
  'New ride request available',
  'You earned ₹500 incentive',
  'Your profile is verified',
];

const DriverNotifications = () => {
  return (
    <div className="min-h-screen bg-[#0B0F19] text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Notifications</h1>

        <div className="space-y-4">
          {notifications.map((item, index) => (
            <div
              key={index}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center gap-4"
            >
              <Bell className="text-yellow-400" />
              <p>{item}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DriverNotifications;