// src/Pages/Admin/OfferDetail.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";

export default function OfferDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const apiBase = useMemo(
        () => process.env.REACT_APP_API_URL || "http://localhost:4000/api",
        []
    );

    const [offer, setOffer] = useState(null);
    const [pkgs, setPkgs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    useEffect(() => {
        let live = true;
        (async () => {
        try {
            setLoading(true);
            setErr("");
            // 1) offer
            const ro = await fetch(`${apiBase}/offers/${id}`, { credentials: "include" });
            const o = await ro.json();
            if (!ro.ok) throw new Error(o?.error || "Failed to load offer");

            // 2) packages (fetch all → filter by promotion id)
            const rp = await fetch(`${apiBase}/packages`, { credentials: "include" });
            const p = await rp.json();
            const arr = Array.isArray(p) ? p : p.items || [];

            if (live) {
            setOffer(o);
            setPkgs(arr.filter((x) => String(x.promotion) === String(o._id)));
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

    const fmt = (d) =>
        d ? new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";
    const daysLeft = (start, end) => {
        if (!end) return null;
        const e = new Date(end);
        e.setHours(23, 59, 59, 999);
        const diff = e.getTime() - Date.now();
        const d = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return diff <= 0 ? 0 : d;
    };

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

    if (err || !offer) {
        return (
        <div className="min-h-screen bg-white">
            <div className="max-w-3xl mx-auto p-6">
            <div className={`mb-6 ${err ? "text-red-600" : "text-gray-700"}`}>{err || "Offer not found."}</div>
            <button
                onClick={() => navigate(-1)}
                className="rounded-full border px-4 py-2 text-sm hover:bg-gray-100"
            >
                ← Back
            </button>
            </div>
        </div>
        );
    }

    const left = daysLeft(offer.startDate, offer.endDate);
    const active =
        offer.startDate && offer.endDate && new Date(offer.startDate) <= new Date() && new Date() <= new Date(offer.endDate);

    return (
        <div className="min-h-screen bg-white">
        <div className="max-w-5xl mx-auto px-6 py-8">
            <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-extrabold">{offer.name}</h1>
            <Link to="/admin/offers" className="rounded-full border px-4 py-2 text-sm hover:bg-gray-100">
                ← All offers
            </Link>
            </div>

            <div className="mt-6 rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50 shadow-lg p-8">
            <div className="flex flex-wrap items-start justify-between gap-6">
                <div className="flex-1 space-y-4">
                    {/* Description */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Description</h3>
                        <p className="text-lg text-gray-800 leading-relaxed">{offer.description || "No description provided"}</p>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Start Date</h3>
                            <p className="text-base font-medium text-gray-800">{fmt(offer.startDate)}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">End Date</h3>
                            <p className="text-base font-medium text-gray-800">{fmt(offer.endDate)}</p>
                        </div>
                    </div>

                    {/* Discount */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Discount</h3>
                        <p className="text-3xl font-bold text-emerald-600">{offer.discountPercent}% OFF</p>
                    </div>
                </div>

                {/* Status Badge */}
                <div className="flex flex-col items-end gap-3">
                    <div
                        className={`inline-block rounded-full px-6 py-3 text-base font-semibold border-2 ${
                        active 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300 shadow-emerald-100 shadow-md" 
                            : "bg-gray-50 text-gray-700 border-gray-300"
                        }`}
                    >
                        {active ? "✓ Active" : "○ Inactive"}
                    </div>
                    {left != null && (
                        <div className={`text-sm font-medium px-4 py-2 rounded-lg ${
                            left === 0 ? "bg-red-50 text-red-700" : 
                            left <= 3 ? "bg-orange-50 text-orange-700" : 
                            "bg-blue-50 text-blue-700"
                        }`}>
                            {left === 0 ? "Ended" : left === 1 ? "Ends today" : `${left} days remaining`}
                        </div>
                    )}
                </div>
            </div>
            </div>
        </div>
        </div>
    );
}
