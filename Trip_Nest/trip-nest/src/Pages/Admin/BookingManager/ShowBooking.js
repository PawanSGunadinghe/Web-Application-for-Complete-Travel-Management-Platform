import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

export default function AdminBookingsPage() {
    const apiBase = useMemo(
        () => (process.env.REACT_APP_API_URL || "http://localhost:4000/api").replace(/\/+$/, ""),
        []
    );
    const fileBase = useMemo(() => apiBase.replace(/\/api$/, ""), [apiBase]);

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [q, setQ] = useState("");

    useEffect(() => {
        let live = true;
        (async () => {
        setLoading(true);
        setErr("");
        try {
            // admin can pass ?all=1 on /api/bookings, server filters by role
            const r = await fetch(`${apiBase}/bookings?all=1`, { credentials: "include" });
            const data = await r.json();
            if (!r.ok) throw new Error(data?.error || "Failed to load bookings");
            if (live) setItems(Array.isArray(data) ? data : []);
        } catch (e) {
            if (live) {
            console.error(e);
            setErr(e.message || "Something went wrong");
            setItems([]);
            }
        } finally {
            if (live) setLoading(false);
        }
        })();
        return () => { live = false; };
    }, [apiBase]);

    const resolveImg = (u) => (!u ? "" : /^https?:\/\//i.test(u) ? u : `${fileBase}${u}`);
    const money = (n) => Number(n || 0).toLocaleString(undefined, { style: "currency", currency: "USD" });
    const fmt = (d) => (d ? new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—");

    const filtered = items.filter((b) => {
        const term = q.trim().toLowerCase();
        if (!term) return true;
        const pkg = b.package || b.packageSnapshot || {};
        return (
        String(pkg.name || "").toLowerCase().includes(term) ||
        String(b.status || "").toLowerCase().includes(term) ||
        String(b._id || "").toLowerCase().includes(term) ||
        String(b?.customer?.email || "").toLowerCase().includes(term)
        );
    });

    return (
        <div className="min-h-screen bg-white text-gray-900">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
            <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">All Bookings (Admin)</h1>
            <div className="flex items-center gap-2 border rounded-full px-3 py-1.5">
                <span className="text-gray-500">🔎</span>
                <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by package, email, status, id"
                className="bg-transparent outline-none"
                />
            </div>
            </div>

            {err ? <div className="mt-4 text-red-600">{err}</div> : null}

            <div className="mt-6 overflow-x-auto border rounded-2xl">
            <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                <tr>
                    <th className="px-4 py-2 text-left">Booking</th>
                    <th className="px-4 py-2 text-left">Package</th>
                    <th className="px-4 py-2 text-left">Guest</th>
                    <th className="px-4 py-2 text-left">Dates</th>
                    <th className="px-4 py-2 text-right">Guests</th>
                    <th className="px-4 py-2 text-right">Total</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-right">Actions</th>
                </tr>
                </thead>
                <tbody className="divide-y">
                {loading
                    ? Array.from({ length: 6 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                        <td className="px-4 py-3" colSpan={8}>
                            <div className="h-4 bg-gray-200 rounded" />
                        </td>
                        </tr>
                    ))
                    : filtered.map((b) => {
                        const pkg = b.package || b.packageSnapshot || {};
                        const img = resolveImg((pkg.imageUrls || [])[0]);
                        return (
                        <tr key={b._id}>
                            <td className="px-4 py-3">
                            <div className="font-mono text-xs text-gray-600">#{b._id}</div>
                            <div className="text-gray-400">{fmt(b.createdAt)}</div>
                            </td>
                            <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-14 bg-gray-100 rounded overflow-hidden">
                                {img ? <img src={img} alt={pkg.name} className="h-full w-full object-cover" /> : null}
                                </div>
                                <div>
                                <div className="font-medium">{pkg.name || "Package"}</div>
                                <div className="text-xs text-gray-500 truncate w-56">
                                    {pkg.startDate ? fmt(pkg.startDate) : "—"} – {pkg.endDate ? fmt(pkg.endDate) : "—"}
                                </div>
                                </div>
                            </div>
                            </td>
                            <td className="px-4 py-3">
                            <div className="font-medium">
                                {b?.customer?.firstName} {b?.customer?.lastName}
                            </div>
                            <div className="text-xs text-gray-500">{b?.customer?.email || "—"}</div>
                            </td>
                            <td className="px-4 py-3">
                            <div className="text-sm">{fmt(pkg.startDate)} – {fmt(pkg.endDate)}</div>
                            </td>
                            <td className="px-4 py-3 text-right">{b?.pricing?.qty || b.qty || 1}</td>
                            <td className="px-4 py-3 text-right font-semibold">{money(b?.pricing?.total)}</td>
                            <td className="px-4 py-3">
                            <span
                                className={`inline-block text-xs px-2 py-0.5 rounded-full ${
                                b.status === "confirmed"
                                    ? "bg-green-100 text-green-700"
                                    : b.status === "cancelled"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-gray-100 text-gray-700"
                                }`}
                            >
                                {b.status || "created"}
                            </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                            <Link
                                to={`/bookings/${b._id}`}
                                className="inline-block rounded-full border px-3 py-1 text-xs hover:bg-gray-100"
                            >
                                View
                            </Link>
                            </td>
                        </tr>
                        );
                    })}
                {!loading && filtered.length === 0 ? (
                    <tr>
                    <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                        No bookings found.
                    </td>
                    </tr>
                ) : null}
                </tbody>
            </table>
            </div>
        </div>
        </div>
    );
}
