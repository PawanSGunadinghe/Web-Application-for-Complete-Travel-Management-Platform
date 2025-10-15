// src/Pages/Admin/OffersEdit.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function OffersEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const apiBase = useMemo(
        () => process.env.REACT_APP_API_URL || "http://localhost:4000/api",
        []
    );

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState("");
    const [form, setForm] = useState({
        name: "",
        description: "",
        discountPercent: 0,
        startDate: "",
        endDate: "",
    });
    const [formErrors, setFormErrors] = useState({});

    // Get today's date in YYYY-MM-DD format
    const today = useMemo(() => new Date().toISOString().split("T")[0], []);

    useEffect(() => {
        let live = true;
        (async () => {
            try {
                setLoading(true);
                setErr("");
                const r = await fetch(`${apiBase}/offers/${id}`, { credentials: "include" });
                const data = await r.json();
                if (!r.ok) throw new Error(data?.error || "Failed to load offer");
                
                if (live) {
                    setForm({
                        name: data.name || "",
                        description: data.description || "",
                        discountPercent: data.discountPercent || 0,
                        startDate: data.startDate ? data.startDate.slice(0, 10) : "",
                        endDate: data.endDate ? data.endDate.slice(0, 10) : "",
                    });
                }
            } catch (e) {
                if (live) {
                    setErr(e.message || "Something went wrong");
                }
            } finally {
                if (live) setLoading(false);
            }
        })();
        return () => { live = false; };
    }, [apiBase, id]);

    async function handleSave(e) {
        e.preventDefault();
        try {
            setSaving(true);
            setFormErrors({});
            const resp = await fetch(`${apiBase}/offers/${id}`, {
                method: "PUT",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: form.name,
                    description: form.description,
                    discountPercent: Number(form.discountPercent),
                    startDate: form.startDate || null,
                    endDate: form.endDate || null,
                }),
            });
            const data = await resp.json();
            if (!resp.ok) {
                if (data?.errors) setFormErrors(data.errors);
                throw new Error(data?.error || "Failed to update offer");
            }
            alert("Offer updated successfully!");
            navigate("/admin/offers");
        } catch (e) {
            console.error(e);
            alert(e.message || "Update failed");
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-white">
                <div className="max-w-4xl mx-auto p-6">
                    <div className="h-6 w-48 bg-gray-200 animate-pulse rounded mb-4" />
                    <div className="h-32 bg-gray-200 animate-pulse rounded" />
                </div>
            </div>
        );
    }

    if (err) {
        return (
            <div className="min-h-screen bg-white">
                <div className="max-w-3xl mx-auto p-6">
                    <div className="text-red-600 mb-6">{err}</div>
                    <button
                        onClick={() => navigate("/admin/offers")}
                        className="rounded-full border px-4 py-2 text-sm hover:bg-gray-100"
                    >
                        ← Back to Offers
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-4xl mx-auto px-6 py-8">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl md:text-3xl font-extrabold">Edit Offer</h1>
                    <button
                        onClick={() => navigate("/admin/offers")}
                        className="rounded-full border px-4 py-2 text-sm hover:bg-gray-100"
                    >
                        ← Back to Offers
                    </button>
                </div>

                <form onSubmit={handleSave} className="rounded-2xl border p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Offer Name */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Offer Name
                            </label>
                            <input
                                type="text"
                                className="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={form.name}
                                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                required
                            />
                            {formErrors.name && (
                                <p className="text-sm text-red-600 mt-1">{formErrors.name}</p>
                            )}
                        </div>

                        {/* Description */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description
                            </label>
                            <textarea
                                rows={4}
                                className="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={form.description}
                                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                                placeholder="Enter offer description..."
                            />
                        </div>

                        {/* Discount Percentage */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Discount Percentage (%)
                            </label>
                            <input
                                type="number"
                                min={0}
                                max={100}
                                className="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={form.discountPercent}
                                onChange={(e) => {
                                    const value = Number(e.target.value);
                                    setForm((f) => ({ ...f, discountPercent: Math.min(100, Math.max(0, value)) }));
                                }}
                                required
                            />
                            {formErrors.discountPercent && (
                                <p className="text-sm text-red-600 mt-1">{formErrors.discountPercent}</p>
                            )}
                        </div>

                        <div></div>

                        {/* Start Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Start Date
                            </label>
                            <input
                                type="date"
                                min={today}
                                className="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={form.startDate}
                                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                                required
                            />
                            {formErrors.startDate && (
                                <p className="text-sm text-red-600 mt-1">{formErrors.startDate}</p>
                            )}
                        </div>

                        {/* End Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                End Date
                            </label>
                            <input
                                type="date"
                                min={form.startDate ? new Date(new Date(form.startDate).getTime() + 86400000).toISOString().split('T')[0] : today}
                                className="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={form.endDate}
                                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                                required
                            />
                            {formErrors.endDate && (
                                <p className="text-sm text-red-600 mt-1">{formErrors.endDate}</p>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t">
                        <button
                            type="button"
                            onClick={() => navigate("/admin/offers")}
                            className="rounded-full border border-gray-300 px-6 py-2 text-sm hover:bg-gray-100 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-full bg-blue-600 text-white px-6 py-2 text-sm font-medium hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
