// src/Pages/Admin/Transport/DriverRegisterForm.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

// Fallback options if API is down
const FALLBACK_VEHICLE_OPTIONS = [
    { id: "VAN-01", label: "Van 01" },
    { id: "BUS-02", label: "Bus 02" },
    { id: "CAR-03", label: "Car 03" },
    { id: "SUV-04", label: "SUV 04" },
    ];

    const LICENSE_PATTERNS = [
    /^[0-9]{7}$/, // old license: 7 digits
    /^[A-Z][0-9]{7}$/, // letter + 7 digits
    /^[0-9]{12}$/, // 12-digit smart license
    ];

    function validLicense(s) {
    return LICENSE_PATTERNS.some((rx) => rx.test(String(s || "").trim()));
    }

    /** Normalize any vehicle shape coming from API into { id, label } */
    function normalizeVehicleOptions(arr = []) {
    return arr
        .map((v) => {
        const id =
            v.id || v._id || v.vehicleId || v.registrationNo || v.numberPlate;
        const label =
            v.label ||
            v.name ||
            v.title ||
            v.registrationNo ||
            v.numberPlate ||
            [v.make, v.model, v.year].filter(Boolean).join(" ");
        if (!id || !label) return null;
        return { id: String(id), label: String(label) };
        })
        .filter(Boolean);
    }

    // Letters-only regex (ASCII letters + spaces). Adjust if you need more locales.
    const NAME_RX = /^[A-Za-z\s]+$/;

    export default function DriverRegisterForm() {
    const navigate = useNavigate();

    const baseUrl = useMemo(
        () => process.env.REACT_APP_API_URL || "http://localhost:4000/api",
        []
    );

    const [vehicleOptions, setVehicleOptions] = useState(
        FALLBACK_VEHICLE_OPTIONS
    );
    const [loadingOptions, setLoadingOptions] = useState(true);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        fullName: "",
        gender: "",
        phone: "",
        emergencyPhone: "",
        address: "",
        licenseNumber: "",
        licenseExpiry: "",
        experienceYears: "",
        vehicles: [], // array of ids
        healthInfo: "",
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        let live = true;
        setLoadingOptions(true);
        fetch(`${baseUrl}/vehicles`, { credentials: "include" })
        .then((r) => r.json())
        .then((data) => {
            if (!live) return;
            const raw = Array.isArray(data) ? data : data?.items || [];
            const normalized = normalizeVehicleOptions(raw);
            setVehicleOptions(
            normalized.length ? normalized : FALLBACK_VEHICLE_OPTIONS
            );
        })
        .catch(() => live && setVehicleOptions(FALLBACK_VEHICLE_OPTIONS))
        .finally(() => live && setLoadingOptions(false));
        return () => {
        live = false;
        };
    }, [baseUrl]);

    const todayStr = useMemo(() => {
        const d = new Date();
        const pad = (n) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }, []);

    // Calculate max date (10 years from today)
    const maxLicenseExpiryStr = useMemo(() => {
        const d = new Date();
        d.setFullYear(d.getFullYear() + 10);
        const pad = (n) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }, []);

    const setField = (name, value) => setForm((f) => ({ ...f, [name]: value }));

    const handleChange = (e) => {
        const { name, value } = e.target;

        // --- Full name: allow letters & spaces only (strip everything else) ---
        if (name === "fullName") {
        const cleaned = value.replace(/[^A-Za-z\s]/g, ""); // remove numbers & special chars
        setField("fullName", cleaned);
        setErrors((err) => ({
            ...err,
            fullName: cleaned.trim()
            ? NAME_RX.test(cleaned)
                ? ""
                : "Only letters and spaces are allowed"
            : "Required",
        }));
        return;
        }

        // sanitize numeric-only fields
        if (name === "phone" || name === "emergencyPhone") {
        const digits = value.replace(/\D/g, "").slice(0, 10);
        setField(name, digits);
        setErrors((err) => ({
            ...err,
            [name]: digits.length === 10 ? "" : "Must be 10 digits",
        }));
        return;
        }

        if (name === "experienceYears") {
        const digits = value.replace(/\D/g, "");
        setField(name, digits);
        setErrors((err) => ({
            ...err,
            experienceYears:
            digits === "" ? "Required" : Number(digits) > 80 ? "Unrealistic value" : "",
        }));
        return;
        }

        if (name === "licenseNumber") {
        setField(name, value.toUpperCase());
        setErrors((err) => ({
            ...err,
            licenseNumber: value
            ? validLicense(value.toUpperCase())
                ? ""
                : "Invalid license format"
            : "Required",
        }));
        return;
        }

        if (name === "licenseExpiry") {
        setField(name, value);
        setErrors((err) => ({
            ...err,
            licenseExpiry: value && value < todayStr ? "Cannot be before today" : 
                         value && value > maxLicenseExpiryStr ? "Cannot be more than 10 years from today" : "",
        }));
        return;
        }

        // Address field: limit to 250 characters
        if (name === "address") {
        const limitedValue = value.slice(0, 250);
        setField(name, limitedValue);
        setErrors((err) => ({
            ...err,
            address: limitedValue.length > 250 ? "Address must be 250 characters or less" : "",
        }));
        return;
        }

        setField(name, value);
    };

    const onVehiclesChange = (e) => {
        const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
        setField("vehicles", selected);
        setErrors((err) => ({
        ...err,
        vehicles: selected.length ? "" : "Select at least one",
        }));
    };

    const clearForm = () => {
        setForm({
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
        setErrors({});
    };

    const validate = () => {
        const next = {};
        if (!form.fullName.trim()) next.fullName = "Required";
        else if (!NAME_RX.test(form.fullName)) next.fullName = "Only letters and spaces are allowed";

        if (!form.gender) next.gender = "Required";
        if (form.phone.length !== 10) next.phone = "Must be 10 digits";
        if (form.emergencyPhone.length !== 10) next.emergencyPhone = "Must be 10 digits";
        if (!form.address.trim()) next.address = "Required";
        else if (form.address.length > 250) next.address = "Address must be 250 characters or less";

        if (!form.licenseNumber.trim()) next.licenseNumber = "Required";
        else if (!validLicense(form.licenseNumber)) next.licenseNumber = "Invalid license format";

        if (!form.licenseExpiry) next.licenseExpiry = "Required";
        else if (form.licenseExpiry < todayStr) next.licenseExpiry = "Cannot be before today";
        else if (form.licenseExpiry > maxLicenseExpiryStr) next.licenseExpiry = "Cannot be more than 10 years from today";

        if (form.experienceYears === "") next.experienceYears = "Required";
        else if (Number(form.experienceYears) > 80) next.experienceYears = "Unrealistic value";

        if (!form.vehicles.length) next.vehicles = "Select at least one";
        return next;
    };

    function normalizePayload(f) {
        return {
        fullName: f.fullName.trim(),
        gender: f.gender,
        phone: String(f.phone).replace(/\D/g, ""),
        emergencyPhone: String(f.emergencyPhone).replace(/\D/g, ""),
        address: f.address.trim(),
        licenseNumber: String(f.licenseNumber).toUpperCase().trim(),
        licenseExpiry: f.licenseExpiry, // YYYY-MM-DD
        experienceYears: Number(f.experienceYears),
        vehicles: Array.isArray(f.vehicles) ? f.vehicles : [],
        healthInfo: (f.healthInfo || "").trim(),
        };
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        const next = validate();
        setErrors(next);
        if (Object.keys(next).length) return;

        try {
        setSaving(true);
        const payload = normalizePayload(form);

        const resp = await fetch(`${baseUrl}/drivers`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify(payload),
        });

        const ct = resp.headers.get("content-type") || "";
        const data = ct.includes("application/json") ? await resp.json() : await resp.text();

        if (!resp.ok) {
            if (data && typeof data === "object" && data.errors) setErrors(data.errors);
            throw new Error((data && data.error) || `Failed to submit (${resp.status})`);
        }

        clearForm();
        if (data?.id || data?._id) {
            navigate(`/admin/drivers-detail/${data.id || data._id}`); // adapt to your route
        } else {
            alert("Driver registered successfully!");
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
        form.phone.length !== 10 ||
        form.emergencyPhone.length !== 10 ||
        !form.licenseExpiry ||
        (form.licenseExpiry && form.licenseExpiry < todayStr) ||
        !NAME_RX.test(form.fullName || "") ||
        !validLicense(form.licenseNumber || "") ||
        !form.vehicles.length;

    return (
        <div className="min-h-screen bg-white text-gray-900">
        <header className="border-b justify-center text-center bg-gray-100/50 shadow-sm">
            <h1 className="text-3xl font-bold p-6">Register Driver</h1>
        </header>

        <main className="max-w-6xl mx-auto px-6 md:px-12 py-10">
            <form onSubmit={handleSubmit} className="space-y-8 bg-slate-400/10 p-8 rounded-lg shadow font-poppins">
            {/* Full Name */}
            <FormRow label="Full Name" error={errors.fullName}>
                <input
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                className={`w-full max-w-xl rounded-md bg-gray-100 border px-4 py-2.5 focus:outline-none focus:ring-2 ${
                    errors.fullName ? "border-red-500 focus:ring-red-300" : "border-gray-200 focus:ring-gray-300"
                }`}
                placeholder="e.g., Nimal Perera"
                />
                <ErrorText>{errors.fullName}</ErrorText>
            </FormRow>

            {/* Gender */}
            <FormRow label="Gender" error={errors.gender}>
                <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className={`w-full max-w-xs rounded-md bg-gray-100 border px-4 py-2.5 focus:outline-none focus:ring-2 ${
                    errors.gender ? "border-red-500 focus:ring-red-300" : "border-gray-200 focus:ring-gray-300"
                }`}
                >
                <option value="">Select…</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
                <option>Prefer not to say</option>
                </select>
                <ErrorText>{errors.gender}</ErrorText>
            </FormRow>

            {/* Phones */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <FormRow label="Phone Number" error={errors.phone}>
                <input
                    name="phone"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={10}
                    value={form.phone}
                    onChange={handleChange}
                    className={`w-full max-w-xs rounded-md bg-gray-100 border px-4 py-2.5 focus:outline-none focus:ring-2 ${
                    errors.phone ? "border-red-500 focus:ring-red-300" : "border-gray-200 focus:ring-gray-300"
                    }`}
                    placeholder="e.g., 0771234567"
                />
                <ErrorText>{errors.phone}</ErrorText>
                </FormRow>

                <FormRow label="Emergency Contact" error={errors.emergencyPhone}>
                <input
                    name="emergencyPhone"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={10}
                    value={form.emergencyPhone}
                    onChange={handleChange}
                    className={`w-full max-w-xs rounded-md bg-gray-100 border px-4 py-2.5 focus:outline-none focus:ring-2 ${
                    errors.emergencyPhone ? "border-red-500 focus:ring-red-300" : "border-gray-200 focus:ring-gray-300"
                    }`}
                    placeholder="e.g., 0712345678"
                />
                <ErrorText>{errors.emergencyPhone}</ErrorText>
                </FormRow>
            </div>

            {/* Address */}
            <FormRow label="Address" error={errors.address}>
                <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                rows={3}
                maxLength={250}
                className={`w-full max-w-3xl rounded-md bg-gray-100 border px-4 py-3 focus:outline-none focus:ring-2 ${
                    errors.address ? "border-red-500 focus:ring-red-300" : "border-gray-200 focus:ring-gray-300"
                }`}
                placeholder="Street, City, Postal Code"
                />
                <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-gray-500">Maximum 250 characters</p>
                    <p className={`text-xs ${form.address.length > 250 ? "text-red-600" : "text-gray-500"}`}>
                        {form.address.length}/250
                    </p>
                </div>
                <ErrorText>{errors.address}</ErrorText>
            </FormRow>

            {/* License Number */}
            <FormRow label="License Number" error={errors.licenseNumber}>
                <input
                name="licenseNumber"
                value={form.licenseNumber}
                onChange={handleChange}
                className={`w-full max-w-sm rounded-md bg-gray-100 border px-4 py-2.5 uppercase tracking-wider focus:outline-none focus:ring-2 ${
                    errors.licenseNumber ? "border-red-500 focus:ring-red-300" : "border-gray-200 focus:ring-gray-300"
                }`}
                placeholder="e.g., 1234567 / A1234567 / 123456789012"
                />
                <p className="text-xs text-gray-500 mt-1">
                Allowed: <code>1234567</code> (7 digits), <code>A1234567</code> (letter + 7 digits),{" "}
                <code>123456789012</code> (12 digits)
                </p>
                <ErrorText>{errors.licenseNumber}</ErrorText>
            </FormRow>

            {/* License Expiry + Experience */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <FormRow label="License Expiry Date" error={errors.licenseExpiry}>
                <input
                    type="date"
                    name="licenseExpiry"
                    value={form.licenseExpiry}
                    onChange={handleChange}
                    min={todayStr}
                    max={maxLicenseExpiryStr}
                    className={`w-full max-w-xs rounded-md bg-gray-100 border px-4 py-2.5 focus:outline-none focus:ring-2 ${
                    errors.licenseExpiry ? "border-red-500 focus:ring-red-300" : "border-gray-200 focus:ring-gray-300"
                    }`}
                />
                <ErrorText>{errors.licenseExpiry}</ErrorText>
                </FormRow>

                <FormRow label="Years of Driving Experience" error={errors.experienceYears}>
                <input
                    name="experienceYears"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={form.experienceYears}
                    onChange={handleChange}
                    className={`w-full max-w-xs rounded-md bg-gray-100 border px-4 py-2.5 focus:outline-none focus:ring-2 ${
                    errors.experienceYears ? "border-red-500 focus:ring-red-300" : "border-gray-200 focus:ring-gray-300"
                    }`}
                    placeholder="e.g., 5"
                />
                <ErrorText>{errors.experienceYears}</ErrorText>
                </FormRow>
            </div>

            {/* Vehicles (multi-select) */}
            <FormRow label="Vehicle Assigned" error={errors.vehicles}>
                <select
                multiple
                size={4}
                value={form.vehicles}
                onChange={onVehiclesChange}
                disabled={loadingOptions}
                className={`w-full max-w-md rounded-md bg-gray-100 border px-3 py-2.5 focus:outline-none focus:ring-2 ${
                    errors.vehicles ? "border-red-500 focus:ring-red-300" : "border-gray-200 focus:ring-gray-300"
                }`}
                >
                {vehicleOptions.map((v) => (
                    <option key={v.id} value={v.id}>
                    {v.label}
                    </option>
                ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                {loadingOptions ? "Loading vehicle options…" : "Hold Ctrl/Cmd to select multiple."}
                </p>
                <ErrorText>{errors.vehicles}</ErrorText>
            </FormRow>

            {/* Health Info */}
            <FormRow label="Health Information">
                <textarea
                name="healthInfo"
                value={form.healthInfo}
                onChange={handleChange}
                rows={3}
                className="w-full max-w-3xl rounded-md bg-gray-100 border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-300"
                placeholder="Allergies, medical conditions, medications, etc."
                />
            </FormRow>

            {/* Actions */}
            <div className="flex justify-end gap-6 pt-6">
                <button
                type="button"
                onClick={clearForm}
                className="rounded-full border border-gray-700 px-7 py-2.5 text-sm font-medium hover:bg-gray-50 active:scale-95 transition"
                >
                Clear
                </button>
                <button
                type="submit"
                disabled={invalid || saving}
                className={`rounded-full border border-gray-700 px-7 py-2.5 text-sm font-medium active:scale-95 transition ${
                    invalid || saving ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-900 hover:text-white"
                }`}
                >
                {saving ? "Submitting..." : "Submit"}
                </button>
            </div>
            </form>
        </main>
        </div>
    );
    }

    /* ---------- small helpers for layout/errors ---------- */
    function FormRow({ label, error, children }) {
    return (
        <div className="grid grid-cols-[220px_minmax(0,1fr)] items-start gap-6">
        <label className="pt-2 font-medium text-sm md:text-base select-none">{label}</label>
        <div>
            {children}
            {error ? <ErrorText>{error}</ErrorText> : null}
        </div>
        </div>
    );
    }

    function ErrorText({ children }) {
    if (!children) return null;
    return <p className="mt-1 text-sm text-red-600">{children}</p>;
}
