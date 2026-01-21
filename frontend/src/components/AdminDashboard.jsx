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
  { id: "users", label: "Users" },
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
  const [newMed, setNewMed] = useState({name: "", category: "", supplierId: "", price: "", quantity: "", expirationDate: ""});
  const [medCreating, setMedCreating] = useState(false);

  // ===== Invoices state =====
  const [invLoading, setInvLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [invoiceUserId, setInvoiceUserId] = useState("");
  const [invoiceStart, setInvoiceStart] = useState("");
  const [invoiceEnd, setInvoiceEnd] = useState("");
  const [username, setUsername] = useState("")

    // ===== Prescriptions state =====
  const [rxLoading, setRxLoading] = useState(true);              // Loading state for prescription list
  const [prescriptions, setPrescriptions] = useState([]);        // List of prescriptions
  const [newPrescription, setNewPrescription] = useState({ embg: "", patientName: "", doctorName: "", medicines: [],});
  const [missingMedicines, setMissingMedicines] = useState([]); // List of missing medicines
  const [prescriptionCreating, setPrescriptionCreating] = useState(false); 
           // Loading state for creating prescription

  // ===== Suppliers state =====
  const [supLoading, setSupLoading] = useState(true);
  const [suppliers, setSuppliers] = useState([]);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [supToAdd, setSupToAdd] = useState(null); // object for new supplier
  const [supToUpdate, setSupToUpdate] = useState(null); // object for supplier updates

  // ===== Users state =====
  const [users, setUsers] = useState([]);
  const [userLoading, setUserLoading] = useState(true);
  const [userSearch, setUserSearch] = useState("");
  const [userToAdd, setUserToAdd] = useState({ userName: "", email: "", password: "" });
  const [userRolesToEdit, setUserRolesToEdit] = useState(null); // { userName, roles }
  const [userCreating, setUserCreating] = useState(false);
  const [roleUpdating, setRoleUpdating] = useState(false);

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
  setPrescriptionCreating(true);

  try {
    // ✅ EMBG validation
    const embg = String(newPrescription.embg || "").trim();
    if (!embg) {
      alert("EMBG is required.");
      return;
    }
    if (!/^\d+$/.test(embg)) {
      alert("EMBG must contain only numbers.");
      return;
    }

    // Basic validation
    if (!newPrescription.patientName || !newPrescription.doctorName) {
      alert("Patient name and doctor name are required.");
      return;
    }

    if (!Array.isArray(newPrescription.medicines) || newPrescription.medicines.length === 0) {
      alert("You must add at least one medicine.");
      return;
    }

    // Clean medicines list
    const cleanedMedicines = newPrescription.medicines
      .filter(m => m.medicineId && m.quantity > 0)
      .map(m => ({
        medicineId: Number(m.medicineId),
        quantity: Number(m.quantity),
      }));

    if (cleanedMedicines.length === 0) {
      alert("No valid medicines found.");
      return;
    }

    // Remove duplicates (merge quantities)
    const mergedMedicines = Object.values(
      cleanedMedicines.reduce((acc, m) => {
        if (!acc[m.medicineId]) acc[m.medicineId] = { ...m };
        else acc[m.medicineId].quantity += m.quantity;
        return acc;
      }, {})
    );

    // ✅ Final DTO (IMPORTANT: backend error shows "EMBG", so send "EMBG")
    const dto = {
      EMBG: embg,
      PatientName: newPrescription.patientName.trim(),
      DoctorName: newPrescription.doctorName.trim(),
      Medicines: mergedMedicines.map(m => ({
        MedicineId: m.medicineId,
        Quantity: m.quantity,
      })),
    };

    await apiFetch("/api/Prescription", {
      method: "POST",
      body: JSON.stringify(dto),
    });

    alert("Prescription added successfully!");

    // ✅ Reset form
    setNewPrescription({
      embg: "",
      patientName: "",
      doctorName: "",
      medicines: [],
    });

    await loadPrescriptionsAll();
    await loadMissingMedicines();
  } catch (e) {
    console.error("Failed POST /api/Prescription:", e);
    alert(e.message || "Failed to add prescription.");
  } finally {
    setPrescriptionCreating(false);
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
  
  async function createSupplier() {
    if (!supToAdd?.name) {
      alert("Supplier name is required.");
      return;
    }

    try {
      setSupLoading(true);
      const created = await apiFetch("/api/suppliers", {
        method: "POST",
        body: JSON.stringify(supToAdd),
      });
      alert("Supplier added!");
      setSupToAdd(null);
      await loadSuppliers();
    } catch (e) {
      alert(e.message || "Failed to add supplier.");
    } finally {
      setSupLoading(false);
    }
  }

  async function updateSupplier() {
    if (!supToUpdate?.id || !supToUpdate?.name) {
      alert("Supplier ID and name are required.");
      return;
    }

    try {
      setSupLoading(true);
      const updated = await apiFetch(`/api/suppliers/${supToUpdate.id}`, {
        method: "PUT",
        body: JSON.stringify(supToUpdate),
      });
      alert("Supplier updated!");
      setSupToUpdate(null);
      await loadSuppliers();
    } catch (e) {
      alert(e.message || "Failed to update supplier.");
    } finally {
      setSupLoading(false);
    }
  }

  async function deleteSupplier(id) {
    if (!window.confirm("Are you sure you want to delete this supplier?")) return;

    try {
      setSupLoading(true);
      await apiFetch(`/api/suppliers/${id}`, { method: "DELETE" });
      alert("Supplier deleted!");
      await loadSuppliers();
    } catch (e) {
      alert(e.message || "Failed to delete supplier.");
    } finally {
      setSupLoading(false);
    }
  }

  async function createUser() {
    setUserCreating(true);
    try {
      if (!userToAdd.userName || !userToAdd.email || !userToAdd.password) {
        alert("All fields are required.");
        return;
      }

      await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(userToAdd),
      });

      alert("User created successfully!");
      setUserToAdd({ userName: "", email: "", password: "" });
      await loadUsers();
    } catch (e) {
      alert(e.message || "Failed to create user.");
    } finally {
      setUserCreating(false);
    }
  }

  async function addRoleToUser(userName, role) {
    setRoleUpdating(true);
    try {
      await apiFetch(`/api/roles/add?userName=${userName}&role=${role}`, { method: "POST" });
      alert(`Role '${role}' added to ${userName}`);
      await loadUsers();
    } catch (e) {
      alert(e.message || "Failed to add role.");
    } finally {
      setRoleUpdating(false);
    }
  }

  async function removeRoleFromUser(userName, role) {
    setRoleUpdating(true);
    try {
      await apiFetch(`/api/roles/remove?userName=${userName}&role=${role}`, { method: "POST" });
      alert(`Role '${role}' removed from ${userName}`);
      await loadUsers();
    } catch (e) {
      alert(e.message || "Failed to remove role.");
    } finally {
      setRoleUpdating(false);
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

 async function loadInvoicesByUser() {
  setInvLoading(true);
  setError("");
  try {
    const data = await apiFetch(
  `/api/invoices/user/by-username/${encodeURIComponent(username)}`
);
setInvoices(Array.isArray(data) ? data : []);

    setInvoices(Array.isArray(data) ? data : []);
  } catch (e) {
    setError(e.message || "Failed to load invoices.");
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

      // `data` is an array of strings
      const parsed = data
        .map(line => {
          const match = line.match(
            /Patient:\s*(.*?),\s*Doctor:\s*(.*?),\s*MedicineId:\s*(\d+),\s*Quantity:\s*(\d+)/
          );
          if (!match) return null;
          const [, patientName, doctorName, medicineId, quantity] = match;
          return {
            patientName,
            doctorName,
            medicineId: Number(medicineId),
            quantity: Number(quantity)
          };
        })
        .filter(Boolean); // remove invalid lines

      setMissingMedicines(parsed);
    } catch (err) {
      console.error("Failed to load missing medicines:", err.message);
      setMissingMedicines([]);
    }
  }

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

  async function loadUsers() {
    setUserLoading(true);
    try {
      const data = await apiFetch("/api/Users"); 
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      alert(e.message || "Failed to load users.");
    } finally {
      setUserLoading(false);
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

  function openAddSupplierForm() {
    setSupToAdd({ name: "", email: "", phone: "" });
  }

  function openEditSupplierForm(supplier) {
    setSupToUpdate({ ...supplier });
  }

  function openRolesEditor(user) {
    setUserRolesToEdit({ userName: user.userName, roles: user.roles || [] });
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
    if (tab === "users") loadUsers();
  }, [tab]);

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

  const usersView = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u => 
      String(u.userName || "").toLowerCase().includes(q) ||
      String(u.email || "").toLowerCase().includes(q)
    );
  }, [users, userSearch]);

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
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Filter by username…"
                  className="h-10 px-3 rounded-xl border text-sm"
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
                        className="rounded-2xl border p-4 flex items-center justify-between gap-3
                                  bg-white hover:bg-gray-50 transition"
                      >
                        <PrescriptionRow rx={rx} />

                        <button
                          onClick={() => deletePrescription(rx.id ?? rx.Id)}
                          className="px-3 py-1 rounded-xl text-sm font-medium text-white
                                    bg-red-600 hover:bg-red-700 transition"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Add New Prescription */}
            <div className="bg-white rounded-3xl border shadow-sm sticky top-[76px] h-fit p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Add New Prescription
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Fill in patient details and add one or more valid medicines.
              </p>

              <div className="space-y-4">
                {/* Patient Info */}
              <input
              value={newPrescription.embg}
              onChange={(e) =>
                setNewPrescription((prev) => ({
                  ...prev,
                  embg: e.target.value.replace(/\D/g, ""), // keep only digits
                }))
              }
              placeholder="EMBG"
              inputMode="numeric"
              pattern="[0-9]*"
              className="w-full h-10 px-3 rounded-xl border text-sm outline-none
                        focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
            />

            <input
              value={newPrescription.patientName}
              onChange={(e) =>
                setNewPrescription((prev) => ({ ...prev, patientName: e.target.value }))
              }
               placeholder="Patient Name"
              className="w-full h-10 px-3 rounded-xl border text-sm outline-none
                        focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
            />

            <input
              value={newPrescription.doctorName}
              onChange={(e) =>
                setNewPrescription((prev) => ({ ...prev, doctorName: e.target.value }))
              }
               placeholder="Doctor Name"
              className="w-full h-10 px-3 rounded-xl border text-sm outline-none
                        focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
            />


                {/* Medicines */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Medicines *</p>

                  {newPrescription.medicines.length === 0 && (
                    <p className="text-sm text-red-500">Add at least one medicine</p>
                  )}

                  {newPrescription.medicines.map((med, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <input
                        type="number"
                        min={1}
                        value={med.medicineId || ""}
                        placeholder="Medicine ID"
                        onChange={(e) => {
                          const updated = [...newPrescription.medicines];
                          updated[index].medicineId = Number(e.target.value);
                          setNewPrescription({ ...newPrescription, medicines: updated });
                        }}
                        className="flex-1 h-10 px-3 rounded-xl border text-sm outline-none
                                  focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                      />
                      <input
                        type="number"
                        min={1}
                        value={med.quantity}
                        placeholder="Qty"
                        onChange={(e) => {
                          const updated = [...newPrescription.medicines];
                          updated[index].quantity = Number(e.target.value);
                          setNewPrescription({ ...newPrescription, medicines: updated });
                        }}
                        className="w-20 h-10 px-3 rounded-xl border text-sm outline-none
                                  focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                      />
                      <button
                        onClick={() => {
                          const updated = [...newPrescription.medicines];
                          updated.splice(index, 1);
                          setNewPrescription({ ...newPrescription, medicines: updated });
                        }}
                        className="px-3 py-1 rounded-xl text-sm font-medium text-white
                                  bg-red-600 hover:bg-red-700 transition"
                      >
                        Remove
                      </button>
                    </div>
                  ))}

                  <button
                    onClick={() =>
                      setNewPrescription({
                        ...newPrescription,
                        medicines: [...newPrescription.medicines, { medicineId: "", quantity: 1 }],
                      })
                    }
                    className="w-full h-10 rounded-xl font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition"
                  >
                    + Add Medicine
                  </button>
                </div>

                {/* Submit */}
                <button
                  onClick={createPrescription}
                  disabled={
                    prescriptionCreating ||
                    !newPrescription.patientName ||
                    !newPrescription.doctorName ||
                    newPrescription.medicines.length === 0
                  }
                  className="mt-3 w-full h-11 rounded-xl font-semibold text-white shadow
                            bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99]
                            disabled:opacity-60 disabled:cursor-not-allowed transition"
                >
                  {prescriptionCreating ? "Adding..." : "Add Prescription"}
                </button>
              </div>
            </div>

            {/* Bottom: Missing Medicines Container */}
            <div className="lg:col-span-3 mt-6">
              <div className="bg-white rounded-3xl border shadow-sm p-5">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                  Missing Medicines
                </h2>
                {missingMedicines.length === 0 ? (
                  <div className="text-gray-500 text-sm">No missing medicines.</div>
                ) : (
                  <div className="space-y-3">
                    {missingMedicines.map((m, idx) => (
                      <MissingMedicineRow key={idx} m={m} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === "suppliers" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ----- Left: Supplier List ----- */}
            <div className="lg:col-span-2 bg-white rounded-3xl border shadow-sm">
              {/* Header */}
              <div className="p-5 border-b flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-gray-900">Suppliers</h2>
                <div className="flex gap-2">
                  <button
                    onClick={openAddSupplierForm}
                    className="px-3 h-9 rounded-xl text-sm font-medium border bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
                  >
                    + Add Supplier
                  </button>
                </div>
              </div>

              {/* Supplier List */}
              <div className="p-5">
                {/* Search */}
                <input
                  value={supplierSearch}
                  onChange={(e) => setSupplierSearch(e.target.value)}
                  placeholder="Search suppliers..."
                  className="w-full mb-4 h-10 px-3 rounded-xl border text-sm outline-none
                            focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                />

                {supLoading ? (
                  <Skeleton rows={6} />
                ) : suppliersView.length === 0 ? (
                  <Empty title="No suppliers found" text="Try a different search." />
                ) : (
                  <div className="space-y-3">
                    {suppliersView.map((s) => {
                      const isActive = s.isActive ?? s.IsActive;
                      return (
                        <div
                          key={s.id ?? s.Id}
                          className="rounded-2xl border p-4 flex items-center justify-between gap-3
                                    bg-white hover:bg-gray-50 transition"
                        >
                          {/* Supplier Info */}
                          <div className="min-w-0">
                            <div className="font-semibold text-gray-900 truncate">{s.name ?? s.Name}</div>
                            <div className="text-xs text-gray-500 truncate">
                              {s.email ?? s.Email} • {s.phone ?? s.Phone}
                            </div>
                            <div className="mt-1">
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full border ${
                                  isActive
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : "bg-red-50 text-red-700 border-red-200"
                                }`}
                              >
                                {isActive ? "Active" : "Inactive"}
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            {isActive ? (
                              <button
                                onClick={() => deactivateSupplier(s.id ?? s.Id)}
                                className="px-3 py-1 rounded-xl text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 transition"
                              >
                                Deactivate
                              </button>
                            ) : (
                              <button
                                onClick={() => reactivateSupplier(s.id ?? s.Id)}
                                className="px-3 py-1 rounded-xl text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition"
                              >
                                Reactivate
                              </button>
                            )}
                            <button
                              onClick={() => openEditSupplierForm(s)}
                              className="px-3 py-1 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteSupplier(s.id ?? s.Id)}
                              className="px-3 py-1 rounded-xl text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ----- Right: Add/Edit Supplier Form ----- */}
            {(supToAdd || supToUpdate) && (
              <div className="bg-white rounded-3xl border shadow-sm sticky top-[76px] h-fit p-5">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  {supToAdd ? "Add New Supplier" : "Edit Supplier"}
                </h2>

                <div className="space-y-3">
                  {/* Name */}
                  <input
                    value={supToAdd?.name ?? supToUpdate?.name ?? ""}
                    onChange={(e) => {
                      if (supToAdd) setSupToAdd({ ...supToAdd, name: e.target.value });
                      if (supToUpdate) setSupToUpdate({ ...supToUpdate, name: e.target.value });
                    }}
                    placeholder="Supplier Name *"
                    className="w-full h-10 px-3 rounded-xl border text-sm outline-none
                              focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                  />

                  {/* Email */}
                  <input
                    value={supToAdd?.email ?? supToUpdate?.email ?? ""}
                    onChange={(e) => {
                      if (supToAdd) setSupToAdd({ ...supToAdd, email: e.target.value });
                      if (supToUpdate) setSupToUpdate({ ...supToUpdate, email: e.target.value });
                    }}
                    placeholder="Email"
                    className="w-full h-10 px-3 rounded-xl border text-sm outline-none
                              focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                  />

                  {/* Phone */}
                  <input
                    value={supToAdd?.phone ?? supToUpdate?.phone ?? ""}
                    onChange={(e) => {
                      if (supToAdd) setSupToAdd({ ...supToAdd, phone: e.target.value });
                      if (supToUpdate) setSupToUpdate({ ...supToUpdate, phone: e.target.value });
                    }}
                    placeholder="Phone"
                    className="w-full h-10 px-3 rounded-xl border text-sm outline-none
                              focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                  />

                  {/* Submit */}
                  <button
                    onClick={supToAdd ? createSupplier : updateSupplier}
                    disabled={supLoading || !(supToAdd?.name || supToUpdate?.name)}
                    className="mt-2 w-full h-11 rounded-xl font-semibold text-white shadow
                              bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99]
                              disabled:opacity-60 disabled:cursor-not-allowed transition"
                  >
                    {supToAdd ? "Add Supplier" : "Update Supplier"}
                  </button>

                  {/* Cancel */}
                  <button
                    onClick={() => {
                      setSupToAdd(null);
                      setSupToUpdate(null);
                    }}
                    className="mt-2 w-full h-11 rounded-xl font-semibold text-gray-700 shadow
                              bg-gray-100 hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "users" && (
          <div className="grid grid-cols-1 gap-6">
            {/* Add New User */}
            <div className="bg-white rounded-3xl border shadow-sm p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Add New User</h2>
              <div className="space-y-3">
                <input
                  placeholder="Username *"
                  value={userToAdd.userName}
                  onChange={e => setUserToAdd({ ...userToAdd, userName: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border text-sm outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                />
                <input
                  placeholder="Email *"
                  type="email"
                  value={userToAdd.email}
                  onChange={e => setUserToAdd({ ...userToAdd, email: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border text-sm outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                />
                <input
                  placeholder="Password *"
                  type="password"
                  value={userToAdd.password}
                  onChange={e => setUserToAdd({ ...userToAdd, password: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border text-sm outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                />
                <button
                  onClick={createUser}
                  disabled={userCreating}
                  className="w-full h-11 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed transition"
                >
                  {userCreating ? "Creating..." : "Add User"}
                </button>
              </div>
            </div>

            {/* User List */}
            <div className="bg-white rounded-3xl border shadow-sm p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Users</h2>
              <input
                placeholder="Search users..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className="w-full h-10 px-3 mb-3 rounded-xl border text-sm outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
              />
              {userLoading ? (
                <Skeleton rows={6} />
              ) : usersView.length === 0 ? (
                <Empty title="No users found" text="Add new users above." />
              ) : (
                <div className="space-y-3">
                  {usersView.map((u, idx) => (
                    <div key={idx} className="rounded-2xl border p-4 flex justify-between items-center gap-3">
                      <div>
                        <div className="font-semibold text-gray-900">{u.userName}</div>
                        <div className="text-xs text-gray-500">{u.email}</div>
                        <div className="text-xs text-gray-400">Roles: {u.roles?.join(", ") || "None"}</div>
                      </div>
                      <button
                        onClick={() => openRolesEditor(u)}
                        className="px-3 h-9 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition"
                      >
                        Edit Roles
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Edit Roles Modal */}
            {userRolesToEdit && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl w-full max-w-md p-5 space-y-4">
                  <h3 className="text-lg font-semibold">Edit Roles: {userRolesToEdit.userName}</h3>
                  {["Admin", "User"].map(role => {
                    const hasRole = userRolesToEdit.roles.includes(role);
                    return (
                      <div key={role} className="flex items-center justify-between">
                        <div>{role}</div>
                        {hasRole ? (
                          <button
                            onClick={() => removeRoleFromUser(userRolesToEdit.userName, role)}
                            disabled={roleUpdating}
                            className="px-3 h-8 rounded-xl text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition"
                          >
                            Remove
                          </button>
                        ) : (
                          <button
                            onClick={() => addRoleToUser(userRolesToEdit.userName, role)}
                            disabled={roleUpdating}
                            className="px-3 h-8 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition"
                          >
                            Add
                          </button>
                        )}
                      </div>
                    );
                  })}
                  <button
                    onClick={() => setUserRolesToEdit(null)}
                    className="mt-3 w-full h-10 rounded-xl border font-medium text-gray-700 hover:bg-gray-50 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
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

  const patientName =
    get(rx, "patientName", "PatientName") || "Unknown patient";
  const patientId = get(rx, "patientId", "PatientId");

  const doctorName =
    get(rx, "doctorName", "DoctorName") || "—";

  const status = get(rx, "status", "Status");
  const created =
    get(rx, "dateCreated", "DateCreated") ||
    get(rx, "createdAt", "CreatedAt");

  const meds =
    get(rx, "prescriptionMedicines") ??
    get(rx, "PrescriptionMedicines") ??
    get(rx, "medicines") ??
    get(rx, "Medicines") ??
    [];

  const medsCount = Array.isArray(meds) ? meds.length : 0;

  const statusLabel =
    String(status).toLowerCase() === "ready" ? "Ready" : "Pending";

  const statusBadge =
    String(status).toLowerCase() === "ready"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : "bg-amber-50 text-amber-700 border-amber-200";

  return (
    <div className="min-w-0">
      {/* Top row */}
      <div className="flex items-center gap-2">
        <div className="font-semibold text-gray-900 truncate">
          Prescription #{id}
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded-full border ${statusBadge}`}
        >
          {statusLabel}
        </span>
      </div>

      {/* Details */}
      <div className="text-xs text-gray-500 mt-1">
        Patient: {patientName}
        {patientId ? ` (ID: ${patientId})` : ""} • Doctor: {doctorName}
      </div>

      <div className="text-xs text-gray-500 mt-1">
        💊 Medicines: {medsCount}
        {created && (
          <> • 📅 {new Date(created).toLocaleString()}</>
        )}
      </div>
    </div>
  );
}

function MissingMedicineRow({ m }) {
  const { patientName, doctorName, medicineId, quantity } = m;

  const quantityBadge =
    quantity <= 1
      ? "bg-red-50 text-red-700 border-red-200"
      : "bg-amber-50 text-amber-700 border-amber-200";

  return (
    <div className="rounded-2xl border p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 bg-white hover:bg-gray-50 transition">
      
      {/* Info */}
      <div className="flex flex-col sm:flex-row sm:gap-6 w-full min-w-0">
        <div className="text-sm text-gray-900 font-semibold truncate">
          Patient: {patientName}
        </div>
        <div className="text-sm text-gray-700 truncate">
          Doctor: {doctorName}
        </div>
        <div className="text-sm text-gray-700 truncate">
          Medicine ID: {medicineId}
        </div>
        <div
          className={`text-xs px-2 py-0.5 rounded-full border ${quantityBadge} font-medium`}
        >
          Qty: {quantity}
        </div>
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
