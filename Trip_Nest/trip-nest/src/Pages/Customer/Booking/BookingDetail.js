//package details(increase no of person)

// src/Pages/Customer/BookingDetail.js
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function BookingDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const baseUrl = useMemo(
        () => process.env.REACT_APP_API_URL || "http://localhost:4000/api",
        []
    );
    const apiBase = process.env.REACT_APP_API_URL || "http://localhost:4000/api";
    const fileBase = apiBase.replace(/\/api\/?$/, "");

    const [pkg, setPkg] = useState(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    // qty for booking (min 1, max = maxTourist)
    const [qty, setQty] = useState(1);

    useEffect(() => {
        let live = true;
        setLoading(true);
        setErr("");

        fetch(`${baseUrl}/packages/${id}`, { credentials: "include" })
        .then(async (r) => {
            const data = await r.json();
            if (!r.ok) throw new Error(data?.error || "Failed to load package");
            return data;
        })
        .then((data) => {
            if (!live) return;
            setPkg(data);
            setQty(1);
        })
        .catch((e) => {
            if (!live) return;
            console.error(e);
            setErr(e.message || "Something went wrong");
        })
        .finally(() => live && setLoading(false));

        return () => { live = false; };
    }, [baseUrl, id]);

    const fmtDate = (d) =>
        d ? new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";

    const money = (n) =>
        typeof n === "number"
        ? n.toLocaleString(undefined, { style: "currency", currency: "USD" })
        : "—";

    const imageSrc = (u) => (u?.startsWith("http") ? u : (u ? `${fileBase}${u}` : ""));

    const onReserve = () => {
                    navigate(`/checkout?packageId=${pkg._id}&qty=${qty}`);
            };

    if (loading) {
        return (
        <div className="min-h-screen bg-white">
            <div className="mx-auto max-w-6xl px-6 md:px-10 py-8">
            <div className="h-8 w-64 bg-gray-200 animate-pulse rounded mb-6" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                <div className="h-72 bg-gray-200 animate-pulse rounded-2xl" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="h-40 bg-gray-200 animate-pulse rounded-2xl" />
                    <div className="h-40 bg-gray-200 animate-pulse rounded-2xl" />
                </div>
                </div>
                <div className="h-72 bg-gray-200 animate-pulse rounded-2xl" />
            </div>
            </div>
        </div>
        );
    }

    if (err || !pkg) {
        return (
        <div className="min-h-screen bg-white">
            <div className="mx-auto max-w-3xl px-6 md:px-10 py-10">
            <div className={`mb-6 ${err ? "text-red-600" : "text-gray-700"}`}>
                {err || "Package not found."}
            </div>
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

    const images = Array.isArray(pkg.imageUrls) ? pkg.imageUrls : [];
    const max = Number.isFinite(pkg.maxTourist) ? pkg.maxTourist : 10;
    const price = Number.isFinite(pkg.price) ? pkg.price : 0;
    const total = Math.max(1, qty) * price;

    return (
        <div className="min-h-screen bg-white text-gray-900">
        <div className="mx-auto max-w-7xl px-4 md:px-8 py-6">
            {/* Header row */}
            <div className="flex items-start justify-between gap-4">
            <div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                {pkg.name || "Package"}
                </h1>
                <div className="mt-2 text-sm text-gray-600 flex flex-wrap gap-4">
                <span>
                    <span className="font-medium">Contact:</span>{" "}
                    {pkg.contact ? <a href={`tel:${pkg.contact}`} className="hover:underline">{pkg.contact}</a> : "—"}
                </span>
                <span>
                    <span className="font-medium">Email:</span>{" "}
                    {pkg.email ? <a href={`mailto:${pkg.email}`} className="hover:underline">{pkg.email}</a> : "—"}
                </span>
                </div>
            </div>

            <button
                onClick={onReserve}
                className="rounded-full bg-black text-white px-6 py-2 text-sm font-medium hover:bg-gray-900 transition"
            >
                Reserve
            </button>
            </div>

            {/*left section(gallery+description)*/}

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: gallery */}
            <div className="lg:col-span-2 space-y-6">
                <div className="rounded-2xl overflow-hidden border border-gray-200">
                {images.length ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2">
                    <img
                        src={imageSrc(images[0])}
                        alt={pkg.name}
                        className="w-full h-72 md:h-96 object-cover rounded"
                        loading="lazy"
                    />
                    <div className="grid grid-cols-2 gap-2">
                        {images.slice(1, 5).map((u, i) => (
                        <img
                            key={i}
                            src={imageSrc(u)}
                            alt={`${pkg.name} ${i + 2}`}
                            className="w-full h-36 md:h-46 object-cover rounded"
                            loading="lazy"
                        />
                        ))}
                        {images.length < 5
                        ? Array.from({ length: Math.max(0, 4 - (images.length - 1)) }).map((_, i) => (
                            <div key={i} className="w-full h-36 md:h-46 rounded bg-gray-100 grid place-items-center text-gray-400">
                                —
                            </div>
                            ))
                        : null}
                    </div>
                    </div>
                ) : (
                    <div className="h-72 md:h-96 grid place-items-center text-gray-500">No images</div>
                )}
                </div>

                {/* About */}
                <section>
                <h2 className="text-lg font-semibold mb-2">About this property</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {pkg.about?.trim()
                    ? pkg.about
                    : "No description provided yet for this package."}
                </p>
                </section>

                {/* Optional: facilities (static examples; replace with your data if you add it) */}
                <section>
                <h3 className="text-base font-semibold mt-6 mb-2">Most popular facilities</h3>
                <ul className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-gray-700">
                    <li>🛏️ Non-smoking rooms</li>
                    <li>📶 Free Wi-Fi</li>
                    <li>🅿️ Free parking</li>
                    <li>🍳 Breakfast</li>
                    <li>🚐 Airport shuttle</li>
                    <li>🍽️ Restaurant</li>
                </ul>
                </section>
            </div>

            {/* Right: details card */}
            <aside>
                <div className="rounded-2xl border border-gray-200 p-6 bg-gray-100/60">
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                    <span className="text-gray-600">Max Tourist Allowed</span>
                    <span className="font-medium">{max}</span>
                    </div>
                    
                    <div className="flex justify-between">
                    <span className="text-gray-600">Airport Pickup</span>
                    <span className="font-medium">{pkg.guide || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                    <span className="text-gray-600">Locations</span>
                    <span className="font-medium">—</span> {/* add a field when available */}
                    </div>
                </div>

                 {/* increase and decrease no of tourist */}

                {/* Qty + price */}
                
                <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                    <button
                        onClick={() => setQty((q) => Math.max(1, q - 1))}
                        className="h-9 w-9 rounded-full border text-xl grid place-items-center"
                        aria-label="Decrease"
                    >
                        –
                    </button>

                    {/* quantity selector logic */}

                    <div className="min-w-[2ch] text-xl font-medium text-center">{qty}</div>
                    <button
                        onClick={() => setQty((q) => Math.min(max, q + 1))}
                        className="h-9 w-9 rounded-full border text-xl grid place-items-center"
                        aria-label="Increase"
                        disabled={qty >= max}
                    >
                        +
                    </button>
                    </div>

                    <div className="text-right">
                    <div className="text-xs text-gray-600">Price (per person)</div>
                    <div className="text-lg font-semibold">{money(price)}</div>
                    <div className="text-xs text-gray-600 mt-1">
                        Total: <span className="font-semibold">{money(total)}</span>
                    </div>
                    </div>
                </div>

                <button
                    onClick={onReserve}
                    className="mt-6 w-full rounded-full bg-black text-white px-6 py-2 text-sm font-medium hover:bg-gray-900 transition"
                >
                    Reserve
                </button>
                </div>
            </aside>
            </div>
        </div>
        </div>
    );
}
