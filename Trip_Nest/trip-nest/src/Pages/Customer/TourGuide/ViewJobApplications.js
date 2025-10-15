// src/Pages/Admin/Guide/GuideReport.js
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";


export default function GuideReport() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const baseUrl = useMemo(
        () => `${process.env.REACT_APP_API_URL || "http://localhost:4000/api"}`,
        []
    );

    useEffect(() => {
        let alive = true;
        setLoading(true);
        fetch(`${baseUrl}/guide-jobs/${id}`, { credentials: "include" })
        .then(async (r) => {
            const j = await r.json().catch(() => ({}));
            if (!r.ok) throw new Error(j?.error || "Request failed");
            return j;
        })
        .then((j) => {
            if (!alive) return;
            setJob(j);
            setError("");
        })
        .catch((e) => alive && setError(e.message || "Failed to load"))
        .finally(() => alive && setLoading(false));
        return () => {
        alive = false;
        };
    }, [baseUrl, id]);

    const fmtDate = (d) => {
        if (!d) return "—";
        const dt = new Date(d);
        if (isNaN(dt)) return "—";
        return new Intl.DateTimeFormat("en-LK", {
        year: "numeric",
        month: "long",
        day: "2-digit",
        }).format(dt);
    };

    const fmtMoney = (n) => {
        if (n === null || n === undefined || n === "") return "—";
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

    return (
        <div className="min-h-screen bg-white text-gray-900">
        {/* Top right: Report (print) */}
        <div className="max-w-6xl mx-auto px-6 md:px-10 pt-6 print:hidden">
            <div className="flex justify-end">
            <button
                onClick={() => window.print()}
                className="rounded-full bg-black text-white px-4 py-1.5 text-sm hover:opacity-90"
                title="Print report"
            >
                Report
            </button>
            </div>
        </div>

        <main className="max-w-6xl mx-auto px-6 md:px-10 py-6 print:max-w-[700pt] print:px-10 print:py-8">
            {/* Loading / Error */}
            {loading ? (
            <div className="space-y-6">
                <div className="h-16 bg-blue-50 rounded-2xl border border-blue-100 animate-pulse" />
                <div className="h-[420px] bg-blue-50 rounded-2xl border border-blue-100 animate-pulse" />
            </div>
            ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
                {error}
            </div>
            ) : !job ? null : (
            <>
                {/* Top strip: Job Title / Position */}
                <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Field label="Job Title:">{job.title || "—"}</Field>
                    <Field label="Job Position:">{job.position || "—"}</Field>
                </div>
                </section>

                {/* Big panel */}
                <section className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-6">
                {/* Description */}
                <div className="mb-8">
                    <Label>Description:</Label>
                    <div className="mt-3 ml-1 text-[15px] leading-7 whitespace-pre-wrap">
                    {job.description || "—"}
                    </div>
                </div>

            
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                    <div>
                    <Label>Contact Number:</Label>
                    <div className="mt-2 ml-1 font-medium">{job.contact || "—"}</div>
                    </div>
                    <div>
                    <Label>Deadline:</Label>
                    <div className="mt-2 ml-1 font-medium">{fmtDate(job.deadline)}</div>
                    </div>
                    <div>
                    <Label>Salary:</Label>
                    <div className="mt-2 ml-1 font-medium">{fmtMoney(job.salary)}</div>
                    </div>
                    <div>
                    <Label>Contract Duration:</Label>
                    <div className="mt-2 ml-1 font-medium">{job.duration || "—"}</div>
                    </div>
                </div>

                
                <div className="mt-10">
                    <Label>Special Requirements:</Label>
                    <div className="mt-3 ml-1 text-[15px] leading-7 whitespace-pre-wrap">
                    {job.requirements || "—"}
                    </div>
                </div>
                </section>

                {/* Print footer */}
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6 hidden print:block mt-6">
                <div className="text-sm font-semibold">Trip Nest</div>
                <div className="text-sm">New Kandy Road, Malabe</div>
                <div className="text-sm">Tel: 0755552222</div>
                </div>

                {/* Back link (optional, not in print) */}
                <div className="print:hidden mt-6">
                <button
                    onClick={() => navigate(-1)}
                    className="rounded-full border px-4 py-2 text-sm hover:bg-gray-100"
                >
                    ← Back
                </button>
                </div>
            </>
            )}
        </main>
        </div>
    );
    }

    /* ---------- tiny UI helpers ---------- */
    function Field({ label, children }) {
    return (
        <div className="flex items-start md:items-center gap-4">
        <Label className="min-w-[120px]">{label}</Label>
        <div className="font-medium text-[15px]">{children}</div>
        </div>
    );
    }

    function Label({ children, className = "" }) {
    return (
        <div className={`text-gray-800 font-semibold ${className}`}>
        {children}
        </div>
    );
}
