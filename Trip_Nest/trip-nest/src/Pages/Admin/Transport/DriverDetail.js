// src/Pages/Admin/Transport/DriverDetail.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

/* ---------- helpers ---------- */
    const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";

    const formatTel = (s) => {
    const d = String(s || "").replace(/\D/g, "").slice(0, 10);
    if (d.length !== 10) return s || "—";
    return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
    };

    /** Normalize ANY vehicle shape -> { id, label } */
    function normalizeVehicleOptions(arr = []) {
    return arr
        .map((v) => {
        const id =
            v?.id || v?._id || v?.vehicleId || v?.registrationNo || v?.numberPlate;
        const label =
            v?.label ||
            v?.name ||
            v?.title ||
            v?.registrationNo ||
            v?.numberPlate ||
            [v?.make, v?.model, v?.year].filter(Boolean).join(" ");
        if (!id || !label) return null;
        return { id: String(id), label: String(label) };
        })
        .filter(Boolean);
    }

    /** Normalize the driver's vehicles field into an array of IDs */
    function normalizeDriverVehicleIds(vehicles) {
    if (!Array.isArray(vehicles)) return [];
    return vehicles.map((v) => (typeof v === "string" ? v : v?.id || v?._id || v?.vehicleId || v?.registrationNo || v?.numberPlate)).filter(Boolean).map(String);
    }

    export default function DriverDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const baseUrl = useMemo(
        () => process.env.REACT_APP_API_URL || "http://localhost:4000/api",
        []
    );

    const [driver, setDriver] = useState(null);

    const [vehicleOptions, setVehicleOptions] = useState([]);
    const [vehicleMap, setVehicleMap] = useState({});

    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(true);

    // edit state
    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState({
        fullName: "",
        gender: "",
        phone: "",
        emergencyPhone: "",
        address: "",
        licenseNumber: "",
        licenseExpiry: "",
        experienceYears: "",
        vehicles: [],
        healthInfo: "",
    });
    const [formErrors, setFormErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        let live = true;
        setLoading(true);
        setErr("");

        Promise.all([
        fetch(`${baseUrl}/drivers/${id}`, { credentials: "include" }).then(async (r) => {
            const data = await r.json();
            if (!r.ok) throw new Error(data?.error || "Failed to load driver");
            return data;
        }),
        fetch(`${baseUrl}/vehicles`, { credentials: "include" })
            .then((r) => r.json())
            .catch(() => []),
        ])
        .then(([d, vehicles]) => {
            if (!live) return;

            // Normalize vehicles list for select & chips
            const raw = Array.isArray(vehicles) ? vehicles : vehicles?.items || [];
            const opts = normalizeVehicleOptions(raw);
            setVehicleOptions(opts);
            setVehicleMap(opts.reduce((acc, v) => ((acc[v.id] = v.label), acc), {}));

            // Normalize driver + prime edit form
            const vehicleIds = normalizeDriverVehicleIds(d.vehicles);

            setDriver({
            ...d,
            vehicles: vehicleIds,
            });

            setForm({
            fullName: d.fullName || "",
            gender: d.gender || "",
            phone: d.phone || "",
            emergencyPhone: d.emergencyPhone || "",
            address: d.address || "",
            licenseNumber: d.licenseNumber || "",
            licenseExpiry: d.licenseExpiry ? d.licenseExpiry.slice(0, 10) : "",
            experienceYears: d.experienceYears ?? "",
            vehicles: vehicleIds,
            healthInfo: d.healthInfo || "",
            });
        })
        .catch((e) => {
            if (!live) return;
            console.error(e);
            setErr(e.message || "Something went wrong");
        })
        .finally(() => live && setLoading(false));

        return () => {
        live = false;
        };
    }, [baseUrl, id]);

    const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    async function handleSave() {
        try {
        setSaving(true);
        setFormErrors({});
        const payload = {
            fullName: form.fullName.trim(),
            gender: form.gender,
            phone: String(form.phone).replace(/\D/g, ""),
            emergencyPhone: String(form.emergencyPhone).replace(/\D/g, ""),
            address: form.address.trim(),
            licenseNumber: String(form.licenseNumber).toUpperCase().trim(),
            licenseExpiry: form.licenseExpiry || null,
            experienceYears: form.experienceYears === "" ? "" : Number(form.experienceYears),
            vehicles: Array.isArray(form.vehicles) ? form.vehicles : [],
            healthInfo: (form.healthInfo || "").trim(),
        };

        const resp = await fetch(`${baseUrl}/drivers/${id}`, {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify(payload),
        });
        const ct = resp.headers.get("content-type") || "";
        const data = ct.includes("application/json") ? await resp.json() : await resp.text();

        if (!resp.ok) {
            if (data && typeof data === "object" && data.errors) setFormErrors(data.errors);
            throw new Error((data && data.error) || `Update failed (${resp.status})`);
        }

        // reflect in UI (normalize vehicles again just in case)
        const vehicleIds = normalizeDriverVehicleIds(data.vehicles);
        setDriver({ ...data, vehicles: vehicleIds });
        setForm((f) => ({ ...f, vehicles: vehicleIds }));
        setIsEditing(false);
        } catch (e) {
        console.error(e);
        alert(e.message || "Update failed");
        } finally {
        setSaving(false);
        }
    }

    async function handleDelete() {
        const yes = window.confirm("Delete this driver permanently?");
        if (!yes) return;
        const conf = window.prompt('Type "DELETE" to confirm:');
        if (conf !== "DELETE") return;

        try {
        setDeleting(true);
        const resp = await fetch(`${baseUrl}/drivers/${id}`, { method: "DELETE", credentials: "include" });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) throw new Error(data?.error || "Delete failed");
        navigate("/admin/transport-admin"); // adjust if your list route differs
        } catch (e) {
        console.error(e);
        alert(e.message || "Delete failed");
        } finally {
        setDeleting(false);
        }
    }

    if (loading) {
        return (
        <div className="min-h-screen bg-white">
            <div className="mx-auto max-w-6xl px-6 md:px-10 py-10">
            <div className="h-8 w-48 bg-gray-200 animate-pulse rounded mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 h-64 bg-gray-200 animate-pulse rounded-2xl" />
                <div className="h-64 bg-gray-200 animate-pulse rounded-2xl" />
            </div>
            </div>
        </div>
        );
    }

    if (err) {
        return (
        <div className="min-h-screen bg-white">
            <div className="mx-auto max-w-3xl px-6 md:px-10 py-10">
            <div className="text-red-600 mb-6">Error: {err}</div>
            <button
                onClick={() => navigate(-1)}
                className="rounded-full border border-gray-900 px-5 py-2 text-sm hover:bg-gray-900 hover:text-white transition"
            >
                ← Back
            </button>
            </div>
        </div>
        );
    }

    if (!driver) {
        return (
        <div className="min-h-screen bg-white">
            <div className="mx-auto max-w-3xl px-6 md:px-10 py-10">
            <div className="text-gray-700 mb-6">Driver not found.</div>
            <button
                onClick={() => navigate('admin/transport-admin')}
                className="rounded-full border border-blue-600 px-5 py-2 text-sm hover:bg-blue-600 hover:text-white transition"
            >
                ← Back
            </button>
            </div>
        </div>
        );
    }

    const vehicleChips = (driver.vehicles || []).map((vid) => vehicleMap[vid] || vid);

    return (
        <div className="min-h-screen bg-white text-gray-900">
        <div className="mx-auto max-w-6xl px-6 md:px-10 py-8">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
            <div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                {driver.fullName || "Unnamed Driver"}
                </h1>
                <div className="mt-1 text-sm text-gray-600">
                Created {new Date(driver.createdAt).toLocaleString()} • Updated{" "}
                {new Date(driver.updatedAt).toLocaleString()}
                </div>
            </div>
            <div className="flex gap-2 print:hidden">
                {!isEditing ? (
                <>
                    <button
                    onClick={() => navigate(-1)}
                    className="rounded-full border border-blue-300 px-4 py-2 text-sm hover:bg-blue-200 transition"
                    >
                    ← Back
                    </button>
                    <button
                    onClick={() => setIsEditing(true)}
                    className="rounded-full border border-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-600 hover:text-white transition"
                    >
                    Edit
                    </button>
                    <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="rounded-full border border-red-600 text-red-600 px-4 py-2 text-sm font-medium hover:bg-red-600 hover:text-white transition disabled:opacity-60"
                    >
                    {deleting ? "Deleting..." : "Delete"}
                    </button>
                    <button
                    onClick={() => window.print()}
                    className="rounded-full border border-gray-300 px-4 py-2 text-sm hover:bg-blue-200 transition"
                    >
                    Print Page
                    </button>
                </>
                ) : (
                <>
                    <button
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-full border border-emerald-700 text-emerald-700 px-4 py-2 text-sm font-medium hover:bg-emerald-700 hover:text-white transition disabled:opacity-60"
                    >
                    {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                    onClick={() => {
                        setForm({
                        fullName: driver.fullName || "",
                        gender: driver.gender || "",
                        phone: driver.phone || "",
                        emergencyPhone: driver.emergencyPhone || "",
                        address: driver.address || "",
                        licenseNumber: driver.licenseNumber || "",
                        licenseExpiry: driver.licenseExpiry ? driver.licenseExpiry.slice(0, 10) : "",
                        experienceYears: driver.experienceYears ?? "",
                        vehicles: driver.vehicles || [],
                        healthInfo: driver.healthInfo || "",
                        });
                        setFormErrors({});
                        setIsEditing(false);
                    }}
                    className="rounded-full border border-gray-300 px-4 py-2 text-sm hover:bg-blue-200 transition"
                    >
                    Cancel
                    </button>
                </>
                )}
            </div>
            </div>

            {/* Content */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left column */}
            <div className="lg:col-span-2 space-y-6">
                {/* Profile / Edit form */}
                {!isEditing ? (
                <>
                    <div className="rounded-2xl border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold mb-4">Profile</h2>
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 text-sm">
                        <Row label="Full Name" value={driver.fullName || "—"} />
                        <Row label="Gender" value={driver.gender || "—"} />
                        <Row label="Phone" value={formatTel(driver.phone)} />
                        <Row label="Emergency Phone" value={formatTel(driver.emergencyPhone)} />
                        <Row label="Address" value={driver.address || "—"} full />
                    </dl>
                    </div>

                    <div className="rounded-2xl border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold mb-4">License</h2>
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 text-sm">
                        <Row label="License Number" value={driver.licenseNumber || "—"} />
                        <Row label="Expiry Date" value={fmtDate(driver.licenseExpiry)} />
                    </dl>
                    </div>

                    <div className="rounded-2xl border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold mb-2">Health Information</h2>
                    <p className="text-gray-700 whitespace-pre-wrap">
                        {driver.healthInfo?.trim() ? driver.healthInfo : "No health information provided."}
                    </p>
                    </div>
                </>
                ) : (
                <div className="rounded-2xl border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold mb-4">Edit Driver</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Field label="Full Name" error={formErrors.fullName}>
                        <input
                        className="w-full rounded-xl border px-3 py-2"
                        value={form.fullName}
                        onChange={(e) => setField("fullName", e.target.value)}
                        />
                        <Err>{formErrors.fullName}</Err>
                    </Field>

                    <Field label="Gender" error={formErrors.gender}>
                        <select
                        className="w-full rounded-xl border px-3 py-2"
                        value={form.gender}
                        onChange={(e) => setField("gender", e.target.value)}
                        >
                        <option value="">Select…</option>
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                        <option>Prefer not to say</option>
                        </select>
                        <Err>{formErrors.gender}</Err>
                    </Field>

                    <Field label="Phone" error={formErrors.phone}>
                        <input
                        className="w-full rounded-xl border px-3 py-2"
                        value={form.phone}
                        onChange={(e) => setField("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="0771234567"
                        />
                        <Err>{formErrors.phone}</Err>
                    </Field>

                    <Field label="Emergency Phone" error={formErrors.emergencyPhone}>
                        <input
                        className="w-full rounded-xl border px-3 py-2"
                        value={form.emergencyPhone}
                        onChange={(e) =>
                            setField("emergencyPhone", e.target.value.replace(/\D/g, "").slice(0, 10))
                        }
                        placeholder="0712345678"
                        />
                        <Err>{formErrors.emergencyPhone}</Err>
                    </Field>

                    <Field label="Address" error={formErrors.address} full>
                        <textarea
                        className="w-full rounded-xl border px-3 py-2"
                        rows={3}
                        value={form.address}
                        onChange={(e) => setField("address", e.target.value)}
                        />
                        <Err>{formErrors.address}</Err>
                    </Field>

                    <Field label="License Number" error={formErrors.licenseNumber}>
                        <input
                        className="w-full rounded-xl border px-3 py-2 uppercase tracking-wider"
                        value={form.licenseNumber}
                        onChange={(e) => setField("licenseNumber", e.target.value.toUpperCase())}
                        placeholder="1234567 / A1234567 / 123456789012"
                        />
                        <Err>{formErrors.licenseNumber}</Err>
                    </Field>

                    <Field label="License Expiry" error={formErrors.licenseExpiry}>
                        <input
                        type="date"
                        className="w-full rounded-xl border px-3 py-2"
                        value={form.licenseExpiry}
                        onChange={(e) => setField("licenseExpiry", e.target.value)}
                        />
                        <Err>{formErrors.licenseExpiry}</Err>
                    </Field>

                    <Field label="Experience (years)" error={formErrors.experienceYears}>
                        <input
                        className="w-full rounded-xl border px-3 py-2"
                        value={form.experienceYears}
                        onChange={(e) => setField("experienceYears", e.target.value.replace(/\D/g, ""))}
                        placeholder="5"
                        />
                        <Err>{formErrors.experienceYears}</Err>
                    </Field>

                    <Field label="Vehicles" error={formErrors.vehicles} full>
                        <select
                        multiple
                        size={4}
                        value={form.vehicles}
                        onChange={(e) =>
                            setField("vehicles", Array.from(e.target.selectedOptions).map((o) => o.value))
                        }
                        className="w-full rounded-xl border px-3 py-2"
                        >
                        {vehicleOptions.map((v) => (
                            <option key={v.id} value={v.id}>
                            {v.label}
                            </option>
                        ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple.</p>
                        <Err>{formErrors.vehicles}</Err>
                    </Field>

                    <Field label="Health Info" full>
                        <textarea
                        className="w-full rounded-xl border px-3 py-2"
                        rows={3}
                        value={form.healthInfo}
                        onChange={(e) => setField("healthInfo", e.target.value)}
                        />
                    </Field>
                    </div>
                </div>
                )}
            </div>

            {/* Right column */}
            <aside className="space-y-6">
                <div className="rounded-2xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold mb-4">Assignment</h2>
                {!isEditing ? (
                    <dl className="space-y-3 text-sm">
                    <div className="flex justify-between">
                        <dt className="text-gray-500">Experience (years)</dt>
                        <dd className="font-medium">{driver.experienceYears ?? "—"}</dd>
                    </div>
                    <div className="pt-2">
                        <div className="text-gray-500 mb-2">Vehicles</div>
                        {vehicleChips.length ? (
                        <div className="flex flex-wrap gap-2">
                            {vehicleChips.map((label, i) => (
                            <span
                                key={i}
                                className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium"
                            >
                                {label}
                            </span>
                            ))}
                        </div>
                        ) : (
                        <div className="text-sm">—</div>
                        )}
                    </div>
                    </dl>
                ) : (
                    <p className="text-sm text-gray-600">
                    Edit fields on the left, then click <b>Save</b>.
                    </p>
                )}
                </div>
            </aside>
            </div>
        </div>
        </div>
    );
    }

    /* ------- tiny UI helpers ------- */
    function Row({ label, value, full = false }) {
    return (
        <div className={full ? "md:col-span-2" : ""}>
        <div className="text-gray-500">{label}</div>
        <div className="font-medium">{value}</div>
        </div>
    );
    }

    function Field({ label, error, full = false, children }) {
    return (
        <div className={full ? "md:col-span-2" : ""}>
        <div className="text-gray-500 mb-1">{label}</div>
        {children}
        {error ? <div className="text-sm text-red-600 mt-1">{error}</div> : null}
        </div>
    );
    }
    function Err({ children }) {
    if (!children) return null;
    return <div className="text-sm text-red-600 mt-1">{children}</div>;
}
