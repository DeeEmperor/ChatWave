import { QueryClient } from "@tanstack/react-query";

// API base URL - this is for render
const API_BASE_URL = import.meta.env.VITE_API_URL || (
  window.location.hostname === 'localhost' 
    ? "http://localhost:5000"
    : "https://chatwave-64p3.onrender.com"
);

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const url = queryKey[0].startsWith("/")
          ? `${API_BASE_URL}${queryKey[0]}`
          : queryKey[0];
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      },
    },
  },
});

export async function apiRequest(method, url, data) {
  const fullUrl = url.startsWith("/") ? `${API_BASE_URL}${url}` : url;

  const config = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(fullUrl, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Request failed");
  }

  return response.json();
}
