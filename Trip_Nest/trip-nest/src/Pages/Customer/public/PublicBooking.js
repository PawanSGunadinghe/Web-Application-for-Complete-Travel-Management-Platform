// BookingPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

export default function BookingPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState("");

    const apiBase = useMemo(
        () => process.env.REACT_APP_API_URL || "http://localhost:4000/api",
        []
    );
    const fileBase = useMemo(() => apiBase.replace(/\/api\/?$/, ""), [apiBase]);

    useEffect(() => {
        let live = true;
        (async () => {
        setLoading(true);
        try {
            const r = await fetch(`${apiBase}/packages`, { credentials: "include" });
            const data = await r.json();
            if (!r.ok) throw new Error(data?.error || "Failed to load packages");
            const arr = Array.isArray(data) ? data : data.items || [];
            if (live) setItems(arr);
        } catch (e) {
            console.error(e);
            if (live) setItems([]);
        } finally {
            if (live) setLoading(false);
        }
        })();
        return () => {
        live = false;
        };
    }, [apiBase]);

    const resolveImg = (raw) =>
        !raw ? "" : raw.startsWith("http") ? raw : `${fileBase}${raw}`;

    const formatPrice = (value) => {
        if (value == null) return null;
        try {
        return Number(value).toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 2,
        });
        } catch {
        return `$${value}`;
        }
    };

    const Card = ({ p }) => {
        const cover = resolveImg(p?.imageUrls?.[0] || p?.image || "");
        const price =
        formatPrice(p?.price ?? p?.priceUSD ?? p?.amount ?? p?.cost) || null;
        const subtitle = p?.subtitle || p?.guide || p?.category || "Scenic escape";
        const title = p?.name || p?.title || "Handpicked experience";

        return (
        <Link
            to={`/packages/${p?._id}`}
            className="block focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-2xl"
        >
            <article className="mt-5 card-appear relative rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl">
            {/* Image (taller) */}
            <div className="relative h-60 overflow-hidden">
                {cover ? (
                <img
                    src={cover}
                    alt={title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                />
                ) : (
                <div className="h-full w-full grid place-items-center bg-gray-100 text-gray-500">
                    No image
                </div>
                )}

                {/* Price pill */}
                {price && (
                <span className="absolute top-3 right-3 rounded-full bg-white/95 backdrop-blur border border-gray-200 px-3 py-1 text-sm font-semibold text-gray-900 shadow">
                    {price}
                </span>
                )}
            </div>

            {/* Bottom content */}
            <div className="bg-white p-4">
                <p className="text-sm text-gray-500">{subtitle}</p>
                <h3 className="mt-1 text-lg font-semibold text-gray-900">
                {title}
                </h3>
            </div>
            </article>
        </Link>
        );
    };

    // Example: Array of travel image URLs (replace with your own or fetch from API)
    const travelImages = [
        "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=800&q=80",
    ];

    // Live filtered items
    const filteredItems = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return items;
        const fields = (p) => [
        p?.name,
        p?.title,
        p?.subtitle,
        p?.category,
        p?.city,
        p?.location,
        ];
        return items.filter((p) =>
        fields(p).some((v) => String(v || "").toLowerCase().includes(q))
        );
    }, [items, query]);

    return (
        <div className="min-h-[100vh] bg-white">
        <header className="relative">
            <div className="h-52 md:h-64 w-full bg-center bg-cover flex">
            {travelImages.map((img, idx) => (
                <div
                key={idx}
                className="flex-1 h-full"
                style={{
                    backgroundImage: `url("${img}")`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }}
                />
            ))}
            </div>
            <div className="absolute inset-0 bg-black/30" />
            <div className="absolute inset-0 flex items-center">
            <div className="max-w-7xl mx-auto px-6 md:px-10">
                <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow bg-black/30 px-3 py-1 rounded border border-white/30">
                Explore Packages
                </h1>
            </div>
            </div>
        </header>

        <div className="max-w-6xl mx-auto p-4 font-sans">
            <div className="mt-10">
            {/* Title + Search + Customize */}
            <div
                className="
                grid gap-4 items-center
                grid-cols-1 md:[grid-template-columns:auto_1fr_auto]
                "
            >
                {/* Left: Title */}
                <h2 className="text-2xl font-semibold text-gray-900">
                Available Travel Packages
                </h2>

                {/* Center: Search */}
                <form
                role="search"
                onSubmit={(e) => e.preventDefault()}
                className="w-full flex justify-center"
                aria-label="Search packages"
                >
                <div className="relative w-full max-w-md">
                    {/* icon (inline svg; replace with an <img> if you want to use your asset) */}
                    <svg
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    >
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>

                    <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search Packages"
                    className="h-11 w-full rounded-full border border-gray-300 bg-white/80
                                pl-11 pr-28 text-gray-900 shadow-sm placeholder:text-gray-400
                                focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />

                    <button
                    type="button"
                    onClick={() => {}}
                    className="absolute right-1 top-1 bottom-1 rounded-full bg-blue-600
                                px-4 text-white text-sm font-medium shadow hover:bg-blue-700
                                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                    Search
                    </button>
                </div>
                </form>

                {/* Right: Customize button */}
                <div className="flex md:justify-end">
                <Link
                    to="/customize-package"
                    className="bg-blue-600 border border-gray-300 rounded-full px-4 py-2
                            text-sm font-medium text-white shadow hover:bg-blue-700
                            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Customize Your Own Package
                </Link>
                </div>
            </div>

            <p className="mt-12 text-gray-600">
                Discover our curated selection of travel packages designed to offer
                unforgettable experiences around the world. Whether you're seeking
                adventure, relaxation, or cultural immersion, we have something for
                every traveler.
            </p>
            </div>

            {/* Package Cards Grid */}
            <div className="mt-6 grid [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))] gap-7">
            {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div
                    key={i}
                    className="h-80 rounded-2xl bg-gray-200/70 animate-pulse"
                    />
                ))
                : filteredItems.map((p, i) => (
                    <Card key={p?._id ?? p?.id ?? `idx-${i}`} p={p} />
                ))}
            </div>
        </div>

        <style>{`
            @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(8px); }
            to   { opacity: 1; transform: translateY(0); }
            }
            .card-appear {
            animation: fadeInUp .45s ease-out both;
            }
        `}</style>
        </div>
    );
}
