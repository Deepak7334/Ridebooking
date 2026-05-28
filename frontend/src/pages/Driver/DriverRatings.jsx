import React from 'react';
import { Star } from 'lucide-react';

const DriverRatings = () => {
  return (
    <div className="min-h-screen bg-[#0B0F19] text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto text-center">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-10">
          <Star className="mx-auto text-yellow-400" size={60} />

          <h1 className="text-6xl font-bold mt-5">4.9</h1>

          <p className="text-white/50 mt-3">
            Excellent Driver Rating
          </p>

          <div className="mt-10 space-y-4 text-left">
            <div className="bg-white/5 rounded-2xl p-4">
              ⭐ Great driving experience
            </div>

            <div className="bg-white/5 rounded-2xl p-4">
              ⭐ Very polite and safe driving
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverRatings;