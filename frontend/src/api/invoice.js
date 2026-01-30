// import { apiFetch } from "./client";

// export const InvoicesApi = {
//   getAll: () => apiFetch("/api/invoices"),                          // [Authorize]
//   getById: (id) => apiFetch(`/api/invoices/${id}`),                 // [Authorize]
//   getByUser: (userId) => apiFetch(`/api/invoices/user/${userId}`),  // [Authorize(Roles="Admin")]
//   getByRange: (start, end) =>
//     apiFetch(`/api/invoices/range?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`), // Admin
//   create: (payload) =>
//     apiFetch("/api/invoices", {
//       method: "POST",
//       body: JSON.stringify(payload),
//     }), // [Authorize(Roles="User")]
// };
