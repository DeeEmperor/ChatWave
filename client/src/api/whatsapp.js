import { apiRequest } from '../lib/queryClient';

export const whatsappApi = {
  // Get QR code for WhatsApp authentication
  getQRCode: async () => {
    const response = await fetch('/api/qr');
    if (!response.ok) {
      throw new Error('Failed to fetch QR code');
    }
    return response.json();
  },

  // Check WhatsApp connection status
  getConnectionStatus: async () => {
    const response = await fetch('/api/connection-status');
    if (!response.ok) {
      throw new Error('Failed to check connection status');
    }
    return response.json();
  },

  // Send bulk messages
  sendMessages: async (messageData) => {
    return apiRequest('POST', '/api/send', messageData);
  },

  // Upload CSV file
  uploadCSV: async (formData) => {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      throw new Error('Failed to upload CSV');
    }
    return response.json();
  },

  // Get message status
  getMessageStatus: async (messageId) => {
    const response = await fetch(`/api/message/${messageId}/status`);
    if (!response.ok) {
      throw new Error('Failed to get message status');
    }
    return response.json();
  },

  // Get all statuses for real-time updates
  getAllStatuses: async () => {
    const response = await fetch('/api/statuses');
    if (!response.ok) {
      throw new Error('Failed to get statuses');
    }
    return response.json();
  },

  // Get statistics
  getStatistics: async () => {
    const response = await fetch('/api/statistics');
    if (!response.ok) {
      throw new Error('Failed to get statistics');
    }
    return response.json();
  },

  // Clear statistics
  clearStatistics: async () => {
    return apiRequest('POST', '/api/clear-statistics');
  },
};
