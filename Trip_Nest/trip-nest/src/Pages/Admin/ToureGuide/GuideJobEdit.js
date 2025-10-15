// GuideJobEdit.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";

export default function GuideJobEdit() {
    const { id } = useParams();
    const navigate = useNavigate();

    const API_BASE = useMemo(
        () => `${process.env.REACT_APP_API_URL || "http://localhost:4000/api"}`,
        []
    );

    // local (calendar) "today" string -> YYYY-MM-DD
    const todayStr = useMemo(() => {
        const t = new Date();
        const yyyy = t.getFullYear();
        const mm = String(t.getMonth() + 1).padStart(2, "0");
        const dd = String(t.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
    }, []);

    const [form, setForm] = useState({
        title: "",
        position: "",
        description: "",
        contact: "",
        deadline: "",
        salary: "",
        duration: "",
        requirements: "",
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});

    // load existing job
    useEffect(() => {
        let alive = true;
        (async () => {
        try {
            setLoading(true);
            const r = await fetch(`${API_BASE}/guide-jobs/${id}`, { credentials: "include" });
            if (!r.ok) throw new Error("Failed to load job");
            const j = await r.json();
            if (!alive) return;

            setForm({
            title: j.title ?? "",
            position: j.position ?? "",
            description: j.description ?? "",
            // sanitize contact to 10 digits on load as well
            contact: (j.contact ?? "").toString().replace(/\D/g, "").slice(0, 10),
            deadline: j.deadline ? new Date(j.deadline).toISOString().slice(0, 10) : "",
            salary: j.salary ?? "",
            duration: j.duration ?? "",
            requirements: j.requirements ?? "",
            });
            setError("");
        } catch (e) {
            setError(e.message || "Failed to load job");
        } finally {
            setLoading(false);
        }
        })();
        return () => {
        alive = false;
        };
    }, [API_BASE, id]);

    function onChange(e) {
        const { name, value } = e.target;

        // Enforce digits-only and length cap while typing for contact
        if (name === "contact") {
        const digits = value.replace(/\D/g, "").slice(0, 10);
        setForm((f) => ({ ...f, contact: digits }));
        return;
        }

        setForm((f) => ({ ...f, [name]: value }));
    }

    async function onSubmit(e) {
        e.preventDefault();
        setSaving(true);
        setError("");
        setFieldErrors({});

        // Client-side validations
        const clientErrors = {};
        if (!/^[0-9]{10}$/.test(form.contact)) {
        clientErrors.contact = "Contact must be exactly 10 digits.";
        }
        if (form.deadline && form.deadline < todayStr) {
        clientErrors.deadline = "Deadline cannot be in the past.";
        }

        if (Object.keys(clientErrors).length) {
        setFieldErrors(clientErrors);
        setSaving(false);
        return;
        }

        try {
        const r = await fetch(`${API_BASE}/guide-jobs/${id}`, {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        });
        if (!r.ok) {
            // backend may return {errors:{field:"msg"}} or {error:"..."}
            let msg = "Update failed";
            try {
            const j = await r.json();
            if (j.errors) {
                setFieldErrors(j.errors);
                msg = "Please fix the highlighted fields.";
            } else if (j.error) {
                msg = j.error;
            }
            } catch {}
            throw new Error(msg);
        }
        // success -> back to detail page
        navigate(`/admin/guide-job/${id}`, { replace: true });
        } catch (e) {
        setError(e.message || "Update failed");
        } finally {
        setSaving(false);
        }
    }

    if (loading) {
        return (
        <div className="max-w-3xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">Edit Job</h1>
            <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded" />
            <div className="h-10 bg-gray-200 rounded" />
            <div className="h-24 bg-gray-200 rounded" />
            </div>
        </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto p-6">
        <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Edit Job</h1>
            <Link to={`/admin/guide-job/${id}`} className="text-sm underline">
            Back to job
            </Link>
        </div>

        {error && (
            <div className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-red-700">
            {error}
            </div>
        )}

        <form onSubmit={onSubmit} className="mt-6 space-y-5">
            <Field
            label="Title"
            name="title"
            value={form.title}
            onChange={onChange}
            error={fieldErrors.title}
            required
            />
            <Field
            label="Position"
            name="position"
            value={form.position}
            onChange={onChange}
            error={fieldErrors.position}
            required
            />
            <Field
            as="textarea"
            rows={4}
            label="Description"
            name="description"
            value={form.description}
            onChange={onChange}
            error={fieldErrors.description}
            required
            />

            {/* PHONE: tel type, digits only, exactly 10 */}
            <Field
            label="Contact (10 digits)"
            name="contact"
            type="tel"
            value={form.contact}
            onChange={onChange}
            error={fieldErrors.contact}
            inputMode="numeric"
            autoComplete="tel"
            pattern="[0-9]{10}"
            minLength={10}
            maxLength={10}
            title="Enter exactly 10 digits"
            required
            />

            {/* DATE: cannot choose past dates */}
            <Field
            label="Deadline"
            name="deadline"
            type="date"
            value={form.deadline}
            onChange={onChange}
            error={fieldErrors.deadline}
            min={todayStr}
            required
            />

            <Field
            label="Salary (LKR)"
            name="salary"
            type="number"
            value={form.salary}
            onChange={onChange}
            error={fieldErrors.salary}
            />
            <Field
            label="Contract Duration"
            name="duration"
            value={form.duration}
            onChange={onChange}
            error={fieldErrors.duration}
            />
            <Field
            as="textarea"
            rows={4}
            label="Requirements"
            name="requirements"
            value={form.requirements}
            onChange={onChange}
            error={fieldErrors.requirements}
            />

            <div className="pt-4 flex gap-3">
            <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-gray-900 text-white px-5 py-2.5 text-sm font-medium disabled:opacity-60"
            >
                {saving ? "Saving…" : "Save changes"}
            </button>
            <Link
                to={`/admin/guide-job/${id}`}
                className="rounded-full border border-gray-300 px-5 py-2.5 text-sm font-medium"
            >
                Cancel
            </Link>
            </div>
        </form>
        </div>
    );
    }

    function Field({
    label,
    name,
    as = "input",
    type = "text",
    rows,
    value,
    onChange,
    error,
    required,
    ...rest
    }) {
    const Comp = as;
    return (
        <div>
        <label className="block text-sm font-medium mb-1" htmlFor={name}>
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <Comp
            id={name}
            name={name}
            type={type}
            rows={rows}
            value={value}
            onChange={onChange}
            className={`w-full rounded-lg border px-3 py-2 ${
            error ? "border-red-400" : "border-gray-300"
            }`}
            {...rest}
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
    );
}
