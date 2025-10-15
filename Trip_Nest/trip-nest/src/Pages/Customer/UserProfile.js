// src/Pages/Customer/UserProfile.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../features/auth/AuthContext";
import { api } from "../../features/auth/Api";
import { User, Mail, IdCard, Shield, CalendarClock, RefreshCw, LogOut } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

function Pill({ children }) {
    return (
        <span className="px-2.5 py-0.5 rounded-full text-xs bg-sky-50 text-sky-700 border border-sky-200">
        {children}
        </span>
    );
    }

    const fmtDate = (d) => (d ? new Date(d).toLocaleString() : "—");
    const fmtDay = (d) =>
    d
        ? new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
        : "—";
    const fmtMoney = (n) =>
    Number(n || 0).toLocaleString(undefined, { style: "currency", currency: "USD" });

    /* ---- URL helpers so relative image paths like "/uploads/a.jpg" render correctly ---- */
    const useFileBase = () => {
    const apiBase = useMemo(
        () => (process.env.REACT_APP_API_URL || "http://localhost:4000/api").replace(/\/+$/, ""),
        []
    );
    return apiBase.replace(/\/api$/, ""); // http://host:port
    };
    const joinUrl = (base, path) => {
    const b = String(base || "").replace(/\/+$/, "");
    const p = String(path || "").replace(/^\/+/, "");
    return `${b}/${p}`;
    };
    const imageSrcFrom = (fileBase, u) => {
    if (!u) return "";
    if (/^https?:\/\//i.test(u)) return u;
    return joinUrl(fileBase, u);
    };

    export default function UserProfile() {
    const { user, loading, logout } = useAuth();
    const [me, setMe] = useState(user);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    // booking history state
    const [bookings, setBookings] = useState([]);
    const [bLoading, setBLoading] = useState(true);
    const [bError, setBError] = useState("");

    const fileBase = useFileBase();

    // keep in sync with context
    useEffect(() => setMe(user), [user]);

    const refresh = async () => {
        try {
        setRefreshing(true);
        setError("");
        const { data } = await api.get("/auth/me"); // httpOnly cookie read (api has withCredentials)
        setMe(data.user);
        } catch (err) {
        setError(err?.response?.data?.message || "Failed to load profile");
        } finally {
        setRefreshing(false);
        }
    };

    const doLogout = async () => {
        await logout();
        navigate("/login");
    };

    // --- Fetch ONLY this user's bookings (no fallbacks to wide endpoints) ---
    useEffect(() => {
        const fetchMine = async () => {
        // wait for auth to settle
        if (loading) {
            setBLoading(true);
            return;
        }
        // no user -> empty state
        if (!me?._id && !me?.id) {
            setBookings([]);
            setBError("");
            setBLoading(false);
            return;
        }

        try {
            setBLoading(true);
            setBError("");
            const { data } = await api.get("/bookings/mine"); // <- the safe, scoped endpoint
            const arr = Array.isArray(data)
            ? data
            : Array.isArray(data?.items)
            ? data.items
            : Array.isArray(data?.results)
            ? data.results
            : Array.isArray(data?.bookings)
            ? data.bookings
            : [];
            setBookings(arr);
        } catch (err) {
            console.error("Bookings fetch failed:", err);
            setBookings([]);
            setBError(err?.response?.data?.error || err?.message || "Failed to load booking history");
        } finally {
            setBLoading(false);
        }
        };

        fetchMine();
    }, [loading, me?._id, me?.id]);

    // derive a safe status string & styling
    const getStatusMeta = (b) => {
        const raw = b?.status || b?.paymentStatus || b?.payment?.status || (b?.paid ? "approved" : "pending");
        const s = String(raw || "").toLowerCase();

        if (["approved", "paid", "success, confirmed"].some((x) => s.includes(x))) {
        return { label: "Approved", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
        }
        if (["pending", "processing"].some((x) => s.includes(x))) {
        return { label: "Pending", cls: "bg-amber-50 text-amber-700 border-amber-200" };
        }
        if (["failed", "declined", "canceled", "cancelled"].some((x) => s.includes(x))) {
        return { label: "Failed", cls: "bg-rose-50 text-rose-700 border-rose-200" };
        }
        return { label: raw || "Unknown", cls: "bg-gray-50 text-gray-700 border-gray-200" };
    };

    // pick a package object & image robustly
    const getPkg = (b) => b?.package || b?.pkg || b?.packageSnapshot || {};
    const getPkgImage = (pkg) => {
        const images =
        (Array.isArray(pkg?.imageUrls) && pkg.imageUrls) ||
        (Array.isArray(pkg?.images) && pkg.images) ||
        (Array.isArray(pkg?.photos) && pkg.photos) ||
        (pkg?.image ? [pkg.image] : []);
        return images[0]
        ? imageSrcFrom(fileBase, images[0])
        : "https://via.placeholder.com/160x120?text=No+Image";
    };

    if (loading && !me) return <div className="p-6">Loading…</div>;
    if (!me) return <div className="p-6">No user loaded.</div>;

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8">
        {/* Profile header */}
        <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">My Profile</h1>
            <div className="flex gap-2">
            <button onClick={refresh} className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 hover:bg-gray-50">
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
            </button>
            <button onClick={doLogout} className="inline-flex items-center gap-2 rounded-md bg-red-500 text-white px-3 py-1.5 hover:bg-red-600">
                <LogOut className="h-4 w-4" />
                Logout
            </button>
            </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {/* Profile card */}
        <div className="rounded-xl border bg-white p-5 space-y-4">
            <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-sky-100 text-sky-700 grid place-items-center">
                <User className="h-6 w-6" />
            </div>
            <div>
                <div className="text-lg font-semibold">{me.name || "—"}</div>
                <div className="text-gray-500 text-sm">@{me.username || "—"}</div>
            </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{me.email || "—"}</span>
            </div>

            <div className="flex items-center gap-2">
                <IdCard className="h-4 w-4 text-gray-500" />
                <span className="text-sm break-all">{me._id || me.id || "—"}</span>
            </div>

            <div className="flex items-center gap-2 sm:col-span-2">
                <Shield className="h-4 w-4 text-gray-500" />
                <div className="flex flex-wrap gap-2">
                {(me.roles || []).map((r) => (
                    <Pill key={r}>{r}</Pill>
                ))}
                </div>
            </div>

            <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-gray-500" />
                <span className="text-sm">Created: {fmtDate(me.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-gray-500" />
                <span className="text-sm">Updated: {fmtDate(me.updatedAt)}</span>
            </div>
            </div>
        </div>

        {/* Booking history */}
        <section>
            <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Booking history</h2>
            {bLoading ? <span className="text-sm text-gray-500">Loading…</span> : null}
            </div>

            {bError && (
            <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{bError}</div>
            )}

            {!loading && !(me?._id || me?.id) ? (
            <div className="rounded-xl border bg-white p-5 text-sm text-gray-600">Please log in to see your bookings.</div>
            ) : !bLoading && bookings.length === 0 ? (
            <div className="rounded-xl border bg-white p-5 text-sm text-gray-600">No bookings yet.</div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bookings.map((b) => {
                const pkg = getPkg(b);
                const status = getStatusMeta(b);
                const img = getPkgImage(pkg);
                const nights = (() => {
                    const s = pkg?.startDate ? new Date(pkg.startDate) : null;
                    const e = pkg?.endDate ? new Date(pkg.endDate) : null;
                    if (!s || !e) return 0;
                    return Math.max(0, Math.round((e - s) / (1000 * 60 * 60 * 24)));
                })();

                return (
                    <article key={b._id} className="rounded-xl border bg-white p-4 hover:shadow-sm transition">
                    <div className="flex gap-3">
                        <img src={img} alt={pkg?.name || "Package"} className="h-20 w-28 object-cover rounded" loading="lazy" />
                        <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                            <h3 className="font-medium truncate">{pkg?.name || "Package"}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs border ${status.cls}`}>{status.label}</span>
                        </div>
                        <div className="mt-1 text-xs text-gray-600">
                            Check-in <span className="font-medium">{fmtDay(pkg?.startDate)}</span> • Check-out{" "}
                            <span className="font-medium">{fmtDay(pkg?.endDate)}</span>
                        </div>
                        <div className="mt-0.5 text-xs text-gray-600">
                            {nights || "—"} {nights === 1 ? "night" : "nights"} • {b?.pricing?.qty || 1}{" "}
                            {(b?.pricing?.qty || 1) === 1 ? "guest" : "guests"}
                        </div>
                        <div className="mt-1 text-sm font-semibold">{fmtMoney(b?.pricing?.total ?? 0)}</div>
                        </div>
                    </div>

                    <div className="mt-3 flex items-center justify-end gap-2">
                        <Link to={`/checkout/success?id=${b._id}`}>
                        <button className="rounded-full border border-gray-300 px-3 py-1.5 text-xs hover:bg-gray-50">View details</button>
                        </Link>
                        {String(status.label).toLowerCase() === "pending" ? (
                        <Link to={`/checkout/confirm?packageId=${b.packageId || pkg?._id || ""}&qty=${b?.pricing?.qty || 1}`}>
                            <button className="rounded-full bg-blue-600 text-white px-3 py-1.5 text-xs hover:bg-blue-700">
                            Complete payment
                            </button>
                        </Link>
                        ) : null}
                    </div>
                    </article>
                );
                })}
            </div>
            )}
        </section>
        </div>
    );
}
