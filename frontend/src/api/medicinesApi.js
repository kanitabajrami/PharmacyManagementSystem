// src/api/medicinesApi.js

// const API_BASE = "https://localhost:7201";

const API_BASE = import.meta.env.VITE_API_BASE;

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (res.status === 204) return null;

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new Error(data?.message || `Request failed (${res.status})`);
  }

  return data;
}

// ---- your existing exports ----
export async function getAllMedicines() {
  return apiFetch("/api/medicines");
}

export async function getLowStock(threshold = 10) {
  return apiFetch(`/api/medicines/low-stock?threshold=${threshold}`);
}

export async function getExpiringSoon(days = 30) {
  return apiFetch(`/api/medicines/expiring-soon?days=${days}`);
}

export async function searchMedicines(query = {}) {
  const params = new URLSearchParams(query).toString();
  return apiFetch(`/api/medicines/search?${params}`);
}

export async function createMedicine(data) {
  return apiFetch("/api/medicines", { method: "POST", body: JSON.stringify(data) });
}

export async function updateMedicine(id, data) {
  return apiFetch(`/api/medicines/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function deleteMedicine(id) {
  return apiFetch(`/api/medicines/${id}`, { method: "DELETE" });
}
