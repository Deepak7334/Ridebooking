import React from 'react';
import {
  Phone,
  MessageCircle,
  ShieldAlert,
} from 'lucide-react';

const DriverSupport = () => {
  return (
    <div className="min-h-screen bg-[#0B0F19] text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Support Center</h1>

        <div className="grid md:grid-cols-3 gap-5">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 text-center">
            <Phone className="mx-auto text-green-400" size={40} />
            <h2 className="text-xl font-bold mt-4">Call Support</h2>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 text-center">
            <MessageCircle className="mx-auto text-blue-400" size={40} />
            <h2 className="text-xl font-bold mt-4">Live Chat</h2>
          </div>

          <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-6 text-center">
            <ShieldAlert className="mx-auto text-red-400" size={40} />
            <h2 className="text-xl font-bold mt-4">Emergency SOS</h2>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverSupport;