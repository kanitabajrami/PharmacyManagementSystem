// src/pages/UserDashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * User Dashboard (Tailwind v4)
 * Based on your controllers:
 * - Medicines: GET all, search, low-stock, expiring-soon
 * - Invoices: GET all (currently [Authorize]), GET by id, POST create (User)
 * - Prescriptions: GET all/byId (Authorize), GET by patient/doctor (User)
 * - Suppliers: GET all/byId (Authorize)
 *
 * NOTE: Your backend currently allows any authenticated user to GET all invoices/prescriptions.
 * If you later add /api/invoices/me and /api/prescription/me, switch the endpoints here.
 */

const API_BASE = "https://localhost:7201";

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
      "User"
    );
  } catch {
    return "User";
  }
}

const TABS = [
  { id: "medicines", label: "Medicines" },
  { id: "invoices", label: "Invoices" },
  { id: "prescriptions", label: "Prescriptions" },
  { id: "suppliers", label: "Suppliers" },
];

export default function UserDashboard() {
  const navigate = useNavigate();

  const [tab, setTab] = useState("medicines");
  const [displayName, setDisplayName] = useState("User");
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
  

  // ===== Cart / Invoice create =====
  const [cart, setCart] = useState(() => {
  try {
    return JSON.parse(localStorage.getItem("cart") || "[]");
  } catch {
    return [];
  }
});

  const [prescriptionId, setPrescriptionId] = useState(""); // optional
  const cartTotal = useMemo(
    () => cart.reduce((s, it) => s + Number(it.price || 0) * Number(it.qty || 0), 0),
    [cart]
  );

  
  // ===== Invoices state =====
  const [invLoading, setInvLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);

  // ===== Prescriptions state =====
  const [rxLoading, setRxLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState([]);
  const [embg, setEmbg] = useState("");
  const [patientName, setPatientName] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [myPrescriptions, setMyPrescriptions] = useState([]);
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState("");

  // ===== Suppliers state =====
  const [supLoading, setSupLoading] = useState(true);
  const [suppliers, setSuppliers] = useState([]);
  const [supplierSearch, setSupplierSearch] = useState("");

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("roles");
    navigate("/login");
  }

  // ---------- LOADERS ----------
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

  async function loadInvoices() {
    setInvLoading(true);
    setError("");
    try {
      // If you later create /api/invoices/me, switch to that:
      // const data = await apiFetch("/api/invoices/me");
      const data = await apiFetch("/api/invoices");
      setInvoices(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Failed to load invoices.");
    } finally {
      setInvLoading(false);
    }
  }

  async function loadPrescriptionsAll() {
    setRxLoading(true);
    setError("");
    try {
      // Your controller route is api/PrescriptionController -> "Prescription" in route:
      // class name PrescriptionController + [Route("api/[controller]")] => /api/Prescription
      const data = await apiFetch("/api/Prescription");
      setPrescriptions(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Failed to load prescriptions.");
    } finally {
      setRxLoading(false);
    }
  }

 async function searchPrescriptions() {
  setRxLoading(true);
  setError("");

  try {
    const params = new URLSearchParams();

    const e = embg.trim();
    const pn = patientName.trim();
    const dn = doctorName.trim();

    // optional: EMBG only numbers
    if (e && !/^\d+$/.test(e)) {
      setError("EMBG must contain only numbers.");
      setRxLoading(false);
      return;
    }

    if (e) params.set("embg", e);
    if (pn) params.set("patientName", pn);
    if (dn) params.set("doctorName", dn);

    const data = await apiFetch(`/api/Prescription/search?${params.toString()}`);
    setPrescriptions(Array.isArray(data) ? data : []);
  } catch (e) {
    setError(e.message || "Search failed.");
  } finally {
    setRxLoading(false);
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

  // ---------- INIT ----------
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // ---------- CART ----------
  function addToCart(m) {
    const id = get(m, "id", "Id");
    const name = get(m, "name", "Name") || "Medicine";
    const price = Number(get(m, "price", "Price") || 0);
    const stock = Number(get(m, "quantity", "Quantity") || 0);

    if (!id || stock <= 0) return;

    setCart((prev) => {
      const existing = prev.find((x) => x.medicineId === id);
      if (!existing) return [...prev, { medicineId: id, name, price, qty: 1 }];

      const nextQty = Math.min(existing.qty + 1, stock);
      return prev.map((x) => (x.medicineId === id ? { ...x, qty: nextQty } : x));
    });
  }

  function setQty(medicineId, qty) {
    setCart((prev) =>
      prev
        .map((x) => (x.medicineId === medicineId ? { ...x, qty } : x))
        .filter((x) => x.qty > 0)
    );
  }

  function removeItem(medicineId) {
    setCart((prev) => prev.filter((x) => x.medicineId !== medicineId));
  }

  async function createInvoice() {
    if (cart.length === 0) {
      alert("Cart is empty.");
      return;
   
    }
   const payload = {
    items: cart.map((c) => ({ medicineId: c.medicineId, quantity: c.qty })),
    ...(prescriptionId.trim() ? { prescriptionId: Number(prescriptionId) } : {}),
  };


    try {
      await apiFetch("/api/invoices", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      alert("Invoice created!");
      setCart([]);
      setPrescriptionId("");

  

      // refresh meds + invoices
      if (viewMode === "all") await loadMedicinesAll();
      if (viewMode === "low") await loadMedicinesLow();
      if (viewMode === "expiring") await loadMedicinesExpiring();
      await loadInvoices();
      setTab("invoices");
    } catch (e) {
      alert(e.message || "Failed to create invoice.");
    }
  }
  useEffect(() => {
      localStorage.setItem("cart", JSON.stringify(cart));
    }, [cart]);


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

async function applyPrescriptionToCart(pId) {
  if (!pId) return;

  try {
    const rx = await apiFetch(`/api/Prescription/${pId}`);

    const meds = rx?.medicines || rx?.Medicines; // depending on JSON casing
    if (!Array.isArray(meds) || meds.length === 0) {
      alert("This prescription has no medicines.");
      return;
    }

    // Ensure medicine list exists (so we can get name + price)
    let medsList = medicines;
    if (!Array.isArray(medsList) || medsList.length === 0) {
      const loaded = await apiFetch("/api/medicines");
      medsList = Array.isArray(loaded) ? loaded : [];
      setMedicines(medsList);
    }

    const nextCart = meds.map((it) => {
      const medId = it.medicineId ?? it.MedicineId;
      const qty = Number(it.quantity ?? it.Quantity ?? 1);

      const med = medsList.find((m) => get(m, "id", "Id") === medId);

      return {
        medicineId: medId,
        name: med ? get(med, "name", "Name") : `Medicine #${medId}`,
        price: med ? Number(get(med, "price", "Price") || 0) : 0,
        qty,
      };
    });

    setCart(nextCart);

    alert("Prescription medicines added to cart.");
  } catch (e) {
    alert(e.message || "Failed to load prescription.");
  }
}

async function loadMyPrescriptions() {
  try {
    // ✅ ideally you create backend endpoint: GET /api/Prescription/patient/{patientIdFromToken}
    // But with your current backend, you can at least load all and filter client-side if needed.
    const data = await apiFetch("/api/Prescription");
    setMyPrescriptions(Array.isArray(data) ? data : []);
  } catch {
    setMyPrescriptions([]);
  }
}
 useEffect(() => {
     loadMyPrescriptions();
   }, []);

async function addPrescriptionToInvoice(rxId) {
  setTab("medicines");                 // go to medicines/cart view
  setPrescriptionId(String(rxId));     // keep payload correct
  setSelectedPrescriptionId(String(rxId)); // if you use dropdown too
  await applyPrescriptionToCart(String(rxId)); // fills cart
}

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
              <div className="text-xs text-gray-500 -mt-0.5">User dashboard</div>
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
            {/* Medicines list */}
            <div className="lg:col-span-2 bg-white rounded-3xl border shadow-sm">
              <div className="p-5 border-b">
                <div className="flex items-start sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Medicines</h2>
                    <p className="text-sm text-gray-500">
                      Search, filter, and add to cart.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setViewMode("all");
                        loadMedicinesAll();
                      }}
                      className={
                        "px-3 h-9 rounded-xl text-sm font-medium border transition " +
                        (viewMode === "all" ? "bg-gray-900 text-white border-gray-900" : "bg-white hover:bg-gray-50")
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
                        (viewMode === "low" ? "bg-gray-900 text-white border-gray-900" : "bg-white hover:bg-gray-50")
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
                      setViewMode("all"); // search is its own view, but we treat it as custom
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
                      <MedicineRow key={get(m, "id", "Id")} med={m} onAdd={() => addToCart(m)} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Cart / Create invoice */}
            <div className="bg-white rounded-3xl border shadow-sm sticky top-[76px] h-fit">
             

              <div className="p-5">
               <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Prescription
              </label>

            <select
              value={selectedPrescriptionId}
              onChange={async (e) => {
                const id = e.target.value;
                setSelectedPrescriptionId(id);
                setPrescriptionId(id); // keep your invoice payload using prescriptionId
                if (id) await applyPrescriptionToCart(id);
              }}
              className="w-full h-10 px-3 rounded-xl border text-sm bg-white outline-none
                        focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
            >
              <option value="">— No prescription —</option>
              {myPrescriptions.map((p) => {
                const id = get(p, "id", "Id");
                const doctor = get(p, "doctorName", "DoctorName") || "Unknown doctor";

                const meds = get(p, "medicines", "Medicines") || [];
                const medsText = Array.isArray(meds) && meds.length > 0
                  ? meds
                      .slice(0, 3)
                      .map((m) => {
                        const mid = m.medicineId ?? m.MedicineId;
                        const qty = m.quantity ?? m.Quantity;
                        return `#${mid} x${qty}`;
                      })
                      .join(", ") + (meds.length > 3 ? ` +${meds.length - 3} more` : "")
                  : "No meds";

                return (
                  <option key={id} value={id}>
                    #{id} • Dr: {doctor} • {medsText}
                  </option>
                );
              })}

            </select>

        <button
          type="button"
          onClick={async () => {
            if (!myPrescriptions.length) return alert("No prescriptions found.");
            const sorted = [...myPrescriptions].sort(
              (a, b) => new Date(get(b, "dateIssued", "DateIssued")) - new Date(get(a, "dateIssued", "DateIssued"))
            );
            const latest = sorted[0];
            const id = get(latest, "id", "Id");
            setSelectedPrescriptionId(String(id));
            setPrescriptionId(String(id));
            await applyPrescriptionToCart(String(id));
          }}
          className="mt-3 w-full h-10 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition"
        >
          Use latest prescription
        </button>




                <div className="mt-4">
                  {cart.length === 0 ? (
                    <div className="rounded-2xl border bg-gray-50 px-4 py-6 text-center">
                      <div className="text-sm font-medium text-gray-900">Cart is empty</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Add medicines from the list.
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {cart.map((it) => (
                        <CartRow
                          key={it.medicineId}
                          item={it}
                          onMinus={() => setQty(it.medicineId, Math.max(0, it.qty - 1))}
                          onPlus={() => setQty(it.medicineId, it.qty + 1)}
                          onRemove={() => removeItem(it.medicineId)}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <div className="text-sm text-gray-600">Total</div>
                  <div className="text-lg font-semibold text-gray-900">{money(cartTotal)}</div>
                </div>

                <button
                  onClick={createInvoice}
                  disabled={cart.length === 0}
                  className="mt-4 w-full h-11 rounded-xl font-semibold text-white shadow
                             bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99]
                             disabled:opacity-60 disabled:cursor-not-allowed transition"
                >
                  Create invoice
                </button>

                <button
                  onClick={() => setCart([])}
                  disabled={cart.length === 0}
                  className="mt-3 w-full h-11 rounded-xl font-semibold border bg-white hover:bg-gray-50 transition
                             disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Clear cart
                </button>

                
              </div>
            </div>
          </div>
        )}

        {tab === "invoices" && (
          <div className="bg-white rounded-3xl border shadow-sm">
            <div className="p-5 border-b flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Invoices</h2>
              </div>
              <button
                onClick={loadInvoices}
                className="px-3 h-9 rounded-xl text-sm font-medium border bg-white hover:bg-gray-50 transition"
              >
                Refresh
              </button>
            </div>

            <div className="p-5">
              {invLoading ? (
                <Skeleton rows={6} />
              ) : invoices.length === 0 ? (
                <Empty title="No invoices" text="Create one from Medicines tab." />
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
                      <InvoiceRow key={get(inv, "id", "Id")} inv={inv} />
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "prescriptions" && (
          <div className="bg-white rounded-3xl border shadow-sm">
            <div className="p-5 border-b">
              <div className="flex items-start sm:items-center justify-between gap-3">
                
                <div className="flex gap-2">
                  <button
                    onClick={loadPrescriptionsAll}
                    className="px-3 h-9 rounded-xl text-sm font-medium border bg-white hover:bg-gray-50 transition"
                  >
                    All
                  </button>
                
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                value={embg}
                onChange={(e) => setEmbg(e.target.value)}
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="EMBG"
                 className="w-full h-10 px-3 rounded-xl border text-sm outline-none
                          focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
              />


              <input
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Patient name…"
                className="w-full h-10 px-3 rounded-xl border text-sm outline-none
                          focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
              />

              <input
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="Doctor name…"
                className="w-full h-10 px-3 rounded-xl border text-sm outline-none
                          focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
              />
            </div>

            <div className="mt-3 flex gap-2">
              <button
                onClick={searchPrescriptions}
                className="px-3 h-9 rounded-xl text-sm font-medium border bg-white hover:bg-gray-50 transition"
              >
                Search
              </button>

              <button
                onClick={() => {
                  setEmbg("");
                  setPatientName("");
                  setDoctorName("");
                  loadPrescriptionsAll();
                }}
                className="px-3 h-9 rounded-xl text-sm font-medium border bg-white hover:bg-gray-50 transition"
              >
                Clear
              </button>
            </div>

            </div>

            <div className="p-5">
              {rxLoading ? (
                <Skeleton rows={6} />
              ) : prescriptions.length === 0 ? (
                <Empty title="No prescriptions" text="Try patientId/doctorName." />
              ) : (
                <div className="space-y-3">
                  {prescriptions.map((rx) => (
                  <PrescriptionRow
                    key={get(rx, "id", "Id")}
                    rx={rx}
                    onAddToInvoice={addPrescriptionToInvoice}
                  />
                    ))}

                </div>
              )}
            </div>
          </div>
        )}

        {tab === "suppliers" && (
          <div className="bg-white rounded-3xl border shadow-sm">
            <div className="p-5 border-b flex items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Suppliers</h2>
              
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
              onToggle={(id, isActive) =>
                isActive ? deactivateSupplier(id) : reactivateSupplier(id)
              }
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

/* ===================== UI PIECES ===================== */

function MedicineRow({ med, onAdd }) {
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
    <div className="rounded-2xl border p-4 flex items-center justify-between gap-3">
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
          onClick={onAdd}
          disabled={!id || qty <= 0}
          className="px-3 h-10 rounded-xl text-sm font-semibold text-white
                     bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          Add
        </button>
      </div>
    </div>
  );
}

function CartRow({ item, onMinus, onPlus, onRemove }) {
  return (
    <div className="rounded-2xl border p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-medium text-gray-900 truncate">{item.name}</div>
          <div className="text-xs text-gray-500 mt-0.5">
            {money(item.price)} each
          </div>
        </div>

        <button
          onClick={onRemove}
          className="text-xs px-2 py-1 rounded-lg border bg-white hover:bg-gray-50 transition"
        >
          Remove
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="inline-flex items-center rounded-xl border overflow-hidden">
          <button type="button" onClick={onMinus} className="h-9 w-9 grid place-items-center hover:bg-gray-50 transition">
            −
          </button>
          <div className="h-9 w-12 grid place-items-center text-sm font-medium">{item.qty}</div>
          <button type="button" onClick={onPlus} className="h-9 w-9 grid place-items-center hover:bg-gray-50 transition">
            +
          </button>
        </div>

        <div className="text-sm font-semibold text-gray-900">
          {money(Number(item.price || 0) * Number(item.qty || 0))}
        </div>
      </div>
    </div>
  );
}

function InvoiceRow({ inv }) {
  const id = get(inv, "id", "Id");
  const total = Number(get(inv, "totalAmount", "TotalAmount") || 0);
  const date = get(inv, "dateCreated", "DateCreated");
  const userName = get(inv, "userName", "UserName");

  return (
    <div className="rounded-2xl border p-4 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="font-semibold text-gray-900 truncate">
          Invoice #{id} 
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

function PrescriptionRow({ rx, onAddToInvoice }) {
  const id = get(rx, "id", "Id");
  const patient = get(rx, "patientName", "PatientName") || get(rx, "patientId", "PatientId");
  const doctor = get(rx, "doctorName", "DoctorName");
  const status = get(rx, "status", "Status");
  const issued = get(rx, "dateIssued", "DateIssued");

  const meds = get(rx, "medicines", "Medicines") || [];

  return (
    <div className="rounded-2xl border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold text-gray-900 truncate">
            Prescription #{id}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {patient ? `Patient: ${patient} • ` : ""}
            {doctor ? `Doctor: ${doctor}` : ""}
          </div>
          {issued && (
            <div className="text-xs text-gray-400 mt-1">
              Issued: {new Date(issued).toLocaleDateString()}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          {status !== undefined && (
            <span className="text-xs px-2 py-0.5 rounded-full border bg-gray-50 text-gray-700">
              {String(status)}
            </span>
          )}

          <button
            type="button"
            onClick={() => onAddToInvoice(id)}
            className="px-3 h-9 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition"
          >
            Add to invoice
          </button>
        </div>
      </div>

      {/* Medicines + quantities */}
      <div className="mt-3">
        <div className="text-xs font-medium text-gray-700 mb-2">Medicines</div>

        {!Array.isArray(meds) || meds.length === 0 ? (
          <div className="text-xs text-gray-400">No medicines</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {meds.map((m, idx) => {
              const medId = m.medicineId ?? m.MedicineId;
              const qty = m.quantity ?? m.Quantity;

              return (
                <span
                  key={`${id}-${medId}-${idx}`}
                  className="text-xs px-2 py-1 rounded-xl border bg-white"
                >
                  Med #{medId} • Qty: {qty}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}



function SupplierRow({ s, onToggle }) {
  const id = get(s, "id", "Id");
  const isActive = get(s, "isActive", "IsActive");

  return (
    <div className="rounded-2xl border p-4 flex items-center justify-between gap-3 bg-white hover:bg-gray-50 transition">
      <div className="min-w-0">
        <div className="font-semibold text-gray-900 truncate">
          {get(s, "name", "Name")}
        </div>
        <div className="text-xs text-gray-500 truncate">
          {get(s, "email", "Email")} • {get(s, "phone", "Phone")}
        </div>
      </div>

      <div className="flex gap-2">
        {/* ✅ Toggle button */}
        <button
          type="button"
          onClick={() => onToggle(id, isActive)}
          className={
            "px-3 h-9 rounded-xl text-sm font-medium transition " +
            (isActive
              ? "border bg-white hover:bg-gray-50 text-gray-900"
              : "text-white bg-indigo-600 hover:bg-indigo-700")
          }
        >
          {isActive ? "Deactivate" : "Reactivate"}
        </button>
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
