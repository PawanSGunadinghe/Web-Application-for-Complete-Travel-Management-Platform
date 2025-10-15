import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

// --- Constants & helpers ---
const currentYear = new Date().getFullYear();
const pad = (n) => String(n).padStart(2, "0");
const plateRegex = /^(?:[A-Z]{2}\s?[A-Z]{2,3}\s?\d{4})$/; // e.g., WP CAE 1234 (kept for Number Plate field)

// Sri Lanka Registration Number validation (best-effort)
const REG_MODERN = /^[A-Z]{2,3}[- ]?\d{4}$/i;
const REG_LEGACY_SRI = /^(\d{1,2})\s*(Sri|ශ්‍රී)\s*(\d{3})$/i;
function isValidSLRegistration(s) {
    const val = (s || "").trim();
    return REG_MODERN.test(val) || REG_LEGACY_SRI.test(val);
    }

    // Engine Number: 5–20 of [A-Z0-9-/ .], must include at least one letter or digit
    const ENGINE_ALLOWED = /^[A-Za-z0-9\-\/\.]{5,20}$/;
    function isValidEngineNumber(s) {
    const val = (s || "").trim();
    if (!ENGINE_ALLOWED.test(val)) return false;
    return /[A-Za-z0-9]/.test(val);
    }

    export default function VehicleRegisterForm() {
    const navigate = useNavigate();

    const baseUrl = useMemo(
        () => process.env.REACT_APP_API_URL || "http://localhost:4000/api",
        []
    );

    const [driverOptions, setDriverOptions] = useState([]);
    const [loadingDrivers, setLoadingDrivers] = useState(true);

    useEffect(() => {
        let live = true;
        setLoadingDrivers(true);
        fetch(`${baseUrl}/drivers`, { credentials: "include" })
        .then((r) => r.json())
        .then((data) => {
            if (!live) return;
            const arr = Array.isArray(data) ? data : [];
            const opts = arr.map((d) => ({ id: d._id, label: d.fullName || d._id }));
            setDriverOptions(opts);
        })
        .catch(() => live && setDriverOptions([]))
        .finally(() => live && setLoadingDrivers(false));
        return () => {
        live = false;
        };
    }, [baseUrl]);

    const [form, setForm] = useState({
        // Vehicle Details
        numberPlate: "",
        vehicleType: "",
        vehicleModel: "",
        manufacturer: "",
        yearOfManufacture: "",

        // Registration & Legal
        registrationNumber: "",
        chassisNumber: "",
        engineNumber: "",
        insurancePolicyNumber: "",
        insuranceExpiry: "",
        revenueLicenseExpiry: "",

        // Specifications
        fuelType: "",
        transmission: "",
        seatingCapacity: "",

        // Maintenance & Status
        lastServiceDate: "",
        currentCondition: "",
        assignedDriverId: "",
    });

    const [errors, setErrors] = useState({});

    const todayStr = useMemo(() => {
        const d = new Date();
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }, []);

    // Calculate max date (1 year from today)
    const maxDateStr = useMemo(() => {
        const d = new Date();
        d.setFullYear(d.getFullYear() + 1);
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }, []);

    const setField = (name, value) => setForm((f) => ({ ...f, [name]: value }));

    // --- Field-level handlers ---
    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === "numberPlate") {
        const v = value.toUpperCase();
        setField(name, v);
        setErrors((err) => ({
            ...err,
            numberPlate: v ? (plateRegex.test(v) ? "" : "Format like WP CAE 1234") : "Required",
        }));
        return;
        }

        if (name === "registrationNumber") {
        const v = value.toUpperCase();
        setField(name, v);
        setErrors((err) => ({
            ...err,
            registrationNumber: v ? (isValidSLRegistration(v) ? "" : "Invalid SL registration format") : "Required",
        }));
        return;
        }

        // Chassis number: REQUIRED only; no VIN/format validation
        if (name === "chassisNumber") {
        const v = value.toUpperCase();
        setField(name, v);
        setErrors((err) => ({
            ...err,
            chassisNumber: v ? "" : "Required",
        }));
        return;
        }

        if (name === "engineNumber") {
        const v = value.toUpperCase();
        setField(name, v);
        setErrors((err) => ({
            ...err,
            engineNumber: v ? (isValidEngineNumber(v) ? "" : "5–20 chars; letters/digits -/. allowed") : "Required",
        }));
        return;
        }

        if (name === "yearOfManufacture") {
        const digits = value.replace(/\D/g, "").slice(0, 4);
        setField(name, digits);
        const yr = Number(digits);
        setErrors((err) => ({
            ...err,
            yearOfManufacture:
            digits === ""
                ? "Required"
                : yr < 1950
                ? "Year must be ≥ 1950"
                : yr > currentYear
                ? `Year must be ≤ ${currentYear}`
                : "",
        }));
        return;
        }

        if (name === "seatingCapacity") {
        const digits = value.replace(/\D/g, "").slice(0, 3);
        const n = Number(digits || 0);
        setField(name, digits);
        setErrors((err) => ({
            ...err,
            seatingCapacity: digits === "" ? "Required" : n < 1 ? "Min 1" : n > 100 ? "Too many" : "",
        }));
        return;
        }

        if (name === "insuranceExpiry" || name === "revenueLicenseExpiry") {
        setField(name, value);
        setErrors((err) => ({
            ...err,
            [name]: value && value <= todayStr ? "Must be a future date" : 
                     value && value > maxDateStr ? "Cannot be more than 1 year from today" : "",
        }));
        return;
        }

        if (name === "lastServiceDate") {
        setField(name, value);
        setErrors((err) => ({
            ...err,
            lastServiceDate: value && value > todayStr ? "Cannot be in the future" : "",
        }));
        return;
        }

        setField(name, value);
    };

    const validate = () => {
        const n = {};

        // Vehicle details
        if (!form.numberPlate.trim()) n.numberPlate = "Required";
        else if (!plateRegex.test(form.numberPlate)) n.numberPlate = "Format like WP CAE 1234";
        if (!form.vehicleType) n.vehicleType = "Required";
        if (!form.vehicleModel.trim()) n.vehicleModel = "Required";
        if (!form.manufacturer.trim()) n.manufacturer = "Required";
        if (!form.yearOfManufacture) n.yearOfManufacture = "Required";
        else if (Number(form.yearOfManufacture) < 1950) n.yearOfManufacture = "Year must be ≥ 1950";
        else if (Number(form.yearOfManufacture) > currentYear) n.yearOfManufacture = `Year must be ≤ ${currentYear}`;

        // Registration & legal
        if (!form.registrationNumber.trim()) n.registrationNumber = "Required";
        else if (!isValidSLRegistration(form.registrationNumber)) n.registrationNumber = "Invalid SL registration format";

        // Chassis number: required only
        if (!form.chassisNumber.trim()) n.chassisNumber = "Required";

        if (!form.engineNumber.trim()) n.engineNumber = "Required";
        else if (!isValidEngineNumber(form.engineNumber)) n.engineNumber = "5–20 chars; letters/digits -/. allowed";

        if (!form.insurancePolicyNumber.trim()) n.insurancePolicyNumber = "Required";

        if (!form.insuranceExpiry) n.insuranceExpiry = "Required";
        else if (form.insuranceExpiry <= todayStr) n.insuranceExpiry = "Must be a future date";
        else if (form.insuranceExpiry > maxDateStr) n.insuranceExpiry = "Cannot be more than 1 year from today";

        if (!form.revenueLicenseExpiry) n.revenueLicenseExpiry = "Required";
        else if (form.revenueLicenseExpiry <= todayStr) n.revenueLicenseExpiry = "Must be a future date";
        else if (form.revenueLicenseExpiry > maxDateStr) n.revenueLicenseExpiry = "Cannot be more than 1 year from today";

        // Specs
        if (!form.fuelType) n.fuelType = "Required";
        if (!form.transmission) n.transmission = "Required";
        if (!form.seatingCapacity) n.seatingCapacity = "Required";
        else if (Number(form.seatingCapacity) < 1) n.seatingCapacity = "Min 1";
        else if (Number(form.seatingCapacity) > 100) n.seatingCapacity = "Too many";

        // Maintenance & status
        if (!form.lastServiceDate) n.lastServiceDate = "Required";
        else if (form.lastServiceDate > todayStr) n.lastServiceDate = "Cannot be in the future";
        if (!form.currentCondition) n.currentCondition = "Required";
        if (!form.assignedDriverId) n.assignedDriverId = "Select a driver";

        return n;
    };

    const clearForm = () => {
        setForm({
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
        setErrors({});
    };

    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const next = validate();
        setErrors(next);
        if (Object.keys(next).length) return;

        const payload = {
        ...form,
        numberPlate: String(form.numberPlate).toUpperCase().trim(),
        registrationNumber: String(form.registrationNumber).toUpperCase().trim(),
        chassisNumber: String(form.chassisNumber).toUpperCase().trim(),
        engineNumber: String(form.engineNumber).toUpperCase().trim(),
        yearOfManufacture: Number(form.yearOfManufacture),
        seatingCapacity: Number(form.seatingCapacity),
        };

        try {
        setSaving(true);
        const resp = await fetch(`${baseUrl}/vehicles`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify(payload),
        });

        const ct = resp.headers.get("content-type") || "";
        const data = ct.includes("application/json") ? await resp.json() : await resp.text();

        if (!resp.ok) {
            if (data && typeof data === "object" && data.errors) {
                setErrors(data.errors);

                // Show the first error message instead of generic "Failed to save (400)"
                const firstErrMsg = Object.values(data.errors).find(Boolean);
                throw new Error(firstErrMsg || `Failed to save (${resp.status})`);
            }

            // if server sent a flat { error: "msg" }
            throw new Error((data && data.error) || `Failed to save (${resp.status})`);
            }

        clearForm();
        if (data?.id) {
            alert("Vehicle saved!");
            navigate(`/admin/transport-admin`);
        } else {
            alert("Vehicle saved!");
        }
        } catch (err) {
        console.error(err);
        alert(err.message || "Something went wrong");
        } finally {
        setSaving(false);
        }
    };

    const invalid =
        Object.values(errors).some(Boolean) ||
        !form.numberPlate ||
        !form.vehicleType ||
        !form.vehicleModel ||
        !form.manufacturer ||
        !form.yearOfManufacture ||
        !form.registrationNumber ||
        !form.chassisNumber || // still required
        !form.engineNumber ||
        !form.insurancePolicyNumber ||
        !form.insuranceExpiry ||
        !form.revenueLicenseExpiry ||
        !form.fuelType ||
        !form.transmission ||
        !form.seatingCapacity ||
        !form.lastServiceDate ||
        !form.currentCondition ||
        !form.assignedDriverId ||
        (form.insuranceExpiry && form.insuranceExpiry <= todayStr) ||
        (form.revenueLicenseExpiry && form.revenueLicenseExpiry <= todayStr) ||
        (form.lastServiceDate && form.lastServiceDate > todayStr) ||
        (form.yearOfManufacture &&
        (Number(form.yearOfManufacture) < 1950 || Number(form.yearOfManufacture) > currentYear)) ||
        (form.seatingCapacity && (Number(form.seatingCapacity) < 1 || Number(form.seatingCapacity) > 100)) ||
        (form.numberPlate && !plateRegex.test(form.numberPlate)) ||
        (form.registrationNumber && !isValidSLRegistration(form.registrationNumber)) ||
        (form.engineNumber && !isValidEngineNumber(form.engineNumber));

    return (
        <div className="min-h-screen bg-white text-gray-900">
        <header className="border-b justify-center text-center bg-gray-100/50 shadow-sm">
            <h1 className="text-3xl font-bold p-6">Add Vehicle</h1>
        </header>

        <main className="max-w-6xl mx-auto px-6 md:px-12 py-10">
            <form onSubmit={handleSubmit} className="space-y-10 bg-slate-400/10 p-8 rounded-lg shadow font-poppins">
            {/* Vehicle Details */}
            <SectionTitle>Vehicle Details</SectionTitle>
            <div className="space-y-6">
                <FormRow label="Vehicle Number Plate" error={errors.numberPlate}>
                <input
                    name="numberPlate"
                    value={form.numberPlate}
                    onChange={handleChange}
                    className={`w-full max-w-md rounded-md bg-gray-100 border px-4 py-2.5 uppercase tracking-wide focus:outline-none focus:ring-2 ${
                    errors.numberPlate ? "border-red-500 focus:ring-red-300" : "border-gray-200 focus:ring-gray-300"
                    }`}
                    placeholder="e.g., WP CAE 1234"
                />
                <ErrorText>{errors.numberPlate}</ErrorText>
                </FormRow>

                <FormRow label="Vehicle Type" error={errors.vehicleType}>
                <select
                    name="vehicleType"
                    value={form.vehicleType}
                    onChange={handleChange}
                    className={`w-full max-w-xs rounded-md bg-gray-100 border px-4 py-2.5 focus:outline-none focus:ring-2 ${
                    errors.vehicleType ? "border-red-500 focus:ring-red-300" : "border-gray-200 focus:ring-gray-300"
                    }`}
                >
                    <option value="">Select…</option>
                    {["Car", "Van", "Bus", "Lorry", "Motorcycle", "SUV", "Pickup", "Three-Wheeler"].map((t) => (
                    <option key={t} value={t}>
                        {t}
                    </option>
                    ))}
                </select>
                <ErrorText>{errors.vehicleType}</ErrorText>
                </FormRow>

                <FormRow label="Vehicle Model" error={errors.vehicleModel}>
                <input
                    name="vehicleModel"
                    value={form.vehicleModel}
                    onChange={handleChange}
                    className={`w-full max-w-xl rounded-md bg-gray-100 border px-4 py-2.5 focus:outline-none focus:ring-2 ${
                    errors.vehicleModel ? "border-red-500 focus:ring-red-300" : "border-gray-200 focus:ring-gray-300"
                    }`}
                    placeholder="e.g., Toyota Prius, Nissan Caravan"
                />
                <ErrorText>{errors.vehicleModel}</ErrorText>
                </FormRow>

                <FormRow label="Manufacturer / Brand" error={errors.manufacturer}>
                <input
                    name="manufacturer"
                    value={form.manufacturer}
                    onChange={handleChange}
                    className={`w-full max-w-sm rounded-md bg-gray-100 border px-4 py-2.5 focus:outline-none focus:ring-2 ${
                    errors.manufacturer ? "border-red-500 focus:ring-red-300" : "border-gray-200 focus:ring-gray-300"
                    }`}
                    placeholder="e.g., Toyota"
                />
                <ErrorText>{errors.manufacturer}</ErrorText>
                </FormRow>

                <FormRow label="Year of Manufacture" error={errors.yearOfManufacture}>
                <input
                    name="yearOfManufacture"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={form.yearOfManufacture}
                    onChange={handleChange}
                    maxLength={4}
                    className={`w-full max-w-xs rounded-md bg-gray-100 border px-4 py-2.5 focus:outline-none focus:ring-2 ${
                    errors.yearOfManufacture ? "border-red-500 focus:ring-red-300" : "border-gray-200 focus:ring-gray-300"
                    }`}
                    placeholder={`${currentYear}`}
                />
                <ErrorText>{errors.yearOfManufacture}</ErrorText>
                </FormRow>
            </div>

            {/* Registration & Legal */}
            <SectionTitle>Registration & Legal</SectionTitle>
            <div className="space-y-6">
                <FormRow label="Vehicle Registration Number (Sri Lanka)" error={errors.registrationNumber}>
                <input
                    name="registrationNumber"
                    value={form.registrationNumber}
                    onChange={handleChange}
                    className={`w-full max-w-md rounded-md bg-gray-100 border px-4 py-2.5 uppercase tracking-wide focus:outline-none focus:ring-2 ${
                    errors.registrationNumber ? "border-red-500 focus:ring-red-300" : "border-gray-200 focus:ring-gray-300"
                    }`}
                    placeholder="e.g., ABC-1234 / AB 1234 / 1 Sri 234"
                />
                <p className="text-xs text-gray-500 mt-1">
                    Supports ABC 1234, ABC-1234, AB 1234, AB-1234, DP 1234, and legacy 1 Sri 234 / 11 ශ්‍රී 234
                </p>
                <ErrorText>{errors.registrationNumber}</ErrorText>
                </FormRow>

                <FormRow label="Chassis Number" error={errors.chassisNumber}>
                <input
                    name="chassisNumber"
                    value={form.chassisNumber}
                    onChange={handleChange}
                    className={`w-full max-w-md rounded-md bg-gray-100 border px-4 py-2.5 uppercase tracking-wider focus:outline-none focus:ring-2 ${
                    errors.chassisNumber ? "border-red-500 focus:ring-red-300" : "border-gray-200 focus:ring-gray-300"
                    }`}
                    placeholder="Enter chassis number"
                    maxLength={50}
                />
                <ErrorText>{errors.chassisNumber}</ErrorText>
                </FormRow>

                <FormRow label="Engine Number" error={errors.engineNumber}>
                <input
                    name="engineNumber"
                    value={form.engineNumber}
                    onChange={handleChange}
                    className={`w-full max-w-md rounded-md bg-gray-100 border px-4 py-2.5 uppercase tracking-wide focus:outline-none focus:ring-2 ${
                    errors.engineNumber ? "border-red-500 focus:ring-red-300" : "border-gray-200 focus:ring-gray-300"
                    }`}
                    placeholder="5–20 chars; letters/digits -/. allowed"
                    maxLength={20}
                />
                <ErrorText>{errors.engineNumber}</ErrorText>
                </FormRow>

                <FormRow label="Insurance Policy Number" error={errors.insurancePolicyNumber}>
                <input
                    name="insurancePolicyNumber"
                    value={form.insurancePolicyNumber}
                    onChange={handleChange}
                    className={`w-full max-w-md rounded-md bg-gray-100 border px-4 py-2.5 focus:outline-none focus:ring-2 ${
                    errors.insurancePolicyNumber ? "border-red-500 focus:ring-red-300" : "border-gray-200 focus:ring-gray-300"
                    }`}
                />
                <ErrorText>{errors.insurancePolicyNumber}</ErrorText>
                </FormRow>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <FormRow label="Insurance Expiry Date" error={errors.insuranceExpiry}>
                    <input
                    type="date"
                    name="insuranceExpiry"
                    value={form.insuranceExpiry}
                    onChange={handleChange}
                    min={todayStr}
                    max={maxDateStr}
                    className={`w-full max-w-xs rounded-md bg-gray-100 border px-4 py-2.5 focus:outline-none focus:ring-2 ${
                        errors.insuranceExpiry ? "border-red-500 focus:ring-red-300" : "border-gray-200 focus:ring-gray-300"
                    }`}
                    />
                    <ErrorText>{errors.insuranceExpiry}</ErrorText>
                </FormRow>

                <FormRow label="Revenue License Expiry Date" error={errors.revenueLicenseExpiry}>
                    <input
                    type="date"
                    name="revenueLicenseExpiry"
                    value={form.revenueLicenseExpiry}
                    onChange={handleChange}
                    min={todayStr}
                    max={maxDateStr}
                    className={`w-full max-w-xs rounded-md bg-gray-100 border px-4 py-2.5 focus:outline-none focus:ring-2 ${
                        errors.revenueLicenseExpiry ? "border-red-500 focus:ring-red-300" : "border-gray-200 focus:ring-gray-300"
                    }`}
                    />
                    <ErrorText>{errors.revenueLicenseExpiry}</ErrorText>
                </FormRow>
                </div>
            </div>

            {/* Specifications */}
            <SectionTitle>Specifications</SectionTitle>
            <div className="space-y-6">
                <FormRow label="Fuel Type" error={errors.fuelType}>
                <select
                    name="fuelType"
                    value={form.fuelType}
                    onChange={handleChange}
                    className={`w-full max-w-xs rounded-md bg-gray-100 border px-4 py-2.5 focus:outline-none focus:ring-2 ${
                    errors.fuelType ? "border-red-500 focus:ring-red-300" : "border-gray-200 focus:ring-gray-300"
                    }`}
                >
                    <option value="">Select…</option>
                    {["Petrol", "Diesel", "Hybrid", "Electric"].map((t) => (
                    <option key={t} value={t}>
                        {t}
                    </option>
                    ))}
                </select>
                <ErrorText>{errors.fuelType}</ErrorText>
                </FormRow>

                <FormRow label="Transmission" error={errors.transmission}>
                <select
                    name="transmission"
                    value={form.transmission}
                    onChange={handleChange}
                    className={`w-full max-w-xs rounded-md bg-gray-100 border px-4 py-2.5 focus:outline-none focus:ring-2 ${
                    errors.transmission ? "border-red-500 focus:ring-red-300" : "border-gray-200 focus:ring-gray-300"
                    }`}
                >
                    <option value="">Select…</option>
                    {["Manual", "Automatic"].map((t) => (
                    <option key={t} value={t}>
                        {t}
                    </option>
                    ))}
                </select>
                <ErrorText>{errors.transmission}</ErrorText>
                </FormRow>

                <FormRow label="Seating Capacity" error={errors.seatingCapacity}>
                <input
                    name="seatingCapacity"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={form.seatingCapacity}
                    onChange={handleChange}
                    maxLength={3}
                    className={`w-full max-w-xs rounded-md bg-gray-100 border px-4 py-2.5 focus:outline-none focus:ring-2 ${
                    errors.seatingCapacity ? "border-red-500 focus:ring-red-300" : "border-gray-200 focus:ring-gray-300"
                    }`}
                    placeholder="e.g., 4"
                />
                <ErrorText>{errors.seatingCapacity}</ErrorText>
                </FormRow>
            </div>

            {/* Maintenance & Status */}
            <SectionTitle>Maintenance & Status</SectionTitle>
            <div className="space-y-6">
                <FormRow label="Last Service Date" error={errors.lastServiceDate}>
                <input
                    type="date"
                    name="lastServiceDate"
                    value={form.lastServiceDate}
                    onChange={handleChange}
                    max={todayStr}
                    className={`w-full max-w-xs rounded-md bg-gray-100 border px-4 py-2.5 focus:outline-none focus:ring-2 ${
                    errors.lastServiceDate ? "border-red-500 focus:ring-red-300" : "border-gray-200 focus:ring-gray-300"
                    }`}
                />
                <ErrorText>{errors.lastServiceDate}</ErrorText>
                </FormRow>

                <FormRow label="Current Condition" error={errors.currentCondition}>
                <select
                    name="currentCondition"
                    value={form.currentCondition}
                    onChange={handleChange}
                    className={`w-full max-w-xs rounded-md bg-gray-100 border px-4 py-2.5 focus:outline-none focus:ring-2 ${
                    errors.currentCondition ? "border-red-500 focus:ring-red-300" : "border-gray-200 focus:ring-gray-300"
                    }`}
                >
                    <option value="">Select…</option>
                    {["Good", "Needs Repair", "Inactive"].map((t) => (
                    <option key={t} value={t}>
                        {t}
                    </option>
                    ))}
                </select>
                <ErrorText>{errors.currentCondition}</ErrorText>
                </FormRow>

                <FormRow label="Assigned Driver" error={errors.assignedDriverId}>
                <select
                    name="assignedDriverId"
                    value={form.assignedDriverId}
                    onChange={handleChange}
                    className={`w-full max-w-md rounded-md bg-yellow-50 border px-4 py-2.5 focus:outline-none focus:ring-2 ${
                    errors.assignedDriverId ? "border-red-500 focus:ring-red-300" : "border-gray-200 focus:ring-gray-300"
                    }`}
                >
                    <option value="">{loadingDrivers ? "Loading drivers…" : "Select driver…"}</option>
                    {driverOptions.map((d) => (
                    <option key={d.id} value={d.id}>
                        {d.label}
                    </option>
                    ))}
                </select>

                <p className="text-xs text-gray-500 mt-1">This list should be populated from your Drivers List.</p>
                <ErrorText>{errors.assignedDriverId}</ErrorText>
                </FormRow>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-6 pt-6">
                <button
                type="button"
                onClick={clearForm}
                className="rounded-full border border-blue-600 px-7 py-2.5 text-sm font-medium hover:bg-gray-50 active:scale-95 transition"
                >
                Clear
                </button>
                <button
                type="submit"
                disabled={invalid}
                className={`rounded-full border border-blue-600 px-7 py-2.5 text-sm font-medium active:scale-95 transition ${
                    invalid ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-600 hover:text-white"
                }`}
                >
                Save Vehicle
                </button>
            </div>
            </form>
        </main>
        </div>
    );
    }

    function SectionTitle({ children }) {
    return <h2 className="text-xl font-semibold text-gray-800 border-l-4 border-gray-800 pl-3">{children}</h2>;
    }

    function FormRow({ label, error, children }) {
    return (
        <div className="grid grid-cols-[220px_minmax(0,1fr)] items-start gap-6">
        <label className="pt-2 font-medium text-sm md:text-base select-none">{label}</label>
        <div>
            {children}
            {error ? null : null}
        </div>
        </div>
    );
    }

    function ErrorText({ children }) {
    if (!children) return null;
    return <p className="mt-1 text-sm text-red-600">{children}</p>;
}
