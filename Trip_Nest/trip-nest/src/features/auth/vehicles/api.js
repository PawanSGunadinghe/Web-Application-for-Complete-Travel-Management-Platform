// src/features/auth/vehicles/api.js
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

export function getAllVehicles() { 
  return request("/vehicles"); 
}

export function getVehicleById(id) {
  return request(`/vehicles/${id}`);
}
