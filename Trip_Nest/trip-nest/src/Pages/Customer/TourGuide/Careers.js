import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

/**
 * JobsGallery (blue-accent cards)
 * Card shows ONLY: position, salary, and View/Apply buttons.
 */
export default function JobsGallery() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // user-visible controls
    const [role, setRole] = useState("all");
    const [page, setPage] = useState(1);
    const [limit] = useState(12);
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(1);

    const API_BASE = useMemo(
        () => `${process.env.REACT_APP_API_URL || "http://localhost:4000/api"}`,
        []
    );

    useEffect(() => {
        let alive = true;
        (async () => {
        setLoading(true);
        setError("");
        try {
            const params = new URLSearchParams({
            page: String(page),
            limit: String(limit),
            });
            const resp = await fetch(`${API_BASE}/guide-jobs?${params.toString()}`, {
            credentials: "include",
            });
            if (!resp.ok) throw new Error(`Failed to load jobs (${resp.status})`);
            const data = await resp.json();

            const list = Array.isArray(data) ? data : data?.items || [];
            const normList = list.map(normalizeJob);

            if (!alive) return;
            setJobs(normList);
            setTotal(Array.isArray(data) ? normList.length : Number(data?.total || 0));
            setPages(Array.isArray(data) ? 1 : Number(data?.pages || 1));
        } catch (e) {
            if (!alive) return;
            setError(e.message || "Could not load jobs");
            setJobs([]);
        } finally {
            if (alive) setLoading(false);
        }
        })();
        return () => {
        alive = false;
        };
    }, [API_BASE, page, limit]);

    const positions = useMemo(() => {
        const set = new Set();
        jobs.forEach((j) => j?.position && set.add(j.position));
        return ["all", ...Array.from(set)];
    }, [jobs]);

    const filtered = useMemo(() => {
        return jobs.filter((j) => role === "all" || j.position === role);
    }, [jobs, role]);

    return (
        <div className="min-h-screen bg-[#F4F8FB]">
        {/* Hero header with image */}
        <header className="relative">
            <div
            className="h-52 md:h-64 w-full bg-center bg-cover"
            style={{
                backgroundImage:
                'url("https://images.unsplash.com/photo-1521791055366-0d553872125f?q=80&w=1600&auto=format&fit=crop")',
            }}
            />
            <div className="absolute inset-0 bg-black/30" />
            <div className="absolute inset-0 flex items-center">
            <div className="max-w-7xl mx-auto px-6 md:px-10">
                <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow">
                Job Listings
                </h1>
            </div>
            </div>
        </header>

        {/* Filter */}
        <div className="border-b bg-white/60 backdrop-blur">
            <div className="max-w-7xl mx-auto px-6 md:px-10 py-4 flex items-center gap-3">
            <label htmlFor="role" className="text-sm text-gray-600">
                Position
            </label>
            <select
                id="role"
                value={role}
                onChange={(e) => {
                setPage(1);
                setRole(e.target.value);
                }}
                className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                aria-label="Filter by position"
            >
                {positions.map((p) => (
                <option key={p} value={p}>
                    {p === "all" ? "All positions" : p}
                </option>
                ))}
            </select>
            </div>
        </div>

        {/* Main */}
        <main className="max-w-7xl mx-auto px-6 md:px-10 py-10">
            {loading && <CardsSkeleton />}

            {!loading && error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
                {error}
            </div>
            )}

            {!loading && !error && filtered.length === 0 && <EmptyState />}

            {!loading && !error && filtered.length > 0 && (
            <>
                <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map((job) => (
                    <li key={job.id || job._id}>
                    <JobCard job={job} />
                    </li>
                ))}
                </ul>

                {/* Pagination */}
                {pages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                    <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="rounded-full border border-gray-300 px-4 py-2 text-sm disabled:opacity-40"
                    >
                    Prev
                    </button>
                    <span className="text-sm text-gray-600">
                    Page {page} of {pages} · {total} total
                    </span>
                    <button
                    onClick={() => setPage((p) => Math.min(pages, p + 1))}
                    disabled={page >= pages}
                    className="rounded-full border border-gray-300 px-4 py-2 text-sm disabled:opacity-40"
                    >
                    Next
                    </button>
                </div>
                )}
            </>
            )}
        </main>
        </div>
    );
    }

    /* ---------- Card (blue accent / minimal info) ---------- */
    function JobCard({ job }) {
    const { id, _id, position, salary } = job;

    return (
        <article className="group relative rounded-xl bg-white border border-slate-200 shadow-sm transition hover:shadow-md hover:-translate-y-0.5">
        {/* Blue vertical accent */}
        <div className="absolute left-0 top-0 h-full w-1.5 rounded-l-xl bg-gradient-to-b from-blue-600 to-blue-400" />

        <div className="pl-5 pr-5 pt-5 pb-4">
            {/* Position */}
            <h3 className="text-[17px] font-semibold tracking-tight text-slate-800">
            {position || "—"}
            </h3>

            {/* Salary */}
            <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                {formatSalary(salary)}
            </div>

            {/* Actions */}
            <div className="mt-6 grid grid-cols-2 gap-3">
            <Link
                to={`/view-guide-job/${id || _id}`}
                className="inline-flex items-center justify-center rounded-full border border-blue-600 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-600 hover:text-white transition"
            >
                View
            </Link>
            <Link
                to={`/guide-application-public`}
                className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
            >
                Apply
            </Link>
            </div>
        </div>
        </article>
    );
}

