import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

/**
 * JobsGallery (User-facing)
 *
 * - No create/edit actions
 * - No search bar
 * - Hero header with image + title
 * - Optional position filter remains (say the word if you want it removed)
 *
 * Backend assumptions:
 * - GET /api/guide-jobs?q=&page=&limit= -> { items, total, page, pages } OR an array (legacy)
 *   Items may be lightweight (e.g., missing description), so we hydrate each item with:
 * - GET /api/guide-jobs/:id -> full job (includes description, deadline, etc.)
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

            setTotal(Array.isArray(data) ? normList.length : Number(data?.total || 0));
            setPages(Array.isArray(data) ? 1 : Number(data?.pages || 1));

            // Hydrate details where needed (description, deadline, etc.)
            const needDetail = normList.filter(
            (j) => !j.description || !j.deadline || !j.requirements || !j.contact
            );

            let hydrated = normList;
            if (needDetail.length > 0) {
            const details = await Promise.all(
                needDetail.map(async (j) => {
                try {
                    const r = await fetch(`${API_BASE}/guide-jobs/${j.id || j._id}`, {
                    credentials: "include",
                    });
                    if (!r.ok) throw new Error("detail fetch failed");
                    const full = await r.json();
                    return normalizeJob({ ...j, ...full });
                } catch {
                    return j; // keep lightweight if detail fails
                }
                })
            );
            const detailById = new Map(details.map((d) => [d.id || d._id, d]));
            hydrated = normList.map((j) => detailById.get(j.id || j._id) || j);
            }

            if (!alive) return;
            setJobs(hydrated);
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
        <div className="min-h-screen bg-white">
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

        {/* Controls row (only position filter) */}
        <div className="border-b bg-gray-50/60">
            <div className="max-w-7xl mx-auto px-6 md:px-10 py-4 flex items-center gap-3">
            <div className="ml-0">
                <label htmlFor="role" className="sr-only">
                Filter by position
                </label>
                <select
                id="role"
                value={role}
                onChange={(e) => {
                    setPage(1);
                    setRole(e.target.value);
                }}
                className="rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
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

    /* ---------- Card ---------- */
    function JobCard({ job }) {
    const {
        id,
        _id,
        title,
        position,
        description,
        deadline,
        salary,
        duration,
        requirements,
        createdAt,
    } = job;

    const reqBadges = String(requirements || "")
        .split(/[,|\n]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 6);

    return (
        <article className="group relative h-full rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">
        <div className="flex items-start gap-3">
            <span className="inline-flex items-center rounded-full bg-gray-900/90 px-3 py-1 text-xs font-semibold text-white">
            {position || "—"}
            </span>
            <span className="ml-auto text-xs text-gray-500">{formatDate(createdAt) || "—"}</span>
        </div>

        <h3 className="mt-3 line-clamp-2 text-lg font-semibold tracking-tight">
            {title || "Untitled role"}
        </h3>

        <p className="mt-2 line-clamp-3 text-sm text-gray-600">
            {description || "No description provided."}
        </p>

        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-gray-50 p-3">
            <dt className="text-gray-500">Salary</dt>
            <dd className="font-medium">{formatSalary(salary)}</dd>
            </div>
            <div className="rounded-xl bg-gray-50 p-3">
            <dt className="text-gray-500">Duration</dt>
            <dd className="font-medium">{duration || "—"}</dd>
            </div>
            <div className="rounded-xl bg-gray-50 p-3">
            <dt className="text-gray-500">Deadline</dt>
            <dd className="font-medium">{formatDate(deadline) || "—"}</dd>
            </div>
            <div className="rounded-xl bg-gray-50 p-3">
            <dt className="text-gray-500">Contact</dt>
            <dd className="font-medium">{maskPhone(job.contact)}</dd>
            </div>
        </dl>

        {reqBadges.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
            {reqBadges.map((r, i) => (
                <span
                key={i}
                className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-700"
                >
                {r}
                </span>
            ))}
            </div>
        )}

        <div className="mt-5 flex items-center gap-3">
            <Link
            to={`/admin/guide-job/${id || _id}`}
            className="inline-flex items-center justify-center rounded-full border border-gray-900 px-4 py-2 text-sm font-medium text-gray-900 transition group-hover:bg-gray-900 group-hover:text-white"
            >
            View
            </Link>
            <Link
            to={`/login`}
            className="inline-flex items-center justify-center rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black/90"
            >
            Apply
            </Link>
        </div>

        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-black/5 transition group-hover:ring-black/10" />
        </article>
    );
    }

    /* ---------- Skeletons ---------- */
    function CardsSkeleton() {
    return (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-pulse">
        {Array.from({ length: 8 }).map((_, i) => (
            <li key={i} className="h-64 rounded-2xl border border-gray-200 bg-gray-50" />
        ))}
        </ul>
    );
    }

    function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
        <p className="text-lg font-semibold">No jobs yet</p>
        <p className="max-w-md text-sm text-gray-600">
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

    function formatDate(d) {
    if (!d) return "";
    try {
        const dt = new Date(d);
        if (Number.isNaN(dt.getTime())) return String(d);
        return dt.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        });
    } catch {
        return String(d);
    }
    }

    function maskPhone(p) {
    const digits = String(p || "").replace(/\D/g, "");
    if (digits.length === 10) return digits.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
    if (digits.length > 4) return `${digits.slice(0, -4).replace(/\d/g, "•")}${digits.slice(-4)}`;
    return digits || "—";
    }

    /** Normalize any backend shape to what the UI expects */
    function normalizeJob(it = {}) {
    const id = it.id ?? it._id;
    return {
        id,
        _id: it._id,
        title: it.title ?? it.jobTitle ?? it.name ?? "",
        position: it.position ?? it.role ?? it.jobRole ?? "",
        description: it.description ?? it.details ?? it.summary ?? "",
        contact: it.contact ?? it.phone ?? it.email ?? "",
        deadline: it.deadline ?? it.closingDate ?? null,
        salary: it.salary ?? it.compensation ?? null,
        duration: it.duration ?? it.contractLength ?? "",
        requirements: it.requirements ?? it.skills ?? it.qualifications ?? "",
        createdAt: it.createdAt ?? it.created_at ?? it.postedAt ?? null,
        ...it,
    };
    }

    // (Kept for completeness; not used here, but handy if you reinstate search later)
    function useDebounce(value, delayMs = 300) {
    const [v, setV] = useState(value);
    const tRef = useRef();
    useEffect(() => {
        clearTimeout(tRef.current);
        tRef.current = setTimeout(() => setV(value), delayMs);
        return () => clearTimeout(tRef.current);
    }, [value, delayMs]);
    return v;
}
