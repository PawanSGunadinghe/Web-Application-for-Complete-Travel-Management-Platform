import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import IMG1 from "../../../Assets/padd2.jpg";
import { motion, AnimatePresence } from "framer-motion";

export default function PackageDashboard() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState("");

    const navigate = useNavigate();
    const baseUrl = useMemo(
        () => process.env.REACT_APP_API_URL || "http://localhost:4000/api",
        []
    );

    useEffect(() => {
        let live = true;
        setLoading(true);
        fetch(`${baseUrl}/packages`, { credentials: "include" })
        .then(async (r) => {
            const data = await r.json();
            if (!r.ok) throw new Error(data?.error || "Failed to load packages");
            return data;
        })
        .then((data) => {
            if (!live) return;
            const arr = Array.isArray(data) ? data : data.items || [];
            setItems(arr);
        })
        .catch((e) => {
            console.error(e);
            if (live) setItems([]);
        })
        .finally(() => live && setLoading(false));
        return () => {
        live = false;
        };
    }, [baseUrl]);

    const filtered = items.filter((p) => {
        const term = q.trim().toLowerCase();
        if (!term) return true;
        return (
        (p.name || "").toLowerCase().includes(term) ||
        (p.guide || "").toLowerCase().includes(term)
        );
    });

    const apiBase = process.env.REACT_APP_API_URL || "http://localhost:4000/api";
    const fileBase = apiBase.replace(/\/api\/?$/, "");

    // ---- helper: compute remaining days for promotion ----
    const getPromoRemaining = (promotion) => {
        if (!promotion) return null;
        // Support a few common end-date field names:
        const endIso =
        promotion.endDate || promotion.validUntil || promotion.expiresAt;
        if (!endIso) return null;

        const end = new Date(endIso);
        if (Number.isNaN(end.getTime())) return null;

        // Count down to end-of-day of the end date
        end.setHours(23, 59, 59, 999);
        const diffMs = end.getTime() - Date.now();
        const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        return {
        ended: diffMs <= 0,
        days: Math.max(days, 0),
        };
    };

    const Card = ({ p }) => {
        const raw = p.imageUrls?.[0] || "";
        const cover = raw.startsWith("http") ? raw : raw ? `${fileBase}${raw}` : "";

        const discountedPrice = p.promotion?.discountPercent
        ? p.price * (1 - p.promotion.discountPercent / 100)
        : p.price;

        const remain = useMemo(() => getPromoRemaining(p.promotion), [p.promotion]);

        // Badge label logic
        let promoBadge = null;
        if (p?.promotion?.discountPercent && remain) {
        promoBadge = remain.ended
            ? "Offer ended"
            : remain.days <= 1
            ? "Ends today"
            : `Ends in ${remain.days}d`;
        }

        return (
        <article className="relative rounded-2xl overflow-hidden bg-blue-100 border border-gray-200 hover:shadow-lg transition">
            {/* Promotion badge (top-right) */}
            {promoBadge && (
            <span
                className={`absolute right-3 top-3 z-10 rounded-full px-3 py-1 text-xs font-semibold border ${
                remain?.ended
                    ? "bg-gray-100 text-gray-700 border-gray-200"
                    : "bg-amber-50 text-amber-800 border-amber-200"
                }`}
                title={
                remain?.ended
                    ? "This promotion has ended"
                    : "This promotion is currently active"
                }
            >
                {promoBadge}
            </span>
            )}

            {/* Image area */}
            {cover ? (
            <img
                src={cover}
                alt={p.name}
                className="h-60 w-full object-cover"
                loading="lazy"
            />
            ) : (
            <div className="h-60 grid place-items-center text-gray-700">Images</div>
            )}

            {/* Bottom content */}
            <div className="p-4">
            <h3 className="font-semibold truncate">{p.name || "—"}</h3>

            <p className="mt-1 text-sm">
                {p.promotion?.discountPercent ? (
                <>
                    <span className="line-through text-gray-500 mr-2">
                    ${Number(p.price || 0).toFixed(2)}
                    </span>
                    <span className="text-green-600 font-bold">
                    ${Number(discountedPrice || 0).toFixed(2)}
                    </span>
                    <span className="ml-1 text-xs text-green-600">
                    ({p.promotion.discountPercent}% OFF)
                    </span>
                </>
                ) : (
                <>${Number(p.price || 0).toFixed(2)}</>
                )}
            </p>
            </div>

            {/* View button bottom-right */}
            <button
            type="button"
            onClick={() => navigate(`/admin/package-details/${p._id}`)}
            className="absolute bottom-4 right-4 rounded-full border border-blue-600 bg-white px-4 py-1.5 text-sm font-medium hover:bg-blue-600 hover:text-white transition"
            >
            View
            </button>
        </article>
        );
    };

    // Animation: slide up on mount
    // We'll use Framer Motion for a smooth down-to-up effect
    // 1. Install: npm install framer-motion

    return (
        <div className="min-h-screen bg-white text-gray-900">
        <header className="relative">
            <div
            className="h-44 md:h-56 w-full bg-center bg-cover"
            style={{
                backgroundImage: `url(${IMG1})`,
            }}
            />
            <div className="absolute inset-0 bg-black/30" />
            <div className="absolute inset-0 flex items-center">
            <div className="mx-auto max-w-6xl w-full px-6 md:px-10 flex items-center justify-between">
                <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow">
                Current Packages
                </h1>

                <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-full bg-white/90 border border-white/60 px-4 py-2 w-[240px]">
                    <span className="inline-block text-gray-500">🔎</span>
                    <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search"
                    className="w-full bg-transparent focus:outline-none text-gray-800 placeholder:text-gray-500"
                    />
                </div>
                </div>
            </div>
            </div>
        </header>

        <div className="mx-auto max-w-2.5xl px-5 md:px-10 py-8">
            {/* Button group aligned right with gap */}
            <div className="flex justify-end gap-4 mb-6">
                <Link to="/admin/add-package">
                    <button className="rounded-full bg-blue-600 text-white px-5 py-2 text-sm font-semibold border border-white hover:bg-blue-700">
                    Add New Packages
                    </button>
                </Link>
                <Link to="/admin/add-offers">
                    <button className="rounded-full bg-blue-600 text-white px-5 py-2 text-sm font-semibold border border-white hover:bg-blue-700">
                    Add New Offers
                    </button>
                </Link>
                <Link to="/admin/offers">
                    <button className="rounded-full bg-blue-600 text-white px-5 py-2 text-sm font-semibold border border-white hover:bg-blue-700">
                    View Offers List
                    </button>
                </Link>
            </div>
            <hr className="my-5 border-gray-300 border-solid-2" />
            <AnimatePresence>
            <motion.div
                key={loading ? "loading" : "loaded"}
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 60 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-10"
            >
                {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div
                    key={i}
                    className="h-[15rem] rounded-2xl bg-gray-200/70 animate-pulse"
                    />
                ))
                : filtered.map((p) => <Card key={p._id} p={p} />)}
            </motion.div>
            </AnimatePresence>
        </div>
        </div>
    );
}
