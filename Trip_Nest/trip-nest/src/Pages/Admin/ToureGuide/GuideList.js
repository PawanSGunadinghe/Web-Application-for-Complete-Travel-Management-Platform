// src/Pages/Admin/ToureGuide/GuideList.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function GuideList() {
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [q, setQ] = useState("");
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();

    // Base API URL (e.g., http://localhost:4000/api)
    const baseUrl = useMemo(
        () => `${process.env.REACT_APP_API_URL || "http://localhost:4000/api"}`,
        []
    );
    // Origin for absolute image URLs (e.g., http://localhost:4000)
    const API_ORIGIN =
        process.env.REACT_APP_API_ORIGIN || new URL(baseUrl).origin;

    // --- helpers ---
    function toAbsUrl(u) {
        if (!u) return "";
        if (/^https?:/i.test(u)) return u; // already absolute
        return `${API_ORIGIN}${u.startsWith("/") ? "" : "/"}${u}`;
    }
    function getInitials(name) {
        if (!name) return "?";
        const parts = String(name).trim().split(/\s+/).slice(0, 2);
        return parts.map((p) => p[0]?.toUpperCase() || "").join("") || "?";
    }
    function formatPhone(p) {
        const s = String(p || "");
        if (s.length === 10) return `${s.slice(0, 3)}-${s.slice(3, 6)}-${s.slice(6)}`;
        return s;
    }

    // Fetch list - REMOVED status filter to show all guides
    useEffect(() => {
        let live = true;
        setLoading(true);
        const url = new URL(`${baseUrl}/guide-applications`);
        url.searchParams.set("q", q.trim());
        url.searchParams.set("page", String(page));
        url.searchParams.set("limit", "12");
        // Removed status parameter to get ALL applications

        fetch(url, { credentials: "include" })
        .then(async (r) => {
            const data = await r.json();
            if (!r.ok) throw new Error(data?.error || "Failed to load");
            return data;
        })
        .then((data) => {
            if (!live) return;
            const arr = Array.isArray(data)
            ? data
            : Array.isArray(data.items)
            ? data.items
            : [];
            setItems(arr);
            setTotal(data.total ?? arr.length);
            setPages(data.pages ?? 1);
        })
        .catch((e) => {
            console.error(e);
            if (live) {
            setItems([]);
            setTotal(0);
            setPages(1);
            }
        })
        .finally(() => live && setLoading(false));

        return () => {
        live = false;
        };
    }, [baseUrl, q, page]);

    // Reset to page 1 when search changes
    useEffect(() => {
        const id = setTimeout(() => setPage(1), 350);
        return () => clearTimeout(id);
    }, [q]);

    const Card = ({ g }) => {
        const initials = getInitials(g.fullName);
        const src = toAbsUrl(g.profilePhotoUrl);

        // Status badge with different colors
        const getStatusBadge = (status) => {
            switch (status) {
                case 'approved':
                    return (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-100 text-green-800 border border-green-200">
                            Approved
                        </span>
                    );
                case 'rejected':
                    return (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
                            Rejected
                        </span>
                    );
                case 'pending':
                default:
                    return (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
                            Pending
                        </span>
                    );
            }
        };

        return (
        <article className="relative rounded-xl border border-gray-200 bg-white shadow-sm p-4 flex gap-4">
            {/* Avatar */}
            {src ? (
            <img
                src={src}
                alt={g.fullName}
                className="h-16 w-16 rounded-lg object-cover border"
                onError={(e) => {
                // If image fails, clear it so the fallback block renders
                e.currentTarget.src = "";
                e.currentTarget.style.display = "none";
                // we keep the container space; fallback below will still show initials
                }}
            />
            ) : null}
            {!src && (
            <div className="h-16 w-16 rounded-lg bg-gray-200 grid place-items-center text-gray-700 font-semibold">
                {initials}
            </div>
            )}

            {/* Main */}
            <div className="flex-1 min-w-0 pr-24">
            <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold truncate">{g.fullName || "—"}</h3>
                {getStatusBadge(g.status)}
            </div>
            <div className="mt-1 text-sm text-gray-600 truncate">{g.email || "—"}</div>
            <div className="text-sm text-gray-600">{formatPhone(g.phone) || "—"}</div>
            <div className="mt-1 flex items-center gap-2">
                <span className="text-[11px] px-2 py-0.5 rounded-full border border-gray-300 capitalize">
                {g.availabilityType || "—"}
                </span>
                {g.experienceYears && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full border border-blue-300 bg-blue-50">
                        {g.experienceYears} yrs exp
                    </span>
                )}
            </div>
            {g.languages && g.languages.length > 0 && (
                <div className="mt-1 text-xs text-gray-500">
                    Languages: {g.languages.join(", ")}
                </div>
            )}
            </div>

            {/* Actions */}
            <div className="absolute top-3 right-3 flex items-center gap-2">
            <button
                type="button"
                onClick={() => navigate(`/admin/guide-application/${g._id}`)}
                className="rounded-full border border-gray-900 bg-white px-4 py-1.5 text-sm font-medium hover:bg-gray-900 hover:text-white transition"
            >
                View
            </button>
            </div>
        </article>
        );
    };

    return (
        <div className="min-h-screen bg-white text-gray-900">
        <div className="mx-auto max-w-6xl px-6 md:px-10 py-8">
            {/* Top controls */}
            <div className="flex flex-wrap items-center gap-4 md:gap-6 justify-center md:justify-between">
            {/* Search */}
            <div className="flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 w-full sm:w-auto sm:min-w-[280px]">
                <span className="inline-block text-gray-500">🔎</span>
                <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name, language, license"
                className="w-full bg-transparent focus:outline-none"
                />
            </div>
            </div>

            {/* Grid */}
            <h3 className="mt-8 text-sm font-semibold tracking-wide">All Tour Guides</h3>
            {loading ? (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="h-28 rounded-xl bg-gray-100 animate-pulse" />
                ))}
            </div>
            ) : items.length === 0 ? (
            <p className="mt-4 text-gray-500">No guides found.</p>
            ) : (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((g) => (
                <Card key={g._id} g={g} />
                ))}
            </div>
            )}

            {/* Pagination */}
            {pages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
                <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className={`rounded-full border px-4 py-2 text-sm ${
                    page === 1 ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-900 hover:text-white"
                }`}
                >
                Prev
                </button>
                <span className="text-sm text-gray-600">
                Page {page} {total ? `of ${pages}` : ""}
                </span>
                <button
                type="button"
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page === pages}
                className={`rounded-full border px-4 py-2 text-sm ${
                    page === pages ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-900 hover:text-white"
                }`}
                >
                Next
                </button>
            </div>
            )}
        </div>
        </div>
  );
}