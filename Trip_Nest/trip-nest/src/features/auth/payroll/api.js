// src/features/auth/payroll/api.js
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

export function listEmployees() { return request("/payroll/employees"); }
export function listSalaries() { return request("/payroll/salaries"); }
export function getSalary(id) { return request(`/payroll/salaries/${id}`); }
export function createSalary(payload, { type } = {}) {
  return request("/payroll/salaries", { method: "POST", body: payload, params: type ? { type } : undefined });
}
export function updateSalary(id, payload, { type } = {}) {
  return request(`/payroll/salaries/${id}`, { method: "PUT", body: payload, params: type ? { type } : undefined });
}
export function deleteSalary(id) { return request(`/payroll/salaries/${id}`, { method: "DELETE" }); }

export const PayrollAPI = { listEmployees, listSalaries, getSalary, createSalary, updateSalary, deleteSalary };
export default PayrollAPI;

// Finance
export function getFinanceSummary(params) {
  // Always fetch all-time summary unless a custom 'from' is provided
  const defaultFrom = "1970-01-01";
  const mergedParams = { from: defaultFrom, ...(params || {}) };
  return request(`/finance/summary`, { params: mergedParams });
}
export function listFinanceExpenses(params) { return request(`/finance/expenses`, { params }); }