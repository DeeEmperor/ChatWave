import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

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
        return <i className="fas fa-check text-white text-xs"></i>;
      case 'failed':
        return <i className="fas fa-times text-white text-xs"></i>;
      case 'pending':
        return <i className="fas fa-clock text-white text-xs"></i>;
      default:
        return <i className="fas fa-clock text-white text-xs"></i>;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent':
        return 'bg-green-50 border-green-200';
      case 'failed':
        return 'bg-red-50 border-red-200';
      case 'pending':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'sent':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'pending':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'sent':
        return 'Message sent successfully';
      case 'failed':
        return 'Failed to send message';
      case 'pending':
        return 'Waiting to send...';
      default:
        return 'Unknown status';
    }
  };

  const getStatusTextColor = (status) => {
    switch (status) {
      case 'sent':
        return 'text-green-900';
      case 'failed':
        return 'text-red-900';
      case 'pending':
        return 'text-blue-900';
      default:
        return 'text-gray-900';
    }
  };

  const getStatusDescColor = (status) => {
    switch (status) {
      case 'sent':
        return 'text-green-700';
      case 'failed':
        return 'text-red-700';
      case 'pending':
        return 'text-blue-700';
      default:
        return 'text-gray-700';
    }
  };

  const getStatusTimeColor = (status) => {
    switch (status) {
      case 'sent':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'pending':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const progress = messageStatus?.progress || { total: 0, sent: 0, failed: 0, pending: 0 };
  const progressPercentage = progress.total > 0 ? ((progress.sent + progress.failed) / progress.total) * 100 : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
          <i className="fas fa-chart-line text-green-600"></i>
        </div>
        <h2 className="text-lg font-semibold text-gray-900">Sending Status</h2>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span>
            {progress.sent + progress.failed}/{progress.total} messages processed
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-whatsapp h-2 rounded-full transition-all duration-500" 
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Status Messages */}
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {statusData && statusData.length > 0 ? (
          statusData
            .filter(status => status.status !== 'pending') // Hide pending messages
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 10)
            .map((status, index) => (
              <div key={index} className={`flex items-start space-x-3 p-3 rounded-lg border ${getStatusColor(status.status)}`}>
                <div className={`w-5 h-5 ${getStatusBadgeColor(status.status)} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  {getStatusIcon(status.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${getStatusTextColor(status.status)}`}>
                    {status.phoneNumber}
                  </p>
                  <p className={`text-xs ${getStatusDescColor(status.status)}`}>
                    {getStatusText(status.status)}
                  </p>
                  {status.errorMessage && (
                    <p className="text-xs text-red-600 mt-1">{status.errorMessage}</p>
                  )}
                  <p className={`text-xs ${getStatusTimeColor(status.status)} mt-1`}>
                    {new Date(status.timestamp).toLocaleString()}
                  </p>
                </div>
                {status.status === 'pending' && (
                  <div className="w-16">
                    <div className="w-full bg-blue-200 rounded-full h-1">
                      <div className="bg-blue-500 h-1 rounded-full transition-all duration-1000 animate-pulse" style={{ width: '50%' }}></div>
                    </div>
                  </div>
                )}
              </div>
            ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <i className="fas fa-inbox text-3xl mb-2 text-gray-300"></i>
            <p>No messages sent yet</p>
            <p className="text-sm">Status updates will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}
