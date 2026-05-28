import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axios';
import { UserPlus, Upload, License, FileText, Camera, Loader2 } from 'lucide-react';

const DriverRegistration = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    vehicleType: 'auto',
    vehicleNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [files, setFiles] = useState({
    license: null,
    rc: null,
    insurance: null,
    profilePhoto: null
  });

  const vehicleTypes = [
    { id: 'auto', name: 'Auto Rickshaw' },
    { id: 'bike', name: 'Bike' },
    { id: 'car', name: 'Car' }
  ];

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    const field = e.target.name;
    setFiles({
      ...files,
      [field]: e.target.files[0]
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.phone || !formData.password || !formData.name) {
      setError('Please fill all fields');
      return;
    }

    if (Object.values(files).every(file => !file)) {
      setError('Please upload at least license and RC');
      return;
    }

    setLoading(true);
    setError('');

    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    Object.keys(files).forEach(key => {
      if (files[key]) {
        data.append(key, files[key]);
      }
    });

    try {
      const response = await axiosInstance.post('/api/driver/register', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      alert(response.data.message);
      navigate('/driver/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-8 px-4">
      <div className="max-w-md mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white text-center">
          <UserPlus size={64} className="mx-auto mb-4 opacity-90" />
          <h1 className="text-3xl font-bold mb-2">Become a Driver</h1>
          <p className="opacity-90">Join Rapido and start earning</p>
        </div>

        {/* Form */}
        <div className="p-8">
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-2xl mb-6 border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Create Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                required
              />
            </div>

            {/* Vehicle Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Type</label>
                <select
                  name="vehicleType"
                  value={formData.vehicleType}
                  onChange={handleInputChange}
                  className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {vehicleTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Number</label>
                <input
                  type="text"
                  name="vehicleNumber"
                  value={formData.vehicleNumber}
                  onChange={handleInputChange}
                  className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  placeholder="DL01AB1234"
                />
              </div>
            </div>

            {/* Documents Upload */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-gray-800 mt-8 mb-4 border-b pb-2">Upload Documents</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <label className="block text-sm font-medium text-gray-700">
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-indigo-400 hover:bg-indigo-50 transition-all cursor-pointer">
                    <License size={32} className="mx-auto mb-2 text-gray-400" />
                    <div className="text-sm text-gray-600 mb-1">License</div>
                    <input
                      type="file"
                      name="license"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                  {files.license && <p className="text-xs text-green-600 mt-2">✅ License selected</p>}
                </label>
                <label className="block text-sm font-medium text-gray-700">
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-indigo-400 hover:bg-indigo-50 transition-all cursor-pointer">
                    <FileText size={32} className="mx-auto mb-2 text-gray-400" />
                    <div className="text-sm text-gray-600 mb-1">RC Book</div>
                    <input
                      type="file"
                      name="rc"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                  {files.rc && <p className="text-xs text-green-600 mt-2">✅ RC selected</p>}
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="block text-sm font-medium text-gray-700">
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-indigo-400 hover:bg-indigo-50 transition-all cursor-pointer">
                    <FileText size={32} className="mx-auto mb-2 text-gray-400" />
                    <div className="text-sm text-gray-600 mb-1">Insurance</div>
                    <input
                      type="file"
                      name="insurance"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                  {files.insurance && <p className="text-xs text-green-600 mt-2">✅ Insurance selected</p>}
                </label>
                <label className="block text-sm font-medium text-gray-700">
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-indigo-400 hover:bg-indigo-50 transition-all cursor-pointer">
                    <Camera size={32} className="mx-auto mb-2 text-gray-400" />
                    <div className="text-sm text-gray-600 mb-1">Profile Photo</div>
                    <input
                      type="file"
                      name="profilePhoto"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                  {files.profilePhoto && <p className="text-xs text-green-600 mt-2">✅ Photo selected</p>}
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Registering...
                </>
              ) : (
                'Register as Driver & Upload Documents'
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Documents will be verified by admin within 24 hours</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverRegistration;

