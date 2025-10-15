import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const VEHICLE_TYPES = ["Car", "Van", "Bus", "Lorry", "Motorcycle", "SUV", "Pickup", "Three-Wheeler"];
const FUEL_TYPES = ["Petrol", "Diesel", "Hybrid", "Electric"];
const TRANSMISSIONS = ["Manual", "Automatic"];
const CONDITIONS = ["Good", "Needs Repair", "Inactive"];
const currentYear = new Date().getFullYear();

export default function VehicleDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const baseUrl = useMemo(
        () => process.env.REACT_APP_API_URL || "http://localhost:4000/api",
        []
    );

    const [vehicle, setVehicle] = useState(null);
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(true);

    // drivers for assignment dropdown
    const [drivers, setDrivers] = useState([]);
    const [driversLoading, setDriversLoading] = useState(true);

    // edit state
    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState({
        numberPlate: "",
        vehicleType: "",
        vehicleModel: "",
        manufacturer: "",
        yearOfManufacture: "",
        registrationNumber: "",
        chassisNumber: "",
        engineNumber: "",
        insurancePolicyNumber: "",
        insuranceExpiry: "",
        revenueLicenseExpiry: "",
        fuelType: "",
        transmission: "",
        seatingCapacity: "",
        lastServiceDate: "",
        currentCondition: "",
        assignedDriverId: "",
    });
    const [formErrors, setFormErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // load vehicle + drivers
    useEffect(() => {
        let live = true;
        setLoading(true);
        setErr("");

        const veh = fetch(`${baseUrl}/vehicles/${id}`, { credentials: "include" })
        .then(async (r) => {
            const data = await r.json();
            if (!r.ok) throw new Error(data?.error || "Failed to load vehicle");
            return data;
        });

        const drs = fetch(`${baseUrl}/drivers`, { credentials: "include" })
        .then((r) => r.json())
        .catch(() => []);

        Promise.all([veh, drs])
        .then(([v, d]) => {
            if (!live) return;
            setVehicle(v);

            // drivers dropdown
            const arr = Array.isArray(d) ? d : d.items || [];
            setDrivers(arr);
            setDriversLoading(false);

            const driverId =
            typeof v.assignedDriverId === "object" && v.assignedDriverId
                ? v.assignedDriverId._id
                : v.assignedDriverId || "";

            setForm({
            numberPlate: v.numberPlate || "",
            vehicleType: v.vehicleType || "",
            vehicleModel: v.vehicleModel || "",
            manufacturer: v.manufacturer || "",
            yearOfManufacture: v.yearOfManufacture ?? "",
            registrationNumber: v.registrationNumber || "",
            chassisNumber: v.chassisNumber || "",
            engineNumber: v.engineNumber || "",
            insurancePolicyNumber: v.insurancePolicyNumber || "",
            insuranceExpiry: v.insuranceExpiry ? v.insuranceExpiry.slice(0, 10) : "",
            revenueLicenseExpiry: v.revenueLicenseExpiry ? v.revenueLicenseExpiry.slice(0, 10) : "",
            fuelType: v.fuelType || "",
            transmission: v.transmission || "",
            seatingCapacity: v.seatingCapacity ?? "",
            lastServiceDate: v.lastServiceDate ? v.lastServiceDate.slice(0, 10) : "",
            currentCondition: v.currentCondition || "",
            assignedDriverId: driverId,
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

    const fmtDate = (d) =>
        d ? new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";

    const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    async function handleSave() {
        try {
        setSaving(true);
        setFormErrors({});

        const payload = {
            // trim/normalize a bit; backend will validate
            numberPlate: String(form.numberPlate).toUpperCase().trim(),
            vehicleType: form.vehicleType,
            vehicleModel: String(form.vehicleModel).trim(),
            manufacturer: String(form.manufacturer).trim(),
            yearOfManufacture: form.yearOfManufacture === "" ? "" : Number(form.yearOfManufacture),

            registrationNumber: String(form.registrationNumber).toUpperCase().trim(),
            chassisNumber: String(form.chassisNumber).toUpperCase().trim(), // required only (no VIN validation)
            engineNumber: String(form.engineNumber).toUpperCase().trim(),
            insurancePolicyNumber: String(form.insurancePolicyNumber).trim(),
            insuranceExpiry: form.insuranceExpiry || null,
            revenueLicenseExpiry: form.revenueLicenseExpiry || null,

            fuelType: form.fuelType,
            transmission: form.transmission,
            seatingCapacity: form.seatingCapacity === "" ? "" : Number(form.seatingCapacity),

            lastServiceDate: form.lastServiceDate || null,
            currentCondition: form.currentCondition,

            assignedDriverId: form.assignedDriverId || null,
        };

        const resp = await fetch(`${baseUrl}/vehicles/${id}`, {
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

        setVehicle(data);
        setIsEditing(false);
        } catch (e) {
        console.error(e);
        alert(e.message || "Update failed");
        } finally {
        setSaving(false);
        }
    }

    async function handleDelete() {
        const yes = window.confirm("Delete this vehicle permanently?");
        if (!yes) return;
        const conf = window.prompt('Type "DELETE" to confirm:');
        if (conf !== "DELETE") return;

        try {
        setDeleting(true);
        const resp = await fetch(`${baseUrl}/vehicles/${id}`, {
            method: "DELETE",
            credentials: "include",
        });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) throw new Error(data?.error || "Delete failed");
        // go back to your list page; change path if different
        navigate("/admin/transport-admin");
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

    if (!vehicle) {
        return (
        <div className="min-h-screen bg-white">
            <div className="mx-auto max-w-3xl px-6 md:px-10 py-10">
            <div className="text-gray-700 mb-6">Vehicle not found.</div>
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

    const assignedDriverName =
        typeof vehicle.assignedDriverId === "object" && vehicle.assignedDriverId
        ? vehicle.assignedDriverId.fullName
        : (drivers.find((d) => d._id === form.assignedDriverId)?.fullName) || "—";

    return (
        <div className="min-h-screen bg-white text-gray-900">
        <div className="mx-auto max-w-6xl px-6 md:px-10 py-8">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
            <div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                {vehicle.numberPlate || "Unnamed Vehicle"}
                </h1>
                <div className="mt-1 text-sm text-gray-600">
                Created {new Date(vehicle.createdAt).toLocaleString()} • Updated{" "}
                {new Date(vehicle.updatedAt).toLocaleString()}
                </div>
            </div>
            <div className="flex gap-2 print:hidden">
                {!isEditing ? (
                <>
                    <button
                    onClick={() => navigate(-1)}
                    className="rounded-full border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100 transition"
                    >
                    ← Back
                    </button>
                    <button
                    onClick={() => setIsEditing(true)}
                    className="rounded-full border border-gray-900 px-4 py-2 text-sm font-medium hover:bg-gray-900 hover:text-white transition"
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
                    className="rounded-full border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100 transition"
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
                        // reset to current vehicle and exit edit
                        const v = vehicle;
                        const driverId =
                        typeof v.assignedDriverId === "object" && v.assignedDriverId
                            ? v.assignedDriverId._id
                            : v.assignedDriverId || "";
                        setForm({
                        numberPlate: v.numberPlate || "",
                        vehicleType: v.vehicleType || "",
                        vehicleModel: v.vehicleModel || "",
                        manufacturer: v.manufacturer || "",
                        yearOfManufacture: v.yearOfManufacture ?? "",
                        registrationNumber: v.registrationNumber || "",
                        chassisNumber: v.chassisNumber || "",
                        engineNumber: v.engineNumber || "",
                        insurancePolicyNumber: v.insurancePolicyNumber || "",
                        insuranceExpiry: v.insuranceExpiry ? v.insuranceExpiry.slice(0, 10) : "",
                        revenueLicenseExpiry: v.revenueLicenseExpiry ? v.revenueLicenseExpiry.slice(0, 10) : "",
                        fuelType: v.fuelType || "",
                        transmission: v.transmission || "",
                        seatingCapacity: v.seatingCapacity ?? "",
                        lastServiceDate: v.lastServiceDate ? v.lastServiceDate.slice(0, 10) : "",
                        currentCondition: v.currentCondition || "",
                        assignedDriverId: driverId,
                        });
                        setFormErrors({});
                        setIsEditing(false);
                    }}
                    className="rounded-full border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100 transition"
                    >
                    Cancel
                    </button>
                </>
                )}
            </div>
            </div>

            {/* Content */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                {!isEditing ? (
                <>
                    <Card title="Vehicle">
                    <Grid>
                        <Row label="Type">{vehicle.vehicleType || "—"}</Row>
                        <Row label="Model">{vehicle.vehicleModel || "—"}</Row>
                        <Row label="Manufacturer">{vehicle.manufacturer || "—"}</Row>
                        <Row label="Year">{vehicle.yearOfManufacture ?? "—"}</Row>
                    </Grid>
                    </Card>

                    <Card title="Registration & Legal">
                    <Grid>
                        <Row label="Registration No.">{vehicle.registrationNumber || "—"}</Row>
                        <Row label="Chassis Number">{vehicle.chassisNumber || "—"}</Row>
                        <Row label="Engine No.">{vehicle.engineNumber || "—"}</Row>
                        <Row label="Insurance Policy">{vehicle.insurancePolicyNumber || "—"}</Row>
                        <Row label="Insurance Expiry">{fmtDate(vehicle.insuranceExpiry)}</Row>
                        <Row label="Revenue License Expiry">{fmtDate(vehicle.revenueLicenseExpiry)}</Row>
                    </Grid>
                    </Card>

                    <Card title="Specs & Status">
                    <Grid>
                        <Row label="Fuel">{vehicle.fuelType || "—"}</Row>
                        <Row label="Transmission">{vehicle.transmission || "—"}</Row>
                        <Row label="Seats">{vehicle.seatingCapacity ?? "—"}</Row>
                        <Row label="Last Service">{fmtDate(vehicle.lastServiceDate)}</Row>
                        <Row label="Condition">{vehicle.currentCondition || "—"}</Row>
                        <Row label="Assigned Driver">{assignedDriverName}</Row>
                    </Grid>
                    </Card>
                </>
                ) : (
                <Card title="Edit Vehicle">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Field label="Number Plate" error={formErrors.numberPlate}>
                        <input
                        className="w-full rounded-xl border px-3 py-2 uppercase"
                        value={form.numberPlate}
                        onChange={(e) => setField("numberPlate", e.target.value.toUpperCase())}
                        placeholder="WP CAE 1234"
                        />
                        <Err>{formErrors.numberPlate}</Err>
                    </Field>

                    <Field label="Vehicle Type" error={formErrors.vehicleType}>
                        <select
                        className="w-full rounded-xl border px-3 py-2"
                        value={form.vehicleType}
                        onChange={(e) => setField("vehicleType", e.target.value)}
                        >
                        <option value="">Select…</option>
                        {VEHICLE_TYPES.map((t) => (
                            <option key={t} value={t}>
                            {t}
                            </option>
                        ))}
                        </select>
                        <Err>{formErrors.vehicleType}</Err>
                    </Field>

                    <Field label="Model" error={formErrors.vehicleModel}>
                        <input
                        className="w-full rounded-xl border px-3 py-2"
                        value={form.vehicleModel}
                        onChange={(e) => setField("vehicleModel", e.target.value)}
                        />
                        <Err>{formErrors.vehicleModel}</Err>
                    </Field>

                    <Field label="Manufacturer" error={formErrors.manufacturer}>
                        <input
                        className="w-full rounded-xl border px-3 py-2"
                        value={form.manufacturer}
                        onChange={(e) => setField("manufacturer", e.target.value)}
                        />
                        <Err>{formErrors.manufacturer}</Err>
                    </Field>

                    <Field label="Year of Manufacture" error={formErrors.yearOfManufacture}>
                        <input
                        className="w-full rounded-xl border px-3 py-2"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={form.yearOfManufacture}
                        onChange={(e) => setField("yearOfManufacture", e.target.value.replace(/\D/g, "").slice(0, 4))}
                        placeholder={`${currentYear}`}
                        />
                        <Err>{formErrors.yearOfManufacture}</Err>
                    </Field>

                    <Field label="Registration Number" error={formErrors.registrationNumber}>
                        <input
                        className="w-full rounded-xl border px-3 py-2 uppercase"
                        value={form.registrationNumber}
                        onChange={(e) => setField("registrationNumber", e.target.value.toUpperCase())}
                        placeholder="ABC-1234 / AB 1234 / 1 Sri 234"
                        />
                        <Err>{formErrors.registrationNumber}</Err>
                    </Field>

                    {/* CHANGED: label, placeholder, and removed strict length slicing */}
                    <Field label="Chassis Number" error={formErrors.chassisNumber}>
                        <input
                        className="w-full rounded-xl border px-3 py-2 uppercase"
                        value={form.chassisNumber}
                        onChange={(e) => setField("chassisNumber", e.target.value.toUpperCase())}
                        placeholder="Enter chassis number"
                        />
                        <Err>{formErrors.chassisNumber}</Err>
                    </Field>

                    <Field label="Engine Number" error={formErrors.engineNumber}>
                        <input
                        className="w-full rounded-xl border px-3 py-2 uppercase"
                        value={form.engineNumber}
                        onChange={(e) => setField("engineNumber", e.target.value.toUpperCase().slice(0, 20))}
                        />
                        <Err>{formErrors.engineNumber}</Err>
                    </Field>

                    <Field label="Insurance Policy" error={formErrors.insurancePolicyNumber}>
                        <input
                        className="w-full rounded-xl border px-3 py-2"
                        value={form.insurancePolicyNumber}
                        onChange={(e) => setField("insurancePolicyNumber", e.target.value)}
                        />
                        <Err>{formErrors.insurancePolicyNumber}</Err>
                    </Field>

                    <Field label="Insurance Expiry" error={formErrors.insuranceExpiry}>
                        <input
                        type="date"
                        className="w-full rounded-xl border px-3 py-2"
                        value={form.insuranceExpiry}
                        onChange={(e) => setField("insuranceExpiry", e.target.value)}
                        />
                        <Err>{formErrors.insuranceExpiry}</Err>
                    </Field>

                    <Field label="Revenue License Expiry" error={formErrors.revenueLicenseExpiry}>
                        <input
                        type="date"
                        className="w-full rounded-xl border px-3 py-2"
                        value={form.revenueLicenseExpiry}
                        onChange={(e) => setField("revenueLicenseExpiry", e.target.value)}
                        />
                        <Err>{formErrors.revenueLicenseExpiry}</Err>
                    </Field>

                    <Field label="Fuel" error={formErrors.fuelType}>
                        <select
                        className="w-full rounded-xl border px-3 py-2"
                        value={form.fuelType}
                        onChange={(e) => setField("fuelType", e.target.value)}
                        >
                        <option value="">Select…</option>
                        {FUEL_TYPES.map((t) => (
                            <option key={t} value={t}>
                            {t}
                            </option>
                        ))}
                        </select>
                        <Err>{formErrors.fuelType}</Err>
                    </Field>

                    <Field label="Transmission" error={formErrors.transmission}>
                        <select
                        className="w-full rounded-xl border px-3 py-2"
                        value={form.transmission}
                        onChange={(e) => setField("transmission", e.target.value)}
                        >
                        <option value="">Select…</option>
                        {TRANSMISSIONS.map((t) => (
                            <option key={t} value={t}>
                            {t}
                            </option>
                        ))}
                        </select>
                        <Err>{formErrors.transmission}</Err>
                    </Field>

                    <Field label="Seating Capacity" error={formErrors.seatingCapacity}>
                        <input
                        className="w-full rounded-xl border px-3 py-2"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={form.seatingCapacity}
                        onChange={(e) => setField("seatingCapacity", e.target.value.replace(/\D/g, "").slice(0, 3))}
                        placeholder="4"
                        />
                        <Err>{formErrors.seatingCapacity}</Err>
                    </Field>

                    <Field label="Last Service Date" error={formErrors.lastServiceDate}>
                        <input
                        type="date"
                        className="w-full rounded-xl border px-3 py-2"
                        value={form.lastServiceDate}
                        onChange={(e) => setField("lastServiceDate", e.target.value)}
                        />
                        <Err>{formErrors.lastServiceDate}</Err>
                    </Field>

                    <Field label="Condition" error={formErrors.currentCondition}>
                        <select
                        className="w-full rounded-xl border px-3 py-2"
                        value={form.currentCondition}
                        onChange={(e) => setField("currentCondition", e.target.value)}
                        >
                        <option value="">Select…</option>
                        {CONDITIONS.map((t) => (
                            <option key={t} value={t}>
                            {t}
                            </option>
                        ))}
                        </select>
                        <Err>{formErrors.currentCondition}</Err>
                    </Field>

                    <Field label="Assigned Driver" error={formErrors.assignedDriverId} full>
                        <select
                        className="w-full rounded-xl border px-3 py-2"
                        value={form.assignedDriverId}
                        onChange={(e) => setField("assignedDriverId", e.target.value)}
                        disabled={driversLoading}
                        >
                        <option value="">{driversLoading ? "Loading drivers…" : "Select driver…"}</option>
                        {drivers.map((d) => (
                            <option key={d._id} value={d._id}>
                            {d.fullName || d._id}
                            </option>
                        ))}
                        </select>
                        <Err>{formErrors.assignedDriverId}</Err>
                    </Field>
                    </div>
                </Card>
                )}
            </div>

            {/* Right column: quick facts (view mode) */}
            <aside className="space-y-6">
                <Card title="Quick Facts">
                <Grid>
                    <Row label="Plate">{vehicle.numberPlate || "—"}</Row>
                    <Row label="Type / Model">{`${vehicle.vehicleType || "—"} • ${vehicle.vehicleModel || "—"}`}</Row>
                    <Row label="Seats">{vehicle.seatingCapacity ?? "—"}</Row>
                    <Row label="Driver">{assignedDriverName}</Row>
                </Grid>
                </Card>
            </aside>
            </div>
        </div>
        </div>
    );
    }

    function Card({ title, children }) {
    return (
        <div className="rounded-2xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">{title}</h2>
        {children}
        </div>
    );
    }

    function Grid({ children }) {
    return <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 text-sm">{children}</dl>;
    }

    function Row({ label, children }) {
    return (
        <>
        <dt className="text-gray-500">{label}</dt>
        <dd className="font-medium">{children}</dd>
        </>
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
