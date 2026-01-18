// src/components/AdminDashboard.jsx
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

/* ================= API FETCH ================= */
const API_BASE = "https://localhost:7201";

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(text || `Request failed (${res.status})`);
  }

  // Handle empty responses (DELETE, etc.)
  if (!text) return null;

  return JSON.parse(text);
}

function get(obj, ...keys) {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return undefined;
}

function money(x) {
  const n = Number(x || 0);
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "EUR" }).format(n);
}

function parseRoles() {
  try {
    const raw = localStorage.getItem("roles");
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) return parsed;
    if (typeof parsed === "string") return [parsed];
    return [];
  } catch {
    return [];
  }
}

function decodeJwtName(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return (
      payload?.name ||
      payload?.unique_name ||
      payload?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ||
      payload?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] ||
      "Admin"
    );
  } catch {
    return "Admin";
  }
}

/* ================= TABS ================= */
const TABS = [
  { id: "medicines", label: "Medicines" },
  { id: "invoices", label: "Invoices" },
  { id: "prescriptions", label: "Prescriptions" },
  { id: "suppliers", label: "Suppliers" },
];

/* ================= COMPONENT ================= */
export default function AdminDashboard() {
  const navigate = useNavigate();

  const [tab, setTab] = useState("medicines");
  const [displayName, setDisplayName] = useState("Admin");
  const roles = useMemo(() => parseRoles(), []);
  const isAdmin = roles.includes("Admin");
  
  // Global error
  const [error, setError] = useState("");

  // ===== Medicines state =====
  const [medLoading, setMedLoading] = useState(true);
  const [medicines, setMedicines] = useState([]);
  const [medQueryName, setMedQueryName] = useState("");
  const [medQueryCategory, setMedQueryCategory] = useState("");
  const [inStockOnly, setInStockOnly] = useState(true);
  const [sort, setSort] = useState("name_asc"); // name_asc | price_asc | price_desc
  const [viewMode, setViewMode] = useState("all"); // all | low | expiring
  const [medToDelete, setMedToDelete] = useState(null); // medicine ID to delete
  const [newMed, setNewMed] = useState({name: "", category: "", supplierId: "", price: "", quantity: "", expirationDate: ""});
  const [medCreating, setMedCreating] = useState(false);

  // ===== Invoices state =====
  const [invLoading, setInvLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [invoiceUserId, setInvoiceUserId] = useState("");
  const [invoiceStart, setInvoiceStart] = useState("");
  const [invoiceEnd, setInvoiceEnd] = useState("");

    // ===== Prescriptions state =====
  const [rxLoading, setRxLoading] = useState(true);              // Loading state for prescription list
  const [prescriptions, setPrescriptions] = useState([]);        // List of prescriptions
  const [newPrescription, setNewPrescription] = useState({ patientId: "", patientName: "", doctorName: "", medicines: [],});
  const [missingMedicines, setMissingMedicines] = useState([]); // List of missing medicines
  const [rxCreating, setRxCreating] = useState(false);          // Loading state for creating prescription


  // ===== Suppliers state =====
  const [supLoading, setSupLoading] = useState(true);
  const [suppliers, setSuppliers] = useState([]);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [supToAdd, setSupToAdd] = useState(null); // object for new supplier
  const [supToUpdate, setSupToUpdate] = useState(null); // object for supplier updates
  const [supToDelete, setSupToDelete] = useState(null); // supplier ID to delete

  /* ===== LOGOUT ===== */
  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("roles");
    navigate("/login");
  }

  // ===== FUNCTIONS =====
  async function createMedicine() {
    const dtoBody = {
      Name: newMed.name?.trim(),
      Category: newMed.category?.trim(),
      Price: Number(newMed.price),
      Quantity: Number(newMed.quantity),
      BatchNumber: newMed.batchNumber?.trim(),
      ExpiryDate: newMed.expiryDate ? new Date(newMed.expiryDate).toISOString() : null,
      SupplierId: Number(newMed.supplierId),
    };

    // Basic frontend validation
    if (!dtoBody.Name || !dtoBody.Category || !dtoBody.Price || !dtoBody.Quantity ||
        !dtoBody.BatchNumber || !dtoBody.ExpiryDate || !dtoBody.SupplierId) {
      return alert("Please fill in all fields correctly.");
    }

    setMedCreating(true);
    try {
      await apiFetch("/api/medicines", {
        method: "POST",
        body: JSON.stringify(dtoBody),
      });

      alert("Medicine added successfully!");

      // Reset form
      setNewMed({
        name: "",
        category: "",
        price: "",
        quantity: "",
        batchNumber: "",
        expiryDate: "",
        supplierId: "",
      });

      loadMedicinesAll();
    } catch (e) {
      console.error("Failed POST /api/medicines:", e);
      alert(e.message || "Failed to add medicine.");
    } finally {
      setMedCreating(false);
    }
  }

  async function deleteMedicine(id) {
    if (!window.confirm("Are you sure you want to delete this medicine?")) return;

    try {
      await apiFetch(`/api/medicines/${id}`, {
        method: "DELETE",
      });

      alert("Medicine deleted successfully!");
      // Reload medicines list after deletion
      loadMedicinesAll();
    } catch (e) {
      console.error("Failed DELETE /api/medicines:", e);
      alert(e.message || "Failed to delete medicine.");
    }
  }

  async function createPrescription() {
    setRxCreating(true);
    try {
      if (newPrescription.medicines.length === 0) {
        alert("You must add at least one medicine.");
        return;
      }

      // Remove duplicates by MedicineId
      const uniqueMedicines = newPrescription.medicines.filter(
        (v, i, a) => a.findIndex((x) => x.medicineId === v.medicineId) === i
      );

      const dto = { ...newPrescription, medicines: uniqueMedicines };

      await apiFetch("/api/Prescription", {
        method: "POST",
        body: JSON.stringify(dto),
      });

      alert("Prescription added successfully!");

      // Reset form
      setNewPrescription({
        patientId: "",
        patientName: "",
        doctorName: "",
        medicines: [{ medicineId: "", quantity: 1 }],
      });

      // Refresh list and missing medicines
      await loadPrescriptionsAll();
      await loadMissingMedicines();
    } catch (e) {
      console.error("Failed POST /api/Prescription:", e);
      alert(e.message || "Failed to add prescription.");
    } finally {
      setRxCreating(false);
    }
  }

  async function deletePrescription(id) {
    if (!confirm("Delete this prescription?")) return;

    try {
      await apiFetch(`/api/Prescription/${id}`, {
        method: "DELETE",
      });
      await loadPrescriptionsAll();
    } catch (err) {
      alert(err.message);
    }
  }
  
  /* ================= LOADERS ================= */
  async function loadMedicinesAll() {
    setMedLoading(true);
    setError("");
    try {
      const data = await apiFetch("/api/medicines");
      setMedicines(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Failed to load medicines.");
    } finally {
      setMedLoading(false);
    }
  }

  async function loadMedicinesLow() {
    setMedLoading(true);
    setError("");
    try {
      const data = await apiFetch("/api/medicines/low-stock?threshold=10");
      setMedicines(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Failed to load low stock medicines.");
    } finally {
      setMedLoading(false);
    }
  }

  async function loadMedicinesExpiring() {
    setMedLoading(true);
    setError("");
    try {
      const data = await apiFetch("/api/medicines/expiring-soon?days=30");
      setMedicines(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Failed to load expiring medicines.");
    } finally {
      setMedLoading(false);
    }
  }

  async function loadInvoices() {
    setInvLoading(true);
    setError("");
    try {
      const data = await apiFetch("/api/invoices");
      setInvoices(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Failed to load invoices.");
    } finally {
      setInvLoading(false);
    }
  }

  async function loadInvoicesByUser(userId) {
    if (!userId) return;
    setInvLoading(true);
    try {
      const data = await apiFetch(`/api/invoices/user/${userId}`);
      setInvoices(data || []);
    } finally {
      setInvLoading(false);
    }
  }

  async function loadInvoicesByDateRange(start, end) {
    if (!start || !end) return;
    setInvLoading(true);
    try {
      const data = await apiFetch(
        `/api/invoices/range?start=${start}&end=${end}`
      );
      setInvoices(data || []);
    } finally {
      setInvLoading(false);
    }
  }

  async function loadPrescriptionsAll() {
    setRxLoading(true);
    setError("");
    try {
      const data = await apiFetch("/api/Prescription");
      setPrescriptions(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Failed to load prescriptions.");
    } finally {
      setRxLoading(false);
    }
  }

  async function loadMissingMedicines() {
    try {
      const data = await apiFetch("/api/Prescription/missing-medicines");
      setMissingMedicines(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err.message);
    }
  }

  const showMissingMedicines = async () => {
    await loadMissingMedicines();
      setViewMode("missing"); // Optional: track the view mode
  };

  async function loadSuppliers() {
    setSupLoading(true);
    setError("");
    try {
      const data = await apiFetch("/api/suppliers");
      setSuppliers(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Failed to load suppliers.");
    } finally {
      setSupLoading(false);
    }
  }

  async function searchMedicines() {
    setMedLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (medQueryName.trim()) params.set("name", medQueryName.trim());
      if (medQueryCategory.trim()) params.set("category", medQueryCategory.trim());

      const data = await apiFetch(`/api/medicines/search?${params.toString()}`);
      setMedicines(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Search failed.");
    } finally {
      setMedLoading(false);
    }
  }

  /* ================= INIT ================= */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    setDisplayName(String(decodeJwtName(token)));

    // Load everything once so tabs feel instant
    loadMedicinesAll();
    loadInvoices();
    loadPrescriptionsAll();
    loadSuppliers();
    loadMissingMedicines();
  }, []);

  // ---------- MEDICINES VIEW ----------
  const medicinesView = useMemo(() => {
    const list = [...medicines];

    // optional stock filter (client-side)
    const filtered = inStockOnly ? list.filter((m) => Number(get(m, "quantity", "Quantity") || 0) > 0) : list;

    // sort
    if (sort === "name_asc") {
      filtered.sort((a, b) => String(get(a, "name", "Name") || "").localeCompare(String(get(b, "name", "Name") || "")));
    } else if (sort === "price_asc") {
      filtered.sort((a, b) => Number(get(a, "price", "Price") || 0) - Number(get(b, "price", "Price") || 0));
    } else if (sort === "price_desc") {
      filtered.sort((a, b) => Number(get(b, "price", "Price") || 0) - Number(get(a, "price", "Price") || 0));
    }

    return filtered;
  }, [medicines, inStockOnly, sort]);

  // ---------- SUPPLIERS VIEW ----------
  const suppliersView = useMemo(() => {
    const q = supplierSearch.trim().toLowerCase();
    if (!q) return suppliers;
    return suppliers.filter((s) => {
      const name = String(get(s, "name", "Name") || "").toLowerCase();
      const contact = String(get(s, "contactInfo", "ContactInfo") || "").toLowerCase();
      return name.includes(q) || contact.includes(q);
    });
  }, [suppliers, supplierSearch]);

async function deactivateSupplier(id) {
  try {
    await apiFetch(`/api/suppliers/${id}/deactivate`, { method: "PUT" });
    await loadSuppliers(); // refresh list
    alert("Supplier deactivated.");
  } catch (e) {
    alert(e.message || "Failed to deactivate supplier.");
  }
}

async function reactivateSupplier(id) {
  try {
    await apiFetch(`/api/suppliers/${id}/reactivate`, { method: "PUT" });
    await loadSuppliers(); // refresh list
    alert("Supplier reactivated.");
  } catch (e) {
    alert(e.message || "Failed to reactivate supplier.");
  }
}
  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white/85 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-2xl bg-indigo-600 text-white grid place-items-center font-bold">
              P
            </div>
            <div>
              <div className="font-semibold text-gray-900 leading-tight">Pharmacy</div>
              <div className="text-xs text-gray-500 -mt-0.5">Admin dashboard</div>
            </div>
          </div>

          <div className="flex-1" />

          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
            <span className="text-gray-400">Hi,</span>
            <span className="font-medium text-gray-900">{displayName}</span>
            {isAdmin && (
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200">
                Admin token
              </span>
            )}
          </div>

          <button
            onClick={logout}
            className="px-3 h-9 rounded-xl text-sm font-medium border bg-white hover:bg-gray-50 transition"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Error banner */}
        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={
                "h-10 px-4 rounded-xl text-sm font-medium border transition " +
                (tab === t.id
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white hover:bg-gray-50")
              }
            >
              {t.label}
            </button>
          ))}
        </div>

      {/* Content */}
        {tab === "medicines" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Medicines List */}
            <div className="lg:col-span-2 bg-white rounded-3xl border shadow-sm">
              <div className="p-5 border-b">
                <div className="flex items-start sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Medicines</h2>
                    <p className="text-sm text-gray-500">Search, filter</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setViewMode("all");
                        loadMedicinesAll();
                      }}
                      className={
                        "px-3 h-9 rounded-xl text-sm font-medium border transition " +
                        (viewMode === "all"
                          ? "bg-gray-900 text-white border-gray-900"
                          : "bg-white hover:bg-gray-50")
                      }
                    >
                      All
                    </button>
                    <button
                      onClick={() => {
                        setViewMode("low");
                        loadMedicinesLow();
                      }}
                      className={
                        "px-3 h-9 rounded-xl text-sm font-medium border transition " +
                        (viewMode === "low"
                          ? "bg-gray-900 text-white border-gray-900"
                          : "bg-white hover:bg-gray-50")
                      }
                    >
                      Low stock
                    </button>
                    <button
                      onClick={() => {
                        setViewMode("expiring");
                        loadMedicinesExpiring();
                      }}
                      className={
                        "px-3 h-9 rounded-xl text-sm font-medium border transition " +
                        (viewMode === "expiring"
                          ? "bg-gray-900 text-white border-gray-900"
                          : "bg-white hover:bg-gray-50")
                      }
                    >
                      Expiring
                    </button>
                  </div>
                </div>

                {/* Search controls */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    value={medQueryName}
                    onChange={(e) => setMedQueryName(e.target.value)}
                    placeholder="Search name…"
                    className="w-full h-10 px-3 rounded-xl border text-sm outline-none
                              focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                  />
                  <input
                    value={medQueryCategory}
                    onChange={(e) => setMedQueryCategory(e.target.value)}
                    placeholder="Category…"
                    className="w-full h-10 px-3 rounded-xl border text-sm outline-none
                              focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                  />
                  <button
                    onClick={() => {
                      setViewMode("all");
                      searchMedicines();
                    }}
                    className="h-10 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition"
                  >
                    Search
                  </button>
                </div>

                {/* Filters */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-2 px-3 h-10 rounded-xl border text-sm bg-white">
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={(e) => setInStockOnly(e.target.checked)}
                      className="accent-indigo-600"
                    />
                    In stock only
                  </label>

                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="h-10 px-3 rounded-xl border text-sm bg-white outline-none
                              focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                  >
                    <option value="name_asc">Name (A–Z)</option>
                    <option value="price_asc">Price (low)</option>
                    <option value="price_desc">Price (high)</option>
                  </select>

                  <button
                    onClick={() => {
                      setMedQueryName("");
                      setMedQueryCategory("");
                      setViewMode("all");
                      loadMedicinesAll();
                    }}
                    className="px-3 h-10 rounded-xl text-sm font-medium border bg-white hover:bg-gray-50 transition"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="p-5">
                {medLoading ? (
                  <Skeleton rows={6} />
                ) : medicinesView.length === 0 ? (
                  <Empty title="No medicines found" text="Try different filters or search." />
                ) : (
                  <div className="space-y-3">
                    {medicinesView.slice(0, 40).map((m) => (
                      <MedicineRow
                        key={get(m, "id", "Id")}
                        med={m}
                        onDelete={() => deleteMedicine(m.id)} 
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Add New Medicine */}
            <div className="bg-white rounded-3xl border shadow-sm sticky top-[76px] h-fit p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Add New Medicine</h2>
              <p className="text-sm text-gray-500 mb-4">Fill in the details and click Add.</p>

              <div className="space-y-3">
                <input
                  value={newMed.name}
                  onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                  placeholder="Medicine name"
                  className="w-full h-10 px-3 rounded-xl border text-sm outline-none
                            focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                />
                <input
                  value={newMed.category}
                  onChange={(e) => setNewMed({ ...newMed, category: e.target.value })}
                  placeholder="Category"
                  className="w-full h-10 px-3 rounded-xl border text-sm outline-none
                            focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                />
                <select
                  value={newMed.supplierId}
                  onChange={(e) =>
                    setNewMed({ ...newMed, supplierId: e.target.value })
                  }
                  className="w-full h-10 px-3 rounded-xl border text-sm bg-white outline-none
                            focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                  >
                  <option value="">Select supplier</option>
                  {suppliers.map((s) => (
                    <option key={s.id ?? s.Id} value={s.id ?? s.Id}>
                      {s.name ?? s.Name}
                    </option>
                  ))}
                </select>
                <input
                  value={newMed.price}
                  onChange={(e) => setNewMed({ ...newMed, price: e.target.value })}
                  placeholder="Price"
                  type="number"
                  className="w-full h-10 px-3 rounded-xl border text-sm outline-none
                            focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                />
                <input
                  value={newMed.quantity}
                  onChange={(e) => setNewMed({ ...newMed, quantity: e.target.value })}
                  placeholder="Quantity"
                  type="number"
                  className="w-full h-10 px-3 rounded-xl border text-sm outline-none
                            focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                />
                <input
                  value={newMed.batchNumber}
                  onChange={(e) => setNewMed({ ...newMed, batchNumber: e.target.value })}
                  placeholder="Batch Number"
                  className="w-full h-10 px-3 rounded-xl border"
                />

                <input
                  type="date"
                  value={newMed.expiryDate}
                  onChange={(e) => setNewMed({ ...newMed, expiryDate: e.target.value })}
                  placeholder="Expiry Date"
                  className="w-full h-10 px-3 rounded-xl border"
                />

                <button
                  onClick={createMedicine}
                  disabled={medCreating}
                  className="mt-2 w-full h-11 rounded-xl font-semibold text-white shadow
                            bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99]
                            disabled:opacity-60 disabled:cursor-not-allowed transition"
                >
                  {medCreating ? "Adding..." : "Add Medicine"}
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === "invoices" && (
          <div className="bg-white rounded-3xl border shadow-sm">
            {/* Header */}
            <div className="p-5 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Invoices</h2>
                  <p className="text-sm text-gray-500">
                    Admin filters: by user or date range
                  </p>
                </div>

                <button
                  onClick={loadInvoices}
                  className="px-3 h-9 rounded-xl text-sm font-medium border bg-white hover:bg-gray-50 transition"
                >
                  Refresh
                </button>
              </div>

              {/* Filters */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
                {/* User ID */}
                <input
                  value={invoiceUserId}
                  onChange={(e) => setInvoiceUserId(e.target.value)}
                  placeholder="User ID"
                  className="h-10 px-3 rounded-xl border text-sm outline-none
                            focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                />

                {/* Start date */}
                <input
                  type="date"
                  value={invoiceStart}
                  onChange={(e) => setInvoiceStart(e.target.value)}
                  className="h-10 px-3 rounded-xl border text-sm outline-none
                            focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                />

                {/* End date */}
                <input
                  type="date"
                  value={invoiceEnd}
                  onChange={(e) => setInvoiceEnd(e.target.value)}
                  className="h-10 px-3 rounded-xl border text-sm outline-none
                            focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                />

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => loadInvoicesByUser(invoiceUserId)}
                    className="flex-1 h-10 rounded-xl text-sm font-medium
                              bg-indigo-600 text-white hover:bg-indigo-700 transition"
                  >
                    Filter User
                  </button>

                  <button
                    onClick={() =>
                      loadInvoicesByDateRange(invoiceStart, invoiceEnd)
                    }
                    className="flex-1 h-10 rounded-xl text-sm font-medium
                              border bg-white hover:bg-gray-50 transition"
                  >
                    Filter Date
                  </button>
                </div>
              </div>
            </div>

            {/* List */}
            <div className="p-5">
              {invLoading ? (
                <Skeleton rows={6} />
              ) : invoices.length === 0 ? (
                <Empty title="No invoices" text="Try changing filters or refresh." />
              ) : (
                <div className="space-y-3">
                  {invoices
                    .slice()
                    .sort(
                      (a, b) =>
                        new Date(get(b, "dateCreated", "DateCreated") || 0) -
                        new Date(get(a, "dateCreated", "DateCreated") || 0)
                    )
                    .map((inv) => (
                      <InvoiceRow
                        key={get(inv, "id", "Id")}
                        inv={inv}
                      />
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "prescriptions" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left: Prescription List */}
            <div className="lg:col-span-2 bg-white rounded-3xl border shadow-sm">
              <div className="p-5 border-b flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-gray-900">Prescriptions</h2>
                <div className="flex gap-2">
                  <button
                    onClick={loadPrescriptionsAll}
                    className="px-3 h-9 rounded-xl text-sm font-medium border bg-gray-900 text-white border-gray-900 hover:bg-gray-800 transition"
                  >
                    All
                  </button>
                </div>
              </div>

              <div className="p-5">
                {rxLoading ? (
                  <Skeleton rows={6} />
                ) : prescriptions.length === 0 ? (
                  <Empty
                    title="No prescriptions found"
                    text="No prescriptions have been added yet."
                  />
                ) : (
                  <div className="space-y-3">
                    {prescriptions.map((rx) => (
                      <div
                        key={rx.id ?? rx.Id}
                        className="rounded-2xl border p-4 flex items-center justify-between gap-3 bg-white hover:bg-gray-50 transition"
                      >
                        <PrescriptionRow rx={rx} />
                        <button
                          onClick={() => deletePrescription(rx.id ?? rx.Id)}
                          className="px-3 py-1 rounded-xl text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom: Missing Medicines */}
              {missingMedicines.length > 0 && (
                <div className="mt-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <h3 className="text-md font-semibold text-gray-800 mb-2">
                    Missing Medicines
                  </h3>
                  <ul className="text-sm text-gray-700 list-disc list-inside max-h-64 overflow-y-auto space-y-1">
                    {missingMedicines.map((m, idx) => (
                      <li key={idx} className="flex flex-col sm:flex-row sm:justify-between sm:gap-4">
                        <span>
                          <strong>Patient:</strong> {m.patientName} 
                        </span>
                        <span>
                          <strong>Doctor:</strong> {m.doctorName}
                        </span>
                        <span>
                          <strong>Medicine:</strong> {m.medicineName ?? m.medicineId}
                        </span>
                        <span>
                          <strong>Quantity:</strong> {m.quantity}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            {/* Right: Add New Prescription */}
            <div className="bg-white rounded-3xl border shadow-sm sticky top-[76px] h-fit p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Add New Prescription
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Fill in the details and add at least one valid medicine.
              </p>

              <div className="space-y-3">
                {/* Patient Info */}
                <input
                  value={newPrescription.patientId}
                  onChange={(e) =>
                    setNewPrescription({ ...newPrescription, patientId: e.target.value })
                  }
                  placeholder="Patient ID"
                  className="w-full h-10 px-3 rounded-xl border text-sm outline-none
                            focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                />

                <input
                  value={newPrescription.patientName}
                  onChange={(e) =>
                    setNewPrescription({ ...newPrescription, patientName: e.target.value })
                  }
                  placeholder="Patient Name"
                  className="w-full h-10 px-3 rounded-xl border text-sm outline-none
                            focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                />

                <input
                  value={newPrescription.doctorName}
                  onChange={(e) =>
                    setNewPrescription({ ...newPrescription, doctorName: e.target.value })
                  }
                  placeholder="Doctor Name"
                  className="w-full h-10 px-3 rounded-xl border text-sm outline-none
                            focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                />

                {/* Medicines */}
                <div className="space-y-2">
                  {newPrescription.medicines.map((med, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <select
                        value={med.medicineId || ""}
                        onChange={(e) => {
                          const updated = [...newPrescription.medicines];
                          updated[index].medicineId = Number(e.target.value);
                          setNewPrescription({ ...newPrescription, medicines: updated });
                        }}
                        className="flex-1 h-10 px-3 rounded-xl border text-sm outline-none
                                  focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                      >
                        <option value="">Select medicine</option>
                        {medicines.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} (Stock: {m.quantity})
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min={1}
                        value={med.quantity}
                        onChange={(e) => {
                          const updated = [...newPrescription.medicines];
                          updated[index].quantity = Number(e.target.value);
                          setNewPrescription({ ...newPrescription, medicines: updated });
                        }}
                        placeholder="Qty"
                        className="w-20 h-10 px-3 rounded-xl border text-sm outline-none
                                  focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                      />

                      {newPrescription.medicines.length > 1 && (
                        <button
                          onClick={() => {
                            const updated = [...newPrescription.medicines];
                            updated.splice(index, 1);
                            setNewPrescription({ ...newPrescription, medicines: updated });
                          }}
                          className="px-3 py-1 rounded-xl text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    onClick={() =>
                      setNewPrescription({
                        ...newPrescription,
                        medicines: [...newPrescription.medicines, { medicineId: "", quantity: 1 }],
                      })
                    }
                    className="w-full h-10 rounded-xl font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition"
                  >
                    + Add Another Medicine
                  </button>
                </div>

                {/* Add Prescription Button */}
                <button
                  onClick={createPrescription}
                  disabled={
                    rxCreating ||
                    !newPrescription.patientId ||
                    !newPrescription.patientName ||
                    !newPrescription.doctorName ||
                    newPrescription.medicines.length === 0 // Disabled if no medicines
                  }
                  className="mt-2 w-full h-11 rounded-xl font-semibold text-white shadow
                            bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99]
                            disabled:opacity-60 disabled:cursor-not-allowed transition"
                >
                  {rxCreating ? "Adding..." : "Add Prescription"}
                </button>
              </div>
            </div>

          </div>
        )}


        {tab === "suppliers" && (
          <div className="bg-white rounded-3xl border shadow-sm">
            <div className="p-5 border-b flex items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Suppliers</h2>
                <p className="text-sm text-gray-500">
                  Search suppliers by name or contact info.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={loadSuppliers}
                  className="px-3 h-9 rounded-xl text-sm font-medium border bg-white hover:bg-gray-50 transition"
                >
                  Refresh
                </button>
              </div>
            </div>

            <div className="p-5">
              <input
                value={supplierSearch}
                onChange={(e) => setSupplierSearch(e.target.value)}
                placeholder="Search supplier name/contact…"
                className="w-full h-10 px-3 rounded-xl border text-sm outline-none
                           focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 mb-4"
              />

             {supLoading ? (
              <Skeleton rows={6} />
            ) : suppliersView.length === 0 ? (
              <Empty title="No suppliers" text="Try another search." />
            ) : (
              <div className="space-y-3">
               {suppliersView.map((s) => (
              <SupplierRow
                key={get(s, "id", "Id")}
                s={s}
                onDeactivate={deactivateSupplier}
                onReactivate={reactivateSupplier}
              />
            ))}   
              </div>
            )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================== UI COMPONENTS ================== */
function MedicineRow({ med, onDelete }) {
  const id = get(med, "id", "Id");
  const name = get(med, "name", "Name") || "Medicine";
  const category = get(med, "category", "Category");
  const supplierName = get(med, "supplierName", "SupplierName");
  const price = Number(get(med, "price", "Price") || 0);
  const qty = Number(get(med, "quantity", "Quantity") || 0);

  const stockLabel = qty <= 0 ? "Out" : qty <= 5 ? "Low" : "In";
  const badge =
    qty <= 0
      ? "bg-red-50 text-red-700 border-red-200"
      : qty <= 5
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-emerald-50 text-emerald-700 border-emerald-200";

  return (
    <div className="rounded-2xl border p-4 flex items-center justify-between gap-3 bg-white hover:bg-gray-50 transition">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <div className="font-semibold text-gray-900 truncate">{name}</div>
          <span className={`text-xs px-2 py-0.5 rounded-full border ${badge}`}>
            {stockLabel}
          </span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {category ? `Category: ${category} • ` : ""}
          {supplierName ? `Supplier: ${supplierName} • ` : ""}
          Stock: {qty}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="text-sm font-semibold text-gray-900">{money(price)}</div>
          <div className="text-xs text-gray-400">per item</div>
        </div>

        <button
          onClick={onDelete}
          className="px-3 py-1 rounded-xl text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function InvoiceRow({ inv }) {
  const id = get(inv, "id", "Id");
  const customer = get(inv, "customerName", "CustomerName") || "Customer";
  const total = Number(get(inv, "totalAmount", "TotalAmount") || 0);
  const date = get(inv, "dateCreated", "DateCreated");
  const userName = get(inv, "userName", "UserName");

  return (
    <div className="rounded-2xl border p-4 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="font-semibold text-gray-900 truncate">
          Invoice #{id} • {customer}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {date ? new Date(date).toLocaleString() : ""}
          {userName ? ` • Created by: ${userName}` : ""}
        </div>
      </div>

      <div className="text-right">
        <div className="text-sm font-semibold text-gray-900">{money(total)}</div>
        <div className="text-xs text-gray-400">total</div>
      </div>
    </div>
  );
}

function PrescriptionRow({ rx }) {
  const id = get(rx, "id", "Id");
  const patient = get(rx, "patientId", "PatientId") || get(rx, "patientName", "PatientName");
  const doctor = get(rx, "doctorName", "DoctorName");
  const status = get(rx, "status", "Status");
  const created = get(rx, "dateCreated", "DateCreated") || get(rx, "createdAt", "CreatedAt");

  return (
    <div className="rounded-2xl border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold text-gray-900 truncate">Prescription #{id}</div>
        </div>
        {status !== undefined && (
          <span className="text-xs px-2 py-0.5 rounded-full border bg-gray-50 text-gray-700">
            {String(status)}
          </span>
        )}
      </div>

      {created && (
        <div className="text-xs text-gray-400 mt-2">
          {new Date(created).toLocaleString()}
        </div>
      )}
    </div>
  );
}

function SupplierRow({ s, onDeactivate, onReactivate }) {
  const id = get(s, "id", "Id");
  const name = get(s, "name", "Name") || "Supplier";
  const contact = get(s, "contactInfo", "ContactInfo");
  const medicinesCount = get(s, "medicinesCount", "MedicinesCount");

  // optional status if your DTO includes it
  const isActive = get(s, "isActive", "IsActive", "active", "Active");

  return (
    <div className="rounded-2xl border p-4 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <div className="font-semibold text-gray-900 truncate">{name}</div>

          {isActive !== undefined && (
            <span
              className={
                "text-xs px-2 py-0.5 rounded-full border " +
                (isActive
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-red-50 text-red-700 border-red-200")
              }
            >
              {isActive ? "Active" : "Inactive"}
            </span>
          )}
        </div>

        <div className="text-xs text-gray-500 mt-1">
          {contact ? `Contact: ${contact}` : "No contact info"}
          {medicinesCount !== undefined ? ` • Medicines: ${medicinesCount}` : ""}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => onDeactivate(id)}
          className="px-3 h-9 rounded-xl text-sm font-medium border bg-white hover:bg-gray-50 transition"
        >
          Deactivate
        </button>

        <button
          type="button"
          onClick={() => onReactivate(id)}
          className="px-3 h-9 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition"
        >
          Reactivate
        </button>

        <span className="text-xs text-gray-400">#{id}</span>
      </div>
    </div>
  );
}
function Empty({ title, text }) {
  return (
    <div className="rounded-2xl border bg-gray-50 px-4 py-10 text-center">
      <div className="text-sm font-semibold text-gray-900">{title}</div>
      <div className="text-xs text-gray-500 mt-1">{text}</div>
    </div>
  );
}

function Skeleton({ rows = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-2xl border p-4">
          <div className="h-4 w-1/2 bg-gray-100 rounded" />
          <div className="mt-3 h-3 w-2/3 bg-gray-100 rounded" />
        </div>
      ))}
    </div>
  );
}
