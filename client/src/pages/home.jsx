import QRCodeBox from '../components/QRCodeBox';
import MessageForm from '../components/MessageForm';
import UploadForm from '../components/UploadForm';
import StatusArea from '../components/StatusArea';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useToast } from '../hooks/use-toast';

export default function Home() {
  const { toast } = useToast();
  
  // Settings state
  const [settings, setSettings] = useState({
    autoRetry: true,
    deliveryReports: false,
    maxRetryAttempts: 3
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('whatsappSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('whatsappSettings', JSON.stringify(settings));
  }, [settings]);

  const { data: statistics } = useQuery({
    queryKey: ['/api/statistics'],
    refetchInterval: 5000,
  });

  const updateSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    
    toast({
      title: "Settings Updated",
      description: `${key.replace(/([A-Z])/g, ' $1').toLowerCase()} has been ${value ? 'enabled' : 'disabled'}`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-whatsapp rounded-lg flex items-center justify-center">
                <i className="fab fa-whatsapp text-white text-xl"></i>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">ChatWave</h1>
                <p className="text-sm text-gray-500">WhatsApp Bulk Message Sender</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span>Connected to localhost:5000</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            <MessageForm />
            <UploadForm />
            <StatusArea />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <QRCodeBox />
            
            {/* Statistics Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-chart-bar text-purple-600"></i>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Statistics</h2>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Messages</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {statistics?.total || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Successful</span>
                  <span className="text-lg font-semibold text-green-600">
                    {statistics?.successful || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Failed</span>
                  <span className="text-lg font-semibold text-red-600">
                    {statistics?.failed || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Success Rate</span>
                  <span className="text-lg font-semibold text-blue-600">
                    {statistics?.successRate || 0}%
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <button className="w-full text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200">
                  <i className="fas fa-refresh mr-2"></i>
                  Clear Statistics
                </button>
              </div>
            </div>

            {/* Settings Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-cog text-gray-600"></i>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Auto-retry failed messages</span>
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="sr-only" 
                      checked={settings.autoRetry}
                      onChange={(e) => updateSetting('autoRetry', e.target.checked)}
                    />
                    <div 
                      className={`w-10 h-6 ${settings.autoRetry ? 'bg-whatsapp' : 'bg-gray-300'} rounded-full shadow-inner relative cursor-pointer`}
                      onClick={() => updateSetting('autoRetry', !settings.autoRetry)}
                    >
                      <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow transform transition-transform ${settings.autoRetry ? 'translate-x-4' : ''}`}></div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Send delivery reports</span>
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="sr-only" 
                      checked={settings.deliveryReports}
                      onChange={(e) => updateSetting('deliveryReports', e.target.checked)}
                    />
                    <div 
                      className={`w-10 h-6 ${settings.deliveryReports ? 'bg-whatsapp' : 'bg-gray-300'} rounded-full shadow-inner relative cursor-pointer`}
                      onClick={() => updateSetting('deliveryReports', !settings.deliveryReports)}
                    >
                      <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow transform transition-transform ${settings.deliveryReports ? 'translate-x-4' : ''}`}></div>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Max retry attempts</label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-whatsapp focus:border-transparent"
                    value={settings.maxRetryAttempts}
                    onChange={(e) => updateSetting('maxRetryAttempts', parseInt(e.target.value))}
                  >
                    <option value="1">1 attempt</option>
                    <option value="3">3 attempts</option>
                    <option value="5">5 attempts</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
