import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Inbox,
  TrendingUp,
  Phone,
  MessageSquare
} from 'lucide-react';

export default function StatusArea() {
  const [currentMessageId, setCurrentMessageId] = useState(null);

  const { data: statusData } = useQuery({
    queryKey: ['/api/statuses'],
    refetchInterval: 2000,
  });

  const { data: messageStatus } = useQuery({
    queryKey: ['/api/message', currentMessageId, 'status'],
    enabled: !!currentMessageId,
    refetchInterval: 1000,
  });

  useEffect(() => {
    // Get the latest message ID from localStorage or API
    const latestMessageId = localStorage.getItem('latestMessageId');
    if (latestMessageId) {
      setCurrentMessageId(parseInt(latestMessageId));
    }
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return <CheckCircle2 className="w-4 h-4 text-white" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-white" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-white" />;
      default:
        return <Clock className="w-4 h-4 text-white" />;
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'sent':
        return {
          bgColor: 'bg-emerald-50 border-emerald-200',
          badgeColor: 'bg-emerald-500',
          textColor: 'text-emerald-900',
          descColor: 'text-emerald-700',
          timeColor: 'text-emerald-600',
          text: 'Successfully delivered'
        };
      case 'failed':
        return {
          bgColor: 'bg-red-50 border-red-200',
          badgeColor: 'bg-red-500',
          textColor: 'text-red-900',
          descColor: 'text-red-700',
          timeColor: 'text-red-600',
          text: 'Failed to deliver'
        };
      case 'pending':
        return {
          bgColor: 'bg-blue-50 border-blue-200',
          badgeColor: 'bg-blue-500',
          textColor: 'text-blue-900',
          descColor: 'text-blue-700',
          timeColor: 'text-blue-600',
          text: 'Queued for sending'
        };
      default:
        return {
          bgColor: 'bg-gray-50 border-gray-200',
          badgeColor: 'bg-gray-500',
          textColor: 'text-gray-900',
          descColor: 'text-gray-700',
          timeColor: 'text-gray-600',
          text: 'Unknown status'
        };
    }
  };

  const progress = messageStatus?.progress || { total: 0, sent: 0, failed: 0, pending: 0 };
  const progressPercentage = progress.total > 0 ? ((progress.sent + progress.failed) / progress.total) * 100 : 0;
  const isActive = progress.pending > 0 || progressPercentage > 0;

  // Calculate recent activity
  const recentActivity = statusData?.filter(status => {
    const messageTime = new Date(status.timestamp);
    const now = new Date();
    const diffMinutes = (now - messageTime) / (1000 * 60);
    return diffMinutes <= 30; // Last 30 minutes
  }) || [];

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const getPhoneDisplay = (phone) => {
    // Format phone number for display
    if (phone.startsWith('+')) {
      return phone;
    }
    return `+${phone}`;
  };

  return (
    <Card className="bg-gradient-to-br from-white via-green-50/20 to-emerald-50/20 shadow-xl shadow-green-500/10 border-green-200/30 relative overflow-hidden">
      <div className="absolute inset-0 bg-wave-pattern opacity-[0.02]"></div>
      <div className="relative z-10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-800">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-green-600" />
          </div>
          Message Status
        </CardTitle>
        
        {isActive && (
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
              LIVE: Sending Messages
            </Badge>
            <Badge variant="outline" className="text-xs">
              <MessageSquare className="w-3 h-3 mr-1" />
              {progress.sent} sent, {progress.failed} failed, {progress.pending} pending
            </Badge>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Progress Section */}
        {progress.total > 0 && (
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium text-gray-700">Campaign Progress</span>
              <span className="text-gray-600">
                {progress.sent + progress.failed}/{progress.total} processed
              </span>
            </div>
            
            <div className="space-y-2">
              <Progress value={progressPercentage} className="h-2" />
              
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center p-2 bg-emerald-50 rounded">
                  <div className="font-semibold text-emerald-700">{progress.sent}</div>
                  <div className="text-emerald-600">Sent</div>
                </div>
                <div className="text-center p-2 bg-red-50 rounded">
                  <div className="font-semibold text-red-700">{progress.failed}</div>
                  <div className="text-red-600">Failed</div>
                </div>
                <div className="text-center p-2 bg-blue-50 rounded">
                  <div className="font-semibold text-blue-700">{progress.pending}</div>
                  <div className="text-blue-600">Pending</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {progress.total > 0 && <Separator />}

        {/* Recent Activity */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">Recent Activity</h3>
            {recentActivity.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {recentActivity.length} update{recentActivity.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          <ScrollArea className="h-64">
            <div className="space-y-2">
              {statusData && statusData.length > 0 ? (
                statusData
                  .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                  .slice(0, 20)
                  .map((status, index) => {
                    const config = getStatusConfig(status.status);
                    return (
                      <div 
                        key={index} 
                        className={`flex items-start gap-3 p-3 rounded-lg border transition-all duration-200 ${config.bgColor}`}
                      >
                        <div className={`w-6 h-6 ${config.badgeColor} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                          {getStatusIcon(status.status)}
                        </div>
                        
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between">
                            <p className={`text-sm font-medium ${config.textColor} flex items-center gap-1`}>
                              <Phone className="w-3 h-3" />
                              {getPhoneDisplay(status.phoneNumber)}
                            </p>
                            <span className={`text-xs ${config.timeColor}`}>
                              {formatTime(status.timestamp)}
                            </span>
                          </div>
                          
                          <p className={`text-xs ${config.descColor}`}>
                            {config.text}
                          </p>
                          
                          {status.errorMessage && (
                            <div className="bg-red-100 border border-red-200 rounded p-2 mt-2">
                              <p className="text-xs text-red-700 flex items-start gap-1">
                                <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                {status.errorMessage}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Inbox className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-sm font-medium mb-1">No message activity yet</p>
                  <p className="text-xs text-gray-400">
                    Send your first bulk message to see status updates here
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
      </div>
    </Card>
  );
}