/* ---------- Icons ---------- */
function MoneyIcon() {
    return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
        <path
            d="M12 3v18M6.5 7H15a3 3 0 0 1 0 6H9a3 3 0 0 0 0 6h9.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        </svg>
    );
    }

    /* ---------- Skeletons (match new card) ---------- */
    function CardsSkeleton() {
    return (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-pulse">
        {Array.from({ length: 8 }).map((_, i) => (
            <li key={i} className="relative rounded-xl bg-white border border-slate-200 p-5">
            <div className="absolute left-0 top-0 h-full w-1.5 rounded-l-xl bg-blue-200" />
            <div className="h-5 w-2/3 rounded bg-slate-200" />
            <div className="mt-3 h-7 w-28 rounded-full bg-blue-100" />
            <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="h-9 rounded-full bg-slate-200" />
                <div className="h-9 rounded-full bg-slate-200" />
            </div>
            </li>
        ))}
        </ul>
    );
    }

    function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <p className="text-lg font-semibold text-slate-800">No jobs yet</p>
        <p className="max-w-md text-sm text-slate-600">
            New openings will appear here. Use the position filter to narrow down roles.
        </p>
        </div>
    );
    }

    /* ---------- utils ---------- */
    function formatSalary(s) {
    if (s == null || s === "") return "—";
    const n = Number(s);
    if (!Number.isFinite(n)) return String(s);
    return `LKR ${n.toLocaleString()}`;
    }

    /** Normalize any backend shape to what the UI expects */
    function normalizeJob(it = {}) {
    const id = it.id ?? it._id;
    return {
        id,
        _id: it._id,
        position: it.position ?? it.role ?? it.jobRole ?? "",
        salary: it.salary ?? it.compensation ?? null,

        // kept for routing / future use
        title: it.title ?? it.jobTitle ?? it.name ?? "",
        description: it.description ?? it.details ?? it.summary ?? "",
        contact: it.contact ?? it.phone ?? it.email ?? "",
        deadline: it.deadline ?? it.closingDate ?? null,
        duration: it.duration ?? it.contractLength ?? "",
        requirements: it.requirements ?? it.skills ?? it.qualifications ?? "",
        createdAt: it.createdAt ?? it.created_at ?? it.postedAt ?? null,
        location: it.location ?? it.city ?? it.place ?? "",
        company: it.company ?? it.employer ?? it.organization ?? it.org ?? "",
        ...it,
    };
}
