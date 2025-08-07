import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Send, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Zap,
  Pause,
  Play,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';

export default function SendingProgress() {
  const [isVisible, setIsVisible] = useState(false);
  const [lastProgress, setLastProgress] = useState(null);

  const { data: statusData } = useQuery({
    queryKey: ['/api/statuses'],
    refetchInterval: 1000, // More frequent updates during sending
  });

  // Calculate current sending progress
  const currentProgress = useMemo(() => {
    if (!statusData || statusData.length === 0) return null;

    // Get recent messages (last 5 minutes)
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const recentMessages = statusData.filter(status => {
      const messageTime = new Date(status.timestamp).getTime();
      return messageTime >= fiveMinutesAgo;
    });

    if (recentMessages.length === 0) return null;

    // Group by potential campaign (similar timestamps)
    const campaigns = {};
    recentMessages.forEach(msg => {
      const minute = Math.floor(new Date(msg.timestamp).getTime() / (60 * 1000));
      if (!campaigns[minute]) {
        campaigns[minute] = [];
      }
      campaigns[minute].push(msg);
    });

    // Get the most recent campaign
    const latestCampaign = Object.values(campaigns)
      .sort((a, b) => new Date(b[0].timestamp) - new Date(a[0].timestamp))[0];

    if (!latestCampaign) return null;

    const total = latestCampaign.length;
    const sent = latestCampaign.filter(msg => msg.status === 'sent').length;
    const failed = latestCampaign.filter(msg => msg.status === 'failed').length;
    const pending = latestCampaign.filter(msg => msg.status === 'pending').length;
    const completed = sent + failed;

    return {
      total,
      sent,
      failed,
      pending,
      completed,
      isActive: pending > 0,
      successRate: total > 0 ? Math.round((sent / completed) * 100) || 0 : 0,
      progress: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }, [statusData]);

  // Show/hide progress based on activity
  useEffect(() => {
    if (currentProgress?.isActive) {
      setIsVisible(true);
      setLastProgress(currentProgress);
    } else if (currentProgress?.completed > 0 && !currentProgress?.isActive) {
      // Keep visible for 5 seconds after completion
      setTimeout(() => {
        setIsVisible(false);
        setLastProgress(null);
      }, 5000);
    }
  }, [currentProgress]);

  const progress = currentProgress || lastProgress;

  if (!isVisible || !progress) return null;

  const estimatedTimeLeft = progress.pending > 0 ? Math.ceil(progress.pending * 6 / 60) : 0; // 6 seconds per message

  return (
    <Card className="fixed bottom-6 right-6 w-96 bg-gradient-to-br from-white via-blue-50/90 to-indigo-50/90 shadow-2xl shadow-blue-500/20 border-blue-200/50 z-50 card-hover">
      <div className="absolute inset-0 bg-dots-pattern opacity-5"></div>
      <div className="relative z-10">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              {progress.isActive ? (
                <>
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <Send className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-blue-900">Sending Messages</span>
                </>
              ) : (
                <>
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-green-900">Campaign Complete</span>
                </>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
            >
              ×
            </Button>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Main Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-700">
                {progress.completed} of {progress.total} messages
              </span>
              <span className="text-gray-600">{progress.progress}%</span>
            </div>
            <Progress 
              value={progress.progress} 
              className="h-3"
            />
          </div>

          {/* Status Breakdown */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 bg-green-50 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <CheckCircle2 className="w-3 h-3 text-green-600" />
                <span className="text-xs font-medium text-green-700">Sent</span>
              </div>
              <div className="text-lg font-bold text-green-700">{progress.sent}</div>
            </div>

            <div className="text-center p-2 bg-red-50 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <XCircle className="w-3 h-3 text-red-600" />
                <span className="text-xs font-medium text-red-700">Failed</span>
              </div>
              <div className="text-lg font-bold text-red-700">{progress.failed}</div>
            </div>

            <div className="text-center p-2 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock className="w-3 h-3 text-blue-600" />
                <span className="text-xs font-medium text-blue-700">Pending</span>
              </div>
              <div className="text-lg font-bold text-blue-700">{progress.pending}</div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-3 h-3" />
              <span>Success Rate: {progress.successRate}%</span>
            </div>
            {progress.isActive && estimatedTimeLeft > 0 && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>~{estimatedTimeLeft}m left</span>
              </div>
            )}
          </div>

          {/* Live Status */}
          {progress.isActive && (
            <div className="flex items-center justify-center gap-2 text-xs text-blue-600 bg-blue-50 rounded-lg py-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span>Sending in progress...</span>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-500"></div>
            </div>
          )}

          {!progress.isActive && progress.completed > 0 && (
            <div className="flex items-center justify-center gap-2 text-xs text-green-600 bg-green-50 rounded-lg py-2">
              <CheckCircle2 className="w-3 h-3" />
              <span>Campaign completed successfully!</span>
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  );
}
