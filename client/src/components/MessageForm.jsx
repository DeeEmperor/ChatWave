import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  MessageSquare, 
  Send, 
  Clock, 
  Users, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Type,
  Timer
} from 'lucide-react';

export default function MessageForm() {
  const [message, setMessage] = useState('');
  const [delay, setDelay] = useState(6);
  const [phoneNumbers, setPhoneNumbers] = useState([]);
  const [characterCount, setCharacterCount] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load phone numbers from localStorage
  useEffect(() => {
    const loadPhoneNumbers = () => {
      const numbers = JSON.parse(localStorage.getItem('phoneNumbers') || '[]');
      setPhoneNumbers(numbers);
    };

    loadPhoneNumbers();
    window.addEventListener('phoneNumbersCleared', loadPhoneNumbers);
    window.addEventListener('storage', loadPhoneNumbers);

    return () => {
      window.removeEventListener('phoneNumbersCleared', loadPhoneNumbers);
      window.removeEventListener('storage', loadPhoneNumbers);
    };
  }, []);

  // Update character count
  useEffect(() => {
    setCharacterCount(message.length);
  }, [message]);

  const sendMessagesMutation = useMutation({
    mutationFn: async (data) => {
      return apiRequest('POST', '/api/send', data);
    },
    onSuccess: (data) => {
      toast({
        title: "Messages Queued Successfully!",
        description: `${phoneNumbers.length} messages have been queued for sending.`,
      });
      
      // Store campaign info for progress tracking
      if (data?.messageId) {
        localStorage.setItem('latestMessageId', data.messageId.toString());
        localStorage.setItem('campaignStartTime', Date.now().toString());
      }
      
      // Clear form and phone numbers
      setMessage('');
      localStorage.removeItem('phoneNumbers');
      setPhoneNumbers([]);
      
      // Trigger refresh of other components
      queryClient.invalidateQueries({ queryKey: ['/api/statuses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/statistics'] });
      
      // Force refresh of upload form to clear numbers display
      window.dispatchEvent(new Event('phoneNumbersCleared'));
    },
    onError: (error) => {
      toast({
        title: "Failed to Send Messages",
        description: error.message || "An error occurred while queuing messages",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!message.trim()) {
      toast({
        title: "Message Required",
        description: "Please enter a message to send",
        variant: "destructive",
      });
      return;
    }

    if (delay < 6) {
      toast({
        title: "Invalid Delay", 
        description: "Minimum delay is 6 seconds to prevent spam",
        variant: "destructive",
      });
      return;
    }

    if (!phoneNumbers || phoneNumbers.length === 0) {
      toast({
        title: "No Recipients",
        description: "Please add phone numbers before sending messages",
        variant: "destructive",
      });
      return;
    }

    sendMessagesMutation.mutate({
      content: message,
      delay: delay,
      phoneNumbers: phoneNumbers,
    });
  };

  const estimatedTime = Math.ceil((phoneNumbers.length * delay) / 60); // in minutes
  const messageType = characterCount <= 160 ? 'SMS' : characterCount <= 1600 ? 'Long SMS' : 'Very Long';

  return (
    <Card className="bg-gradient-to-br from-white via-indigo-50/20 to-purple-50/20 shadow-xl shadow-indigo-500/10 border-indigo-200/30 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]"></div>
      <div className="relative z-10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-800">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-blue-600" />
          </div>
          Compose Message
        </CardTitle>
        <div className="flex flex-wrap gap-2 mt-3">
          <Badge variant="outline" className="text-xs">
            <Users className="w-3 h-3 mr-1" />
            {phoneNumbers.length} recipient{phoneNumbers.length !== 1 ? 's' : ''}
          </Badge>
          {phoneNumbers.length > 0 && (
            <Badge variant="outline" className="text-xs">
              <Timer className="w-3 h-3 mr-1" />
              ~{estimatedTime} min{estimatedTime !== 1 ? 's' : ''} to complete
            </Badge>
          )}
          <Badge variant="outline" className="text-xs">
            <Type className="w-3 h-3 mr-1" />
            {characterCount} chars ({messageType})
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="message" className="text-sm font-medium text-gray-700">
              Message Content
            </Label>
            <Textarea 
              id="message"
              placeholder="Type your bulk message here...&#10;&#10;💡 Tips:&#10;• Keep it personal and relevant&#10;• Use {name} for personalization&#10;• Stay under 160 characters for best delivery"
              className="min-h-[120px] text-sm leading-relaxed resize-none"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>
                {characterCount > 160 && (
                  <span className="text-amber-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Long message may split into multiple parts
                  </span>
                )}
              </span>
              <span className={characterCount > 160 ? 'text-amber-600' : 'text-gray-500'}>
                {characterCount}/1600 characters
              </span>
            </div>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="delay" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                Message Delay
              </Label>
              <Input 
                id="delay"
                type="number" 
                min="6" 
                max="300"
                value={delay}
                onChange={(e) => setDelay(Math.max(6, parseInt(e.target.value) || 6))}
                className="text-sm"
              />
              <p className="text-xs text-gray-500">
                Seconds between each message (min: 6, max: 300)
              </p>
            </div>
            
            <div className="flex flex-col justify-end">
              <Button 
                type="submit"
                disabled={sendMessagesMutation.isPending || phoneNumbers.length === 0 || !message.trim()}
                className={`w-full bg-green-600 hover:bg-green-700 text-white shadow-md ${
                  sendMessagesMutation.isPending ? 'animate-pulse' : ''
                }`}
                size="lg"
              >
                {sendMessagesMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Queueing Messages...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send to {phoneNumbers.length} Contact{phoneNumbers.length !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
              
              {phoneNumbers.length === 0 && (
                <p className="text-xs text-amber-600 mt-2 text-center flex items-center justify-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Add phone numbers first to enable sending
                </p>
              )}
            </div>
          </div>

          {phoneNumbers.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Ready to Send</p>
                  <p>
                    Your message will be sent to <strong>{phoneNumbers.length}</strong> contact{phoneNumbers.length !== 1 ? 's' : ''} 
                    with a <strong>{delay}-second</strong> delay between each message.
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Estimated completion time: ~{estimatedTime} minute{estimatedTime !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
          )}
        </form>
      </CardContent>
      </div>
    </Card>
  );
}
