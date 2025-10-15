// src/Pages/Admin/FinanceManager/SalaryCreate.js
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link, useLocation } from "react-router-dom";
import { PayrollAPI } from "../../../features/auth/payroll/api";
import { getAllVehicles } from "../../../features/auth/vehicles/api";
import { createExpense, updateExpense } from "../../../features/auth/expenses/api";

const CURRENCIES = ["USD", "LKR", "INR", "EUR", "GBP", "AUD", "CAD", "SGD", "AED"];

export default function SalaryCreate() {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();

    const [employees, setEmployees] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const dateBounds = useMemo(() => {
        const today = new Date();
        const min = new Date(today);
        min.setMonth(min.getMonth() - 1);
        const fmt = (d) => new Date(d.getTime() - d.getTimezoneOffset()*60000).toISOString().substring(0,10);
        return { min: fmt(min), max: fmt(today) };
    }, []);

    const [form, setForm] = useState({
        employeeId: "",
        vehicleId: "",
        currency: "USD",
        base: "",
        effectiveFrom: "",
        effectiveTo: "",
        notes: "",
        components: [], // { type: 'earning'|'deduction', name, amount, percentageOfBase }
    });

    async function loadEmployees() {
        setError("");
        setLoading(true);
        try {
        const { items } = await PayrollAPI.listEmployees();
        setEmployees(items || []);
        } catch (e) {
        setError(e.message || "Failed to load employees");
        } finally {
        setLoading(false);
        }
    }

    useEffect(() => {
        loadEmployees();
        (async () => {
        try {
            const data = await getAllVehicles();
            setVehicles(Array.isArray(data) ? data : []);
        } catch (_) {
            setVehicles([]);
        }
        })();

        // Pre-fill from query params when coming from vehicle payment Edit
        const params = new URLSearchParams(location.search);
        const vehicleId = params.get("vehicleId");
        const amount = params.get("amount");
        const date = params.get("date");
        const expenseId = params.get("expenseId");
        if (!id && (vehicleId || amount || date)) {
            setForm((f) => ({
                ...f,
                vehicleId: vehicleId || f.vehicleId,
                base: amount != null ? String(amount) : f.base,
                effectiveFrom: date || f.effectiveFrom,
            }));
        }
        if (expenseId) {
            // store expenseId in state for update on submit
            setForm((f) => ({ ...f, _expenseId: expenseId }));
        }
    }, [location.search, id]);

    // If editing, load the salary and prefill form
    useEffect(() => {
        async function loadForEdit() {
            if (!id) return;
            try {
                const { item } = await PayrollAPI.getSalary(id);
                setForm({
                    employeeId: item.employee?._id || item.employee,
                    currency: item.currency || "USD",
                    base: String(item.base || ""),
                    effectiveFrom: item.effectiveFrom ? String(item.effectiveFrom).substring(0,10) : "",
                    effectiveTo: item.effectiveTo ? String(item.effectiveTo).substring(0,10) : "",
                    notes: item.notes || "",
                    components: (item.components || []).map(c => ({
                        type: c.type === "deduction" ? "deduction" : "earning",
                        name: c.name || "",
                        amount: c.amount != null ? String(c.amount) : "",
                        percentageOfBase: c.percentageOfBase != null ? String(c.percentageOfBase) : "",
                    })),
                });
                // Ensure employee exists in dropdown; if not, push a temporary option
                setEmployees((prev) => {
                    if (!item.employee?._id) return prev;
                    if (prev.some((e) => e._id === item.employee._id)) return prev;
                    return [{ _id: item.employee._id, label: item.employee.fullName || item.employee.name || "Employee", code: item.employee.code || "", type: item.employee.type }, ...prev];
                });
            } catch (e) {
                console.error(e);
            }
        }
        loadForEdit();
    }, [id]);

    const addRow = (type = "earning") =>
        setForm((f) => ({
        ...f,
        components: [...f.components, { type, name: "", amount: "", percentageOfBase: "" }],
        }));

    const removeRow = (idx) =>
        setForm((f) => ({ ...f, components: f.components.filter((_, i) => i !== idx) }));

    const editRow = (idx, key, val) =>
        setForm((f) => ({
        ...f,
        components: f.components.map((r, i) => (i === idx ? { ...r, [key]: val } : r)),
        }));

    const totals = useMemo(() => {
        const base = Number(form.base || 0);
        let earnings = 0;
        let deductions = 0;
        (form.components || []).forEach((c) => {
        const amt = Number(c.amount || 0);
        const pct = Number(c.percentageOfBase || 0);
        const v = amt + (pct / 100) * base;
        if (c.type === "earning") earnings += v;
        else deductions += v;
        });
        const gross = base + earnings;
        return { earnings, deductions, gross, net: gross - deductions };
    }, [form.base, form.components]);

    const onSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        // allow either employee or vehicle
        if (!form.employeeId && !form.vehicleId) return setError("Select an employee or vehicle");
        if (!form.base || Number(form.base) < 0) return setError("Enter a valid base amount");
        if (!form.effectiveFrom) return setError("Date is required");
        // Validate date within last month up to today only
        if (form.effectiveFrom < dateBounds.min || form.effectiveFrom > dateBounds.max) {
            return setError("Date must be today or within the last month");
        }

        // If vehicle is selected, create/update an expense entry as vehicle payment
        if (form.vehicleId) {
        try {
            setSaving(true);
            const payload = {
                type: "vehicle",
                recipientId: form.vehicleId,
                amount: Number(form.base),
                category: "Vehicle Payment",
                date: form.effectiveFrom,
                description: form.notes || ""
            };
            if (form._expenseId) {
                await updateExpense(form._expenseId, payload);
                setSuccess("Vehicle payment updated successfully");
            } else {
                await createExpense(payload);
                setSuccess("Vehicle payment created successfully");
            }
            setTimeout(() => navigate("/admin/payroll/salaries"), 800);
            return;
        } catch (err) {
            setError(err?.message || "Failed to save vehicle payment");
        } finally {
            setSaving(false);
        }
        return;
        }

        const selected = employees.find((x) => x._id === form.employeeId);

        const payload = {
        employeeId: form.employeeId, // Employee _id
        currency: form.currency,
        base: Number(form.base),
        effectiveFrom: form.effectiveFrom,
        effectiveTo: form.effectiveTo || null,
        notes: form.notes || undefined,
        components: (form.components || [])
            .filter((c) => (c.name || "").trim())
            .map((c) => ({
            type: c.type === "deduction" ? "deduction" : "earning",
            name: c.name.trim(),
            amount: c.amount ? Number(c.amount) : undefined,
            percentageOfBase: c.percentageOfBase ? Number(c.percentageOfBase) : undefined,
            })),
        };

        try {
        setSaving(true);
        if (id) {
            await PayrollAPI.updateSalary(id, payload);
        } else {
            // type is passed in case the backend needs to infer/ensure Employee
            await PayrollAPI.createSalary(payload, { type: selected?.type });
        }
        navigate("/admin/payroll/salaries");
        } catch (e) {
        setError(e.message || "Save failed");
        } finally {
        setSaving(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-6 md:px-10 py-8">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-extrabold tracking-tight">{id ? "Edit" : "Create"} Employee/Vehicle Salary</h1>
            <Link to="/admin/payroll/salaries" className="text-sm text-[#042391] hover:text-[#042391]/90">
            ← Back to list
            </Link>
        </div>

        {loading ? (
            <div className="mt-6 h-40 rounded-xl bg-gray-100 animate-pulse" />
        ) : (
            <form onSubmit={onSubmit} className="mt-6 grid gap-6 rounded-2xl border border-gray-200 p-6 bg-white shadow-sm">
            {error ? (
                <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-red-700 text-sm">
                {error}
                </div>
            ) : null}
            {success ? (
                <div className="rounded-md border border-green-300 bg-green-50 px-3 py-2 text-green-800 text-sm">
                {success}
                </div>
            ) : null}

            {!employees.length && (
                <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-amber-900 text-sm">
                <div className="font-medium">No employees found.</div>
                <div className="mt-1">
                    If your guide/driver endpoints are custom, set
                    <code className="mx-1">REACT_APP_GUIDE_PATHS</code> /
                    <code className="mx-1">REACT_APP_DRIVER_PATHS</code> (comma-separated paths) in your frontend
                    <code className="mx-1">.env</code>, then reload.
                </div>
                <button
                    type="button"
                    onClick={loadEmployees}
                    className="mt-2 rounded-full border px-3 py-1 text-sm hover:bg-gray-50"
                >
                    Try again
                </button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Employee / Vehicle *">
                <select
                    value={form.employeeId ? `emp:${form.employeeId}` : (form.vehicleId ? `veh:${form.vehicleId}` : "")}
                    onChange={(e) => {
                    const val = e.target.value || "";
                    if (val.startsWith("emp:")) {
                        const idOnly = val.slice(4);
                        setForm((f) => ({ ...f, employeeId: idOnly, vehicleId: "" }));
                    } else if (val.startsWith("veh:")) {
                        const idOnly = val.slice(4);
                        setForm((f) => ({ ...f, vehicleId: idOnly, employeeId: "" }));
                    } else {
                        setForm((f) => ({ ...f, employeeId: "", vehicleId: "" }));
                    }
                    }}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                    <option value="">Select employee/vehicle…</option>
                    <optgroup label="Employees">
                    {employees.map((emp) => (
                    <option key={`emp-${emp._id}`} value={`emp:${emp._id}`}>
                        {emp.code ? `${emp.code} — ` : ""}
                        {emp.label || `${emp.firstName || ""} ${emp.lastName || ""}`.trim()}
                        {emp.type ? ` (${emp.type === "guide" ? "Guide" : "Driver"})` : ""}
                    </option>
                    ))}
                    </optgroup>
                    <optgroup label="Vehicles">
                    {vehicles.map((v) => (
                    <option key={`veh-${v._id}`} value={`veh:${v._id}`}>
                        {v.vehicleType} — {v.numberPlate}
                    </option>
                    ))}
                    </optgroup>
                </select>
                </Field>

                <Field label="Currency">
                <select
                    value={form.currency}
                    onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                    {CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                        {c}
                    </option>
                    ))}
                </select>
                </Field>

                <Field label="Allocated Amount for Trip *">
                <input
                    inputMode="decimal"
                    value={form.base}
                    onChange={(e) =>
                    setForm((f) => ({ ...f, base: e.target.value.replace(/[^\d.]/g, "") }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="0.00"
                />
                </Field>

                <Field label="Date *">
                <input
                    type="date"
                    value={form.effectiveFrom}
                    onChange={(e) => setForm((f) => ({ ...f, effectiveFrom: e.target.value }))}
                    min={dateBounds.min}
                    max={dateBounds.max}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                </Field>

                <Field label="Notes">
                <input
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Optional"
                />
                </Field>
            </div>

            {/* Components */}
            <div>
                <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Pay components</h3>
                <div className="flex gap-2">
                    <button
                    type="button"
                    onClick={() => addRow("earning")}
                    className="rounded-full border border-[#042391] px-3 py-1 text-sm hover:bg-[#042391]/10 text-[#042391]"
                    >
                    + Add earning
                    </button>
                    <button
                    type="button"
                    onClick={() => addRow("deduction")}
                    className="rounded-full border border-[#042391] px-3 py-1 text-sm hover:bg-[#042391]/10 text-[#042391]"
                    >
                    + Add deduction
                    </button>
                </div>
                </div>

                {form.components.length === 0 ? (
                <p className="mt-2 text-sm text-gray-600">No extra components added.</p>
                ) : (
                <div className="mt-3 grid gap-3">
                    {form.components.map((row, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                        <select
                        value={row.type}
                        onChange={(e) => editRow(idx, "type", e.target.value)}
                        className="col-span-3 md:col-span-2 rounded-lg border border-gray-300 px-2 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                        <option value="earning">Earning</option>
                        <option value="deduction">Deduction</option>
                        </select>

                        <input
                        value={row.name}
                        onChange={(e) => {
                            const lettersOnly = e.target.value.replace(/[^A-Za-z\s]/g, "");
                            editRow(idx, "name", lettersOnly);
                        }}
                        pattern="[A-Za-z\s]*"
                        title="Only letters and spaces are allowed"
                        placeholder="Name"
                        className="col-span-9 md:col-span-4 rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />

                        <input
                        inputMode="decimal"
                        value={row.amount}
                        onChange={(e) =>
                            editRow(idx, "amount", e.target.value.replace(/[^\d.]/g, ""))
                        }
                        placeholder="Fixed amount"
                        className="col-span-6 md:col-span-5 rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />

                        {/* Removed percentageOfBase input as requested */}

                        <button
                        type="button"
                        onClick={() => removeRow(idx)}
                        className="col-span-2 md:col-span-1 rounded-full border border-red-200 px-2 py-2 text-sm text-red-600 hover:bg-red-50"
                        title="Remove"
                        >
                        ✕
                        </button>
                    </div>
                    ))}
                </div>
                )}
            </div>

            {/* Preview */}
            <div className="rounded-xl bg-gray-50 border p-4 text-sm">
                <div className="flex flex-wrap gap-6">
                <div>
                    <span className="text-gray-600">Earnings:</span>{" "}
                    <span className="font-medium">{totals.earnings.toFixed(2)}</span>
                </div>
                <div>
                    <span className="text-gray-600">Deductions:</span>{" "}
                    <span className="font-medium">{totals.deductions.toFixed(2)}</span>
                </div>
                <div>
                    <span className="text-gray-600">Gross:</span>{" "}
                    <span className="font-medium">{totals.gross.toFixed(2)}</span>
                </div>
                <div>
                    <span className="text-gray-600">Net:</span>{" "}
                    <span className="font-medium">{totals.net.toFixed(2)}</span>
                </div>
                </div>
            </div>

            <div className="flex items-center justify-end gap-3">
                <Link
                to="/admin/payroll/salaries"
                className="rounded-full border px-5 py-2 text-sm hover:bg-gray-50"
                >
                Cancel
                </Link>
                <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-[#042391] text-white px-6 py-2 text-sm font-medium hover:bg-[#042391]/90 focus:outline-none focus:ring-2 focus:ring-[#042391] active:scale-95"
                >
                {saving ? "Saving…" : id ? "Save changes" : "Create salary"}
                </button>
            </div>
            </form>
        )}
        </div>
    );
    }

    function Field({ label, children }) {
    return (
        <div>
        <label className="block text-sm text-gray-700 mb-1">{label}</label>
        {children}
        </div>
    );
}
