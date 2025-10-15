import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import LOGO from "../../../Assets/TripLOGO.png";

export default function GuideReport() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    const baseUrl = useMemo(
        () => `${process.env.REACT_APP_API_URL || "http://localhost:4000/api"}`,
        []
    );

    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        fetch(`${baseUrl}/guide-jobs/${id}`, { credentials: "include" })
        .then(async (r) => {
            if (!r.ok) throw new Error((await r.json()).error || "Request failed");
            return r.json();
        })
        .then((json) => {
            if (!isMounted) return;
            setJob(json);
            setError("");
        })
        .catch((e) => isMounted && setError(e.message || "Failed to load"))
        .finally(() => isMounted && setLoading(false));
        return () => {
        isMounted = false;
        };
    }, [baseUrl, id]);

    const fmtDate = (d) => {
        if (!d) return "";
        const dt = new Date(d);
        if (isNaN(dt)) return "";
        return new Intl.DateTimeFormat("en-LK", {
        year: "numeric",
        month: "long",
        day: "2-digit",
        }).format(dt);
    };

    const fmtMoney = (n) => {
        if (n === null || n === undefined || n === "") return "";
        try {
        return new Intl.NumberFormat("en-LK", {
            style: "currency",
            currency: "LKR",
            maximumFractionDigits: 0,
        }).format(Number(n));
        } catch {
        return String(n);
        }
    };

    async function handleDelete() {
        if (!id) return;
        const ok = window.confirm("Delete this job? This cannot be undone.");
        if (!ok) return;
        setBusy(true);
        try {
        const r = await fetch(`${baseUrl}/guide-jobs/${id}`, {
            method: "DELETE",
            credentials: "include",
        });
        if (!r.ok) {
            let msg = "Delete failed";
            try {
            const j = await r.json();
            msg = j.error || msg;
            } catch {}
            throw new Error(msg);
        }
        navigate("/admin/guide-admin", { replace: true });
        } catch (e) {
        alert(e.message || "Delete failed");
        } finally {
        setBusy(false);
        }
    }

    return (
        <div className="min-h-screen bg-white text-gray-900 font-body print:bg-white print:text-gray-900">
        <Header
            onDelete={handleDelete}
            deleting={busy}
            onPrint={() => window.print()}
            onBack={() => navigate(-1)}
            jobId={id}
        />

        <main className="px-6 md:px-10 print:px-10">
            <div className="mx-auto max-w-6xl pb-16 print:max-w-[700pt]">
            {loading && (
                <div className="animate-pulse space-y-6 py-10">
                <div className="h-8 w-64 bg-gray-200 rounded" />
                <div className="h-8 w-48 bg-gray-200 rounded" />
                <div className="h-40 w-full bg-gray-200 rounded" />
                </div>
            )}

            {error && (
                <div className="py-10">
                <p className="text-red-600 font-medium">{error}</p>
                <button onClick={() => navigate(-1)} className="text-blue-600 underline">
                    Go back
                </button>
                </div>
            )}

            {job && <Boxes job={job} fmtDate={fmtDate} fmtMoney={fmtMoney} />}
            </div>
        </main>
        </div>
    );
    }

    /**
     * Boxes UI
     * Uses real boxes with bg-[#F1F7FF], rounded corners and subtle border.
     * Labels use Gugi (class `font-title`); values use Poppins (class `font-body`).
     */
    function Boxes({ job, fmtDate, fmtMoney }) {
    const safe = (v) => (v && String(v).trim()) || "—";

    return (
        <div className="space-y-8">
        {/* Row: Job Title & Position (one box) */}
        <DoubleFieldBox
            leftLabel="Job Title:"
            leftValue={safe(job.title)}
            rightLabel="Job Position:"
            rightValue={safe(job.position)}
        />

        {/* Description */}
        <FieldArea label="Description:" value={safe(job.description)} />

        {/* Contact & Deadline */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FieldBox label="Contact Number:" value={safe(job.contact)} />
            <FieldBox label="Deadline:" value={safe(fmtDate(job.deadline))} />
        </div>

        {/* Salary & Duration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FieldBox label="Salary:" value={safe(fmtMoney(job.salary))} />
            <FieldBox label="Contract Duration:" value={safe(job.duration)} />
        </div>

        {/* Special Requirements */}
        <FieldArea label="Special Requirements:" value={safe(job.requirements)} />
        </div>
    );
    }

    function FieldBox({ label, value }) {
    return (
        <div className="rounded-xl bg-[#F1F7FF] border border-slate-200 px-5 py-4">
        <div className="font-title text-sm tracking-wide text-slate-700 mb-2">{label}</div>
        <div className="font-body text-xl md:text-2xl font-medium">{value}</div>
        </div>
    );
    }

    function FieldArea({ label, value }) {
    return (
        <div className="rounded-xl bg-[#F1F7FF] border border-slate-200 px-5 py-4">
        <div className="font-title text-sm tracking-wide text-slate-700 mb-2">{label}</div>
        <div className="font-body text-base md:text-lg leading-relaxed whitespace-pre-wrap">{value}</div>
        </div>
    );
    }

    function DoubleFieldBox({ leftLabel, leftValue, rightLabel, rightValue }) {
    return (
        <div className="rounded-xl bg-[#F1F7FF] border border-slate-200 px-5 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
            <div className="font-title text-sm tracking-wide text-slate-700 mb-2">{leftLabel}</div>
            <div className="font-body text-xl md:text-2xl font-medium">{leftValue}</div>
            </div>
            <div>
            <div className="font-title text-sm tracking-wide text-slate-700 mb-2">{rightLabel}</div>
            <div className="font-body text-xl md:text-2xl font-medium">{rightValue}</div>
            </div>
        </div>
        </div>
    );
    }

    function Header({ onPrint, onBack, onDelete, deleting, jobId }) {
    return (
        <header className="relative flex items-center justify-between px-6 md:px-10 py-6 print:px-10">
        <div className="flex items-center gap-3">
            <img src={LOGO} alt="TripNest Logo" className="h-12 print:h-12" />
            <span className="sr-only">TripNest</span>
        </div>

        <div className="flex items-center gap-3">
            <Link
            to={`/admin/guide-job/${jobId}/edit`}
            className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 print:hidden"
            >
            Edit
            </Link>
            <button
            onClick={onDelete}
            disabled={deleting}
            className="rounded-full border border-red-300 text-red-700 px-4 py-2 text-sm font-medium hover:bg-red-50 disabled:opacity-60 print:hidden"
            >
            {deleting ? "Deleting…" : "Delete"}
            </button>
            <button
            onClick={onPrint}
            className="rounded-full bg-black text-white px-5 py-2 text-sm font-medium hover:opacity-90 active:scale-95 transition print:hidden"
            >
            Report
            </button>
            <button
            onClick={onBack}
            className="text-xl font-semibold print:hidden"
            aria-label="Close"
            title="Close"
            >
            ×
            </button>
        </div>
        </header>
    );
}

/* ------------------- Add this to your global CSS (e.g., src/index.css) -------------------
@import url('https://fonts.googleapis.com/css2?family=Gugi&family=Poppins:wght@400;500;600&display=swap');

.font-title { font-family: 'Gugi', system-ui, sans-serif; }
.font-body { font-family: 'Poppins', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji','Segoe UI Emoji','Segoe UI Symbol', sans-serif; }
------------------------------------------------------------------------------------------- */
