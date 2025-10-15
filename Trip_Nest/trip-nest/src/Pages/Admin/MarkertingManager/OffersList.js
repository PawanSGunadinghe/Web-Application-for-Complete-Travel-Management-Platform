// src/Pages/Admin/OffersList.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

export default function OffersList() {
    const apiBase = useMemo(
        () => process.env.REACT_APP_API_URL || "http://localhost:4000/api",
        []
    );
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [deletingId, setDeletingId] = useState(""); // track row being deleted

    useEffect(() => {
        let live = true;
        (async () => {
        try {
            setLoading(true);
            setErr("");
            const r = await fetch(`${apiBase}/offers`, { credentials: "include" });
            const data = await r.json();
            if (!r.ok) throw new Error(data?.error || "Failed to load offers");
            if (live) setItems(Array.isArray(data) ? data : data.items || []);
        } catch (e) {
            if (live) {
            setErr(e.message || "Something went wrong");
            setItems([]);
            }
        } finally {
            if (live) setLoading(false);
        }
        })();
        return () => {
        live = false;
        };
    }, [apiBase]);

    const daysLeft = (start, end) => {
        if (!end) return null;
        const e = new Date(end);
        e.setHours(23, 59, 59, 999);
        const diff = e.getTime() - Date.now();
        const d = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return diff <= 0 ? 0 : d;
    };

    async function handleDelete(id) {
        const ok = window.confirm("Delete this offer? This action cannot be undone.");
        if (!ok) return;
        try {
        setDeletingId(id);
        const r = await fetch(`${apiBase}/offers/${id}`, {
            method: "DELETE",
            credentials: "include",
        });
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data?.error || "Failed to delete offer");
        // remove from list
        setItems((prev) => prev.filter((o) => o._id !== id));
        } catch (e) {
        alert(e.message || "Delete failed");
        } finally {
        setDeletingId("");
        }
    }

    return (
        <div className="min-h-screen bg-white">
        <div className="max-w-5xl mx-auto px-6 py-8">
            <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-extrabold">Offers</h1>
            <Link to="/admin/add-offers" className="rounded-full border px-4 py-2 text-sm hover:bg-gray-100">
                + New offer
            </Link>
            </div>

            {err ? <div className="mt-4 text-red-600">{err}</div> : null}

            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <li key={i} className="h-28 rounded-xl bg-gray-100 animate-pulse" />
                ))
                : items.map((o) => {
                    const left = daysLeft(o.startDate, o.endDate);
                    const now = new Date();
                    const active =
                    o.startDate && o.endDate && new Date(o.startDate) <= now && now <= new Date(o.endDate);
                    const isDeleting = deletingId === o._id;

                    return (
                    <li key={o._id} className="rounded-xl border p-4">
                        <div className="flex items-start justify-between">
                        <div>
                            <div className="text-lg font-semibold">{o.name}</div>
                            <div className="text-sm text-gray-600">
                            {new Date(o.startDate).toLocaleDateString()} → {new Date(o.endDate).toLocaleDateString()}
                            </div>
                            <div className="text-sm mt-1 text-gray-700">{o.discountPercent}% OFF</div>
                        </div>
                        <div className="text-right">
                            <div
                            className={`inline-block rounded-full px-3 py-1 text-xs border ${
                                active
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-gray-50 text-gray-700 border-gray-200"
                            }`}
                            >
                            {active ? "Active" : "Inactive"}
                            </div>
                            {left != null && (
                            <div className="text-xs text-gray-500 mt-1">
                                {left === 0 ? "Ended" : left === 1 ? "Ends today" : `Ends in ${left}d`}
                            </div>
                            )}
                        </div>
                        </div>

                        <div className="mt-3 flex gap-2">
                        <Link
                            to={`/admin/offers/${o._id}`}
                            className="rounded-full border px-3 py-1 text-sm hover:bg-gray-100"
                        >
                            View
                        </Link>

                        <Link
                            to={`/admin/offers/${o._id}/edit`}
                            className="rounded-full border border-blue-600 text-blue-600 px-3 py-1 text-sm hover:bg-blue-50 transition"
                        >
                            Edit
                        </Link>

                        <button
                            type="button"
                            onClick={() => handleDelete(o._id)}
                            disabled={isDeleting}
                            className={`rounded-full border px-3 py-1 text-sm transition ${
                            isDeleting
                                ? "opacity-60 cursor-not-allowed"
                                : "hover:bg-red-50 border-red-600 text-red-700"
                            }`}
                            title="Delete this offer"
                        >
                            {isDeleting ? "Deleting…" : "Delete"}
                        </button>
                        </div>
                    </li>
                    );
                })}
            </ul>

            {!loading && items.length === 0 && !err ? (
            <div className="mt-8 text-gray-600">No offers yet. Create one.</div>
            ) : null}
        </div>
        </div>
    );
}
