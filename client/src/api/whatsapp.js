import { apiRequest } from '../lib/queryClient';

// API base URL fallback
const API_BASE_URL = import.meta.env.VITE_API_URL || (
  window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1')
    ? "http://localhost:5000"
    : "https://chatwave-64p3.onrender.com"
);

export const whatsappApi = {
  // Get QR code for WhatsApp authentication
  getQRCode: async () => {
    const response = await fetch(`${API_BASE_URL}/api/qr`);
    if (!response.ok) {
      throw new Error('Failed to fetch QR code');
    }
    return response.json();
  },

  // Check WhatsApp connection status
  getConnectionStatus: async () => {
    const response = await fetch(`${API_BASE_URL}/api/connection-status`);
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
    const response = await fetch(`${API_BASE_URL}/api/upload`, {
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
    const response = await fetch(`${API_BASE_URL}/api/message/${messageId}/status`);
    if (!response.ok) {
      throw new Error('Failed to get message status');
    }
    return response.json();
  },

  // Get all statuses for real-time updates
  getAllStatuses: async () => {
    const response = await fetch(`${API_BASE_URL}/api/statuses`);
    if (!response.ok) {
      throw new Error('Failed to get statuses');
    }
    return response.json();
  },

  // Get statistics
  getStatistics: async () => {
    const response = await fetch(`${API_BASE_URL}/api/statistics`);
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
