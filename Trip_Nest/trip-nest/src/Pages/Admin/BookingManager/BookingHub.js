//combination of customize package and booking package(frist view of admin side)
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
// import CustomeBookDetails from "./CustomeBookDetails";

const money = (n) =>
    Number(n || 0).toLocaleString(undefined, { style: "currency", currency: "USD" });

    const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";

    const fmtRange = (a, b) => `${fmtDate(a)} – ${fmtDate(b)}`;

    /** -----------------------------------------------------------
     * Page
     * ---------------------------------------------------------- */
    export default function BookingHub() {
    const apiBase = useMemo(
        () => (process.env.REACT_APP_API_URL || "http://localhost:4000/api").replace(/\/+$/, ""),
        []
    );

    // Top section: Custom bookings (requests)
    const [customs, setCustoms] = useState([]);
    const [customLoading, setCustomLoading] = useState(true);
    const [customErr, setCustomErr] = useState("");

    // Bottom section: Package bookings
    const [packages, setPackages] = useState([]);
    const [pkgLoading, setPkgLoading] = useState(true);
    const [pkgErr, setPkgErr] = useState("");

    // --- fetch custom bookings (uses /custom-packages) ---
   
    useEffect(() => {
        let live = true;
        (async () => {
        setCustomLoading(true);
        setCustomErr("");
      
        try {
            // same endpoint your CustomeBookDetails page uses
            const r = await fetch(`${apiBase}/custom-packages`, { credentials: "include" }); // :contentReference[oaicite:2]{index=2}
            const data = await r.json();
            if (!r.ok) throw new Error(data?.error || "Failed to load custom bookings");
            const arr = Array.isArray(data) ? data : data.items || [];
            if (live) setCustoms(arr);
        } catch (e) {
            if (live) {
            setCustoms([]);
            setCustomErr(e.message || "Something went wrong");
            }
        } finally {
            if (live) setCustomLoading(false);
        }
        })();
        return () => { live = false; };
    }, [apiBase]);

    // --- fetch package bookings (uses /bookings?all=1) ---
    useEffect(() => {
        let live = true;
        (async () => {
        setPkgLoading(true);
        setPkgErr("");
      
        try {
            // same pattern your AdminBookingsPage uses (switch to /bookings/mine if needed)
            const r = await fetch(`${apiBase}/bookings?all=1`, { credentials: "include" }); // :contentReference[oaicite:3]{index=3}
            const data = await r.json();
            if (!r.ok) throw new Error(data?.error || "Failed to load package bookings");
            if (live) setPackages(Array.isArray(data) ? data : []);
        } catch (e) {
            if (live) {
            setPackages([]);
            setPkgErr(e.message || "Something went wrong");
            }
        } finally {
            if (live) setPkgLoading(false);
        }
        })();
        return () => { live = false; };
    }, [apiBase]);

    return (
        <div className="min-h-screen bg-white text-gray-900">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-8">


            {/* Spacer */}
            <div className="h-10" />

            {/* Package Bookings (stacked rows) */}
            <h2 className="text-2xl font-extrabold tracking-tight mb-4">Package Bookings</h2>
            {pkgErr && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">{pkgErr}</div>}

            <div className="space-y-4">
            {pkgLoading
                ? [0,1].map((i) => <PackageSkeleton key={i} />)
                : packages.length === 0
                ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
                    <p className="text-lg font-semibold text-slate-800">No package bookings</p>
                    <p className="mt-1 text-sm text-slate-600">They’ll appear after customers book packages.</p>
                    </div>
                : packages.map((b) => <PackageRow key={b._id} b={b} />)
            }
            </div>

        </div>
        </div>
    );
    }

    
    function PackageSkeleton() {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 animate-pulse">
        <div className="h-4 w-40 bg-slate-200 rounded" />
        <div className="mt-3 h-4 w-2/3 bg-slate-200 rounded" />
        <div className="mt-5 h-16 w-full bg-slate-200 rounded" />
        </div>
    );
    }

    function CustomSkeleton() {
    return (
        <li className="relative rounded-xl bg-white border border-slate-200 p-5 animate-pulse">
        <div className="absolute left-0 top-0 h-full w-1.5 rounded-l-xl bg-blue-200" />
        <div className="h-5 w-2/3 rounded bg-slate-200" />
        <div className="mt-3 h-4 w-1/2 rounded bg-slate-200" />
        <div className="mt-6 h-9 w-full rounded-full bg-slate-200" />
        </li>
    );
    }

    /* ------------------- Package bookings (stacked rows) ------------------- */
    function PackageRow({ b }) {
    const pkg = b.package || b.packageSnapshot || {};
    const guests = b?.pricing?.qty || b.qty || 1;

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
            <div className="text-xs text-gray-500 font-mono">#{b._id}</div>
            <h3 className="mt-0.5 text-lg font-semibold">{pkg.name || "Package"}</h3>
            <div className="text-sm text-gray-600">{fmtRange(pkg.startDate, pkg.endDate)}</div>
            </div>

            <div className="flex items-center gap-3">
            <span className="inline-flex items-center rounded-full px-3 py-1 border text-xs bg-gray-50 text-gray-700 border-gray-200">
                {b.status || "created"}
            </span>
            <span className="inline-flex items-center rounded-full px-3 py-1 border text-xs bg-blue-50 text-blue-700 border-blue-100">
                {guests} guest{guests > 1 ? "s" : ""}
            </span>
            <span className="inline-flex items-center rounded-full px-3 py-1 border text-xs bg-emerald-50 text-emerald-700 border-emerald-100">
                {money(b?.pricing?.total)}
            </span>
                <Link
                to={`/admin/view-bookings/${b._id}`}
                className="inline-flex items-center rounded-full border px-3 py-1 text-xs hover:bg-gray-100"
                >
                    View
                </Link>

            </div>
        </div>
        </div>
    );
    }

    /* ------------------- tiny UI bits ------------------- */
    function Pill({ children }) {
    return (
        <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-blue-700 border border-blue-100 text-xs">
        {children}
        </span>
    );
}
