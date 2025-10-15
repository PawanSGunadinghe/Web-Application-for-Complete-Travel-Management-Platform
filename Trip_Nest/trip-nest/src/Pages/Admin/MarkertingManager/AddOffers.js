import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AddOffers() {
    const apiBase = useMemo(
        () => process.env.REACT_APP_API_URL || "http://localhost:4000/api",
        []
    );

    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: "",
        description: "",
        startDate: "",
        endDate: "",
        discountPercent: "",
        packageIds: [],
    });
    const [errors, setErrors] = useState({});
    const [packages, setPackages] = useState([]);
    const [loadingPkgs, setLoadingPkgs] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let live = true;
        setLoadingPkgs(true);
        fetch(`${apiBase}/packages`, { credentials: "include" })
        .then((r) => r.json())
        .then((data) => {
            if (!live) return;
            const arr = Array.isArray(data) ? data : data.items || [];
            setPackages(arr);
        })
        .catch(() => live && setPackages([]))
        .finally(() => live && setLoadingPkgs(false));
        return () => { live = false; };
    }, [apiBase]);

    const today = useMemo(() => new Date().toISOString().slice(0,10), []);
    const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const validate = () => {
        const next = {};
        if (!form.name.trim()) next.name = "Promotion name is required";
        if (form.description.length > 250) next.description = "Description must be 250 characters or less";
        if (!form.startDate) next.startDate = "Required";
        if (!form.endDate) next.endDate = "Required";
        if (form.startDate && form.endDate && form.endDate < form.startDate) {
        next.endDate = "End date cannot be before start date";
        }
        // Strict validation for discount percentage
        if (form.discountPercent === "" || form.discountPercent === null || form.discountPercent === undefined) {
            next.discountPercent = "Required";
        } else {
            const d = Number(form.discountPercent);
            if (Number.isNaN(d) || !Number.isInteger(d) || d < 1 || d > 100) {
                next.discountPercent = "Must be a whole number between 1 and 100";
            }
        }
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    async function submit(e) {
        e.preventDefault();
        if (!validate()) return;
        try {
        setSaving(true);
        const payload = {
            name: form.name.trim(),
            description: form.description.trim(),
            startDate: form.startDate,
            endDate: form.endDate,
            discountPercent: Number(form.discountPercent),
            packageIds: form.packageIds, // optional assignment
        };
        const r = await fetch(`${apiBase}/offers`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
            alert(data?.error || "Failed to create offer");
            return;
        }

        navigate(`/admin/offers/${data._id}`);
        alert("Offer created and assigned!");
        setForm({ name: "", description: "", startDate: "", endDate: "", discountPercent: "", packageIds: [] });
        setErrors({});
        } catch (err) {
        alert(err.message || "Network error");
        } finally {
        setSaving(false);
        }
    }

    return (
        <div className="min-h-screen bg-white text-gray-900">
        <div className="max-w-3xl mx-auto px-6 py-8">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Add Offer / Promotion</h1>

            <form onSubmit={submit} className="mt-8 space-y-6 rounded-2xl border p-6">
            <div>
                <label className="block text-sm font-medium">Promotion name</label>
                <input
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                className={`mt-1 w-full rounded-lg border px-3 py-2 ${errors.name ? "border-red-500" : "border-gray-300"}`}
                placeholder="Black Friday 15% OFF"
                />
                {errors.name ? <p className="text-sm text-red-600 mt-1">{errors.name}</p> : null}
            </div>

            <div>
                <label className="block text-sm font-medium">Short description</label>
                <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setField("description", e.target.value.slice(0, 250))}
                className={`mt-1 w-full rounded-lg border px-3 py-2 ${errors.description ? "border-red-500" : "border-gray-300"}`}
                placeholder="Applies to selected packages only…"
                maxLength={250}
                />
                <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-gray-500">Maximum 250 characters</p>
                    <p className={`text-xs ${form.description.length > 250 ? "text-red-600" : "text-gray-500"}`}>
                        {form.description.length}/250
                    </p>
                </div>
                {errors.description ? <p className="text-sm text-red-600 mt-1">{errors.description}</p> : null}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                <label className="block text-sm font-medium">Promotion start date</label>
                <input
                    type="date"
                    min={today}
                    value={form.startDate}
                    onChange={(e) => setField("startDate", e.target.value)}
                    className={`mt-1 w-full rounded-lg border px-3 py-2 ${errors.startDate ? "border-red-500" : "border-gray-300"}`}
                />
                {errors.startDate ? <p className="text-sm text-red-600 mt-1">{errors.startDate}</p> : null}
                </div>
                <div>
                <label className="block text-sm font-medium">Promotion end date</label>
                <input
                    type="date"
                    min={form.startDate || today}
                    value={form.endDate}
                    onChange={(e) => setField("endDate", e.target.value)}
                    className={`mt-1 w-full rounded-lg border px-3 py-2 ${errors.endDate ? "border-red-500" : "border-gray-300"}`}
                />
                {errors.endDate ? <p className="text-sm text-red-600 mt-1">{errors.endDate}</p> : null}
                </div>
                <div>
                <label className="block text-sm font-medium">Promotion discount (%) <span className="text-red-500">*</span></label>
                <input
                    type="number"
                    min={1}
                    max={100}
                    step={1}
                    required
                    value={form.discountPercent}
                    onChange={(e) => {
                        const value = e.target.value;
                        // Only allow numbers 1-100
                        if (value === "" || (Number(value) >= 1 && Number(value) <= 100)) {
                            setField("discountPercent", value);
                            // Clear errors when valid input is entered
                            if (value !== "" && Number(value) >= 1 && Number(value) <= 100) {
                                setErrors(prev => ({ ...prev, discountPercent: undefined }));
                            }
                        }
                    }}
                    onBlur={() => {
                        // Validate on blur to show errors
                        validate();
                    }}
                    className={`mt-1 w-full rounded-lg border px-3 py-2 ${errors.discountPercent ? "border-red-500" : "border-gray-300"}`}
                    placeholder="e.g. 15"
                />
                {errors.discountPercent ? <p className="text-sm text-red-600 mt-1">{errors.discountPercent}</p> : null}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium mb-3">Assign to packages</label>
                {loadingPkgs ? (
                    <div className="text-gray-500 text-sm">Loading packages...</div>
                ) : packages.length === 0 ? (
                    <div className="text-gray-500 text-sm">No packages available</div>
                ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3">
                        {packages.map((p) => {
                            const isChecked = form.packageIds.includes(p._id);
                            return (
                                <label
                                    key={p._id}
                                    className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                        isChecked 
                                            ? 'border-blue-500 bg-blue-50' 
                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={(e) => {
                                            const checked = e.target.checked;
                                            setField(
                                                "packageIds",
                                                checked
                                                    ? [...form.packageIds, p._id]
                                                    : form.packageIds.filter((id) => id !== p._id)
                                            );
                                        }}
                                        className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                                    />
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-900">{p.name}</div>
                                        {typeof p.price === "number" && (
                                            <div className="text-sm text-gray-600 mt-1">
                                                Base price: ${p.price.toFixed(2)}
                                            </div>
                                        )}
                                    </div>
                                </label>
                            );
                        })}
                    </div>
                )}
                <p className="text-xs text-gray-500 mt-2">
                    {form.packageIds.length > 0 
                        ? `${form.packageIds.length} package${form.packageIds.length > 1 ? 's' : ''} selected`
                        : 'Select packages to apply this offer'}
                </p>
            </div>

            <div className="flex justify-end gap-2">
                <button type="reset" onClick={() => setForm({ name: "", description: "", startDate: "", endDate: "", discountPercent: "", packageIds: [] })} className="rounded-full border px-5 py-2">
                Clear
                </button>
                <button type="submit" disabled={saving} className="rounded-full bg-blue-600 text-white px-5 py-2 hover:bg-blue-700 disabled:opacity-60">
                {saving ? "Saving…" : "Create offer"}
                </button>
            </div>
            </form>
        </div>
        </div>
    );
}
