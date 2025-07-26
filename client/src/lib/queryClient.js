// import { QueryClient } from "@tanstack/react-query";

// // API base URL - this is for render
// const API_BASE_URL = import.meta.env.VITE_API_URL;

// export const queryClient = new QueryClient({
//   defaultOptions: {
//     queries: {
//       queryFn: async ({ queryKey }) => {
//         const url = queryKey[0].startsWith("/")
//           ? `${API_BASE_URL}${queryKey[0]}`
//           : queryKey[0];
//         const response = await fetch(url);
//         if (!response.ok) {
//           throw new Error("Network response was not ok");
//         }
//         return response.json();
//       },
//     },
//   },
// });

// export async function apiRequest(method, url, data) {
//   const fullUrl = url.startsWith("/") ? `${API_BASE_URL}${url}` : url;

//   const config = {
//     method,
//     headers: {
//       "Content-Type": "application/json",
//     },
//   };

//   if (data) {
//     config.body = JSON.stringify(data);
//   }

//   const response = await fetch(fullUrl, config);

//   if (!response.ok) {
//     const errorData = await response.json().catch(() => ({}));
//     throw new Error(errorData.error || "Request failed");
//   }

//   return response.json();
// }
const BASE_URL = import.meta.env.VITE_API_URL || "";

const fetchFromApi = async (endpoint, options = {}) => {
  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  if (!response.ok) throw new Error(`Request to ${endpoint} failed`);
  return response.json();
};

export const whatsappApi = {
  getQRCode: () => fetchFromApi("/api/qr"),
  getConnectionStatus: () => fetchFromApi("/api/connection-status"),
  sendMessages: (messageData) =>
    fetchFromApi("/api/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(messageData),
    }),
  uploadCSV: (formData) =>
    fetchFromApi("/api/upload", {
      method: "POST",
      body: formData,
    }),
  getMessageStatus: (messageId) =>
    fetchFromApi(`/api/message/${messageId}/status`),
  getAllStatuses: () => fetchFromApi("/api/statuses"),
  getStatistics: () => fetchFromApi("/api/statistics"),
  clearStatistics: () =>
    fetchFromApi("/api/clear-statistics", { method: "POST" }),
};
