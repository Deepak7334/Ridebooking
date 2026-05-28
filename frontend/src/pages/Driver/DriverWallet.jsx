import React from 'react';
import { Wallet, ArrowDownCircle } from 'lucide-react';

const DriverWallet = () => {
  return (
    <div className="min-h-screen bg-[#0B0F19] text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black rounded-3xl p-8">
          <Wallet size={40} />
          <h1 className="text-5xl font-bold mt-4">₹12,500</h1>
          <p className="mt-2 font-medium">Wallet Balance</p>
        </div>

        <button className="mt-6 w-full bg-white/10 border border-white/10 py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-white/20 transition">
          <ArrowDownCircle size={20} /> Withdraw Money
        </button>
      </div>
    </div>
  );
};

export default DriverWallet;