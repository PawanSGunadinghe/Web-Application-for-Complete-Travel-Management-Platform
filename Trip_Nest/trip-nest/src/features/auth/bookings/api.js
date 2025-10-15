// src/features/auth/bookings/api.js
const API_BASE = (process.env.REACT_APP_API_URL || "http://localhost:4000/api").replace(/\/+$/, "");

async function request(path, { method = "GET", headers = {}, body, params } = {}) {
  const url = new URL(API_BASE + path);
  if (params && typeof params === "object") {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
    });
  }
  const res = await fetch(url.toString(), {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
  return data;
}

export function getAllBookings() { 
  return request("/bookings/all"); 
}

export function getBookingsByDateRange(startDate, endDate) {
  return request("/bookings/all", {
    params: { startDate, endDate }
  });
}

export function getBookingStats() {
  return request("/bookings/stats");
}
