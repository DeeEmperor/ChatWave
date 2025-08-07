import QRCodeBox from '../components/QRCodeBox';
import MessageForm from '../components/MessageForm';
import UploadForm from '../components/UploadForm';
import StatusArea from '../components/StatusArea';
import SendingProgress from '../components/SendingProgress';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useToast } from '../hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  MessageSquare, 
  BarChart3, 
  Settings, 
  RefreshCw, 
  Zap, 
  Shield, 
  Users,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Activity
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

export default function Home() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
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

  const clearStatsMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/clear-statistics'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/statistics'] });
      toast({
        title: "Statistics Cleared",
        description: "All message statistics have been reset.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to clear statistics. Please try again.",
        variant: "destructive",
      });
    },
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

  const successRate = statistics?.total > 0 
    ? Math.round((statistics.successful / statistics.total) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-green-400/20 to-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-purple-400/10 to-pink-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]"></div>
      </div>
      
      <div className="relative z-10">
      {/* Enhanced Header */}
      <header className="bg-gradient-to-r from-white/90 via-blue-50/90 to-purple-50/90 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50 shadow-lg shadow-blue-500/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  ChatWave
                </h1>
                <p className="text-sm text-gray-600 font-medium">WhatsApp Bulk Message Platform</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                <Activity className="w-3 h-3 mr-1" />
                System Online
              </Badge>
              <div className="text-sm text-gray-600 hidden sm:block">
                API: {import.meta.env.VITE_API_URL || (
                  window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1')
                    ? "localhost:5000"
                    : "https://chatwave-64p3.onrender.com"
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Main Content Area */}
          <div className="xl:col-span-3 space-y-8">
            <MessageForm />
            <UploadForm />
            <StatusArea />
          </div>

          {/* Enhanced Sidebar */}
          <div className="xl:col-span-1 space-y-6">
            <QRCodeBox />
            
            {/* Enhanced Statistics Card */}
            <Card className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 shadow-xl shadow-blue-500/10 border-blue-200/30 relative overflow-hidden">
              <div className="absolute inset-0 bg-dots-pattern opacity-[0.02]"></div>
              <div className="relative z-10">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                  </div>
                  Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {statistics?.total || 0}
                    </div>
                    <div className="text-xs text-gray-600 uppercase tracking-wide">Total</div>
                  </div>
                  <div className="text-center p-3 bg-emerald-50 rounded-lg">
                    <div className="text-2xl font-bold text-emerald-600">
                      {statistics?.successful || 0}
                    </div>
                    <div className="text-xs text-emerald-600 uppercase tracking-wide">Success</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {statistics?.failed || 0}
                    </div>
                    <div className="text-xs text-red-600 uppercase tracking-wide">Failed</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {successRate}%
                    </div>
                    <div className="text-xs text-blue-600 uppercase tracking-wide">Rate</div>
                  </div>
                </div>

                <Separator />

                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-gray-600"
                  onClick={() => clearStatsMutation.mutate()}
                  disabled={clearStatsMutation.isPending}
                >
                  {clearStatsMutation.isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Clearing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Clear Statistics
                    </>
                  )}
                </Button>
              </CardContent>
              </div>
            </Card>

            {/* Enhanced Settings Card */}
            <Card className="bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 shadow-xl shadow-purple-500/10 border-purple-200/30 relative overflow-hidden">
              <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]"></div>
              <div className="relative z-10">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Settings className="w-5 h-5 text-purple-600" />
                  </div>
                  Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-500" />
                        Auto-retry failed messages
                      </label>
                      <p className="text-xs text-gray-500">Automatically retry sending failed messages</p>
                    </div>
                    <Switch
                      checked={settings.autoRetry}
                      onCheckedChange={(checked) => updateSetting('autoRetry', checked)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-green-500" />
                        Send delivery reports
                      </label>
                      <p className="text-xs text-gray-500">Receive notifications when messages are delivered</p>
                    </div>
                    <Switch
                      checked={settings.deliveryReports}
                      onCheckedChange={(checked) => updateSetting('deliveryReports', checked)}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-500" />
                      Max retry attempts
                    </label>
                    <Select 
                      value={settings.maxRetryAttempts.toString()}
                      onValueChange={(value) => updateSetting('maxRetryAttempts', parseInt(value))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 attempt</SelectItem>
                        <SelectItem value="3">3 attempts</SelectItem>
                        <SelectItem value="5">5 attempts</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
              </div>
            </Card>
          </div>
        </div>
      </div>
      </div>
      
      {/* Floating Progress Indicator */}
      <SendingProgress />
    </div>
  );
}
