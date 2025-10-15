import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import IMG1 from "../../../Assets/tadd.jpg";
import BookingHub from "./BookingHub";

export default function CustomBookDetails() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    const API_BASE = useMemo(
        () => `${process.env.REACT_APP_API_URL || "http://localhost:4000/api"}`,
        []
    );

    useEffect(() => {
        let live = true;
        (async () => {
        setLoading(true);
        setErr("");
        try {
            const r = await fetch(`${API_BASE}/custom-packages`, { credentials: "include" });
            const data = await r.json();
            if (!r.ok) throw new Error(data?.error || "Failed to load");
            const arr = Array.isArray(data) ? data : data.items || [];
            if (live) setItems(arr);
        } catch (e) {
            if (live) {
            setItems([]);
            setErr(e.message || "Something went wrong");
            }
        } finally {
            if (live) setLoading(false);
        }
        })();
        return () => { live = false; };
    }, [API_BASE]);

    return (
        <div className="min-h-screen bg-[#F4F8FB]">
        {/* Hero */}
        <header className="relative">
            <div
            className="h-44 md:h-56 w-full bg-center bg-cover"
            style={{
                backgroundImage:
                `url(${IMG1})`,
            }}
            />
            <div className="absolute inset-0 bg-black/30" />
            <div className="absolute inset-0 flex items-center *:justify-center">
            <div className="max-w-7xl mx-auto w-full px-6 md:px-10 flex items-center justify-between text-center">
                <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow bg-black-10 text-center">
                Packages Requests
                </h1>
            </div>
            </div>
        </header>

        {/* Body */}
        <main className="max-w-7xl mx-auto px-6 md:px-10 py-10">
            {err && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
                {err}
            </div>
            )}

            {/* Grid */}
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <li key={i} className="relative rounded-xl bg-white border border-slate-200 p-5 animate-pulse">
                    <div className="absolute left-0 top-0 h-full w-1.5 rounded-l-xl bg-blue-200" />
                    <div className="h-5 w-2/3 rounded bg-slate-200" />
                    <div className="mt-3 h-4 w-1/2 rounded bg-slate-200" />
                    <div className="mt-6 h-9 w-full rounded-full bg-slate-200" />
                    </li>
                ))
                : items.map((it) => (
                    <li key={it._id}>
                    <Card req={it} />
                    </li>
                ))}
            </ul>

            {!loading && !err && items.length === 0 && (
            <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
                <p className="text-lg font-semibold text-slate-800">No requests yet</p>
                <p className="mt-1 text-sm text-slate-600">Submissions will appear here.</p>
            </div>
            )}
            <section className="mt-12">
                <BookingHub />
            </section>
        </main>
        </div>
    );
    }

    function Card({ req }) {
    const {
        _id,
        fullName,
        country,
        travelers,
        preferredDates,
        createdAt,
    } = req || {};

    const dateRange = formatDateRange(preferredDates?.start, preferredDates?.end);

    return (
        <div>
        <Link
        to={`${_id}`}
        className="group relative block rounded-xl bg-white border border-slate-200 shadow-sm transition hover:shadow-md hover:-translate-y-0.5"
        >
        {/* Blue accent */}
        <div className="absolute left-0 top-0 h-full w-1.5 rounded-l-xl bg-gradient-to-b from-blue-600 to-blue-400" />

        <div className="pl-5 pr-5 pt-5 pb-4">
            <h3 className="text-[17px] font-semibold tracking-tight text-slate-800 line-clamp-1">
            {fullName || "—"}
            </h3>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <Pill>{country || "Unknown country"}</Pill>
            <Pill>{travelers ? `${travelers} traveler${travelers > 1 ? "s" : ""}` : "—"}</Pill>
            </div>

            <div className="mt-3 text-sm text-slate-700">
            {dateRange || "Dates pending"}
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
            <span>Created {formatDate(createdAt) || "—"}</span>
            <span className="inline-flex items-center gap-1 text-blue-700 group-hover:underline">
                View details →
            </span>
            </div>
        </div>
        </Link>
        </div>
    );
}

    function Pill({ children }) {
    return (
        <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-blue-700 border border-blue-100">
        {children}
        </span>
    );
    }

    /* utils */
    function formatDate(d) {
    if (!d) return "";
    const dt = new Date(d);
    if (isNaN(dt)) return "";
    return dt.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
    }
    function formatDateRange(a, b) {
    if (!a && !b) return "";
    const s = a ? formatDate(a) : "—";
    const e = b ? formatDate(b) : "—";
    return `${s} → ${e}`;
}
