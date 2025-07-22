import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export default function MessageForm() {
  const [message, setMessage] = useState('');
  const [delay, setDelay] = useState(6);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sendMessagesMutation = useMutation({
    mutationFn: async (data) => {
      return apiRequest('POST', '/api/send', data);
    },
    onSuccess: () => {
      toast({
        title: "Messages Queued",
        description: "Your bulk messages have been queued for sending.",
      });
      
      // Clear form and phone numbers
      setMessage('');
      localStorage.removeItem('phoneNumbers');
      
      // Trigger refresh of other components
      queryClient.invalidateQueries({ queryKey: ['/api/statuses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/statistics'] });
      
      // Force refresh of upload form to clear numbers display
      window.dispatchEvent(new Event('phoneNumbersCleared'));
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send messages",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!message.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }

    if (delay < 6) {
      toast({
        title: "Error", 
        description: "Minimum delay is 6 seconds",
        variant: "destructive",
      });
      return;
    }

    // Get phone numbers from localStorage or context
    const phoneNumbers = JSON.parse(localStorage.getItem('phoneNumbers') || '[]');
    
    if (!phoneNumbers || phoneNumbers.length === 0) {
      toast({
        title: "Error",
        description: "Please add phone numbers first",
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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
          <i className="fas fa-comment-alt text-blue-600"></i>
        </div>
        <h2 className="text-lg font-semibold text-gray-900">Compose Message</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Message Content</label>
          <textarea 
            rows="6" 
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-whatsapp focus:border-transparent resize-none transition-all duration-200" 
            placeholder="Type your bulk message here... You can use personalization like {name} for dynamic content."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message Delay (seconds)</label>
            <input 
              type="number" 
              min="6" 
              value={delay}
              onChange={(e) => setDelay(parseInt(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-whatsapp focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Minimum 6 seconds required</p>
          </div>
          <div className="flex items-end">
            <button 
              type="submit"
              disabled={sendMessagesMutation.isPending}
              className="w-full bg-whatsapp hover:bg-whatsapp-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              {sendMessagesMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane"></i>
                  <span>Send Messages</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
