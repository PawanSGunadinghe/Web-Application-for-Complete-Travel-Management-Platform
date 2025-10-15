import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminJobPostPage() {
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
    const [errors, setErrors] = useState({});

    // Local-tz-safe YYYY-MM-DD for <input type="date" min=...>
    const todayStr = useMemo(() => {
        const d = new Date();
        const pad = (n) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }, []);

    // Calculate max date (3 months from today)
    const maxDateStr = useMemo(() => {
        const d = new Date();
        d.setMonth(d.getMonth() + 3);
        const pad = (n) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Force contact to be digits only, max 10
        if (name === "contact") {
        const digits = value.replace(/\D/g, "").slice(0, 10);
        setForm((f) => ({ ...f, contact: digits }));
        // live-validate
        setErrors((err) => ({ ...err, contact: digits.length === 10 ? "" : "Phone must be 10 digits" }));
        return;
        }

        // Job position: only letters and spaces
        if (name === "position") {
        const lettersOnly = value.replace(/[^A-Za-z\s]/g, '');
        setForm((f) => ({ ...f, position: lettersOnly }));
        return;
        }

        // Description: limit to 1000 characters
        if (name === "description") {
        const limitedValue = value.slice(0, 1000);
        setForm((f) => ({ ...f, description: limitedValue }));
        setErrors((err) => ({
            ...err,
            description: limitedValue.length > 1000 ? "Description must be 1000 characters or less" : "",
        }));
        return;
        }

        // Update others as usual
        setForm((f) => ({ ...f, [name]: value }));

        // live-validate deadline if touched
        if (name === "deadline") {
        setErrors((err) => ({
            ...err,
            deadline: value && value < todayStr ? "Deadline cannot be before today" : 
                     value && value > maxDateStr ? "Deadline cannot be more than 3 months from today" : "",
        }));
        }
    };

    const handleClear = () => {
        setForm({
        title: "",
        position: "",
        description: "",
        contact: "",
        deadline: "",
        salary: "",
        duration: "",
        requirements: "",
        });
        setErrors({});
    };

    const validate = () => {
        const next = {};
        // exactly 10 digits
        if (form.contact.length !== 10) next.contact = "Phone must be 10 digits";
        
        // Job position: only letters and spaces
        if (!form.position.trim()) next.position = "Required";
        else if (!/^[A-Za-z\s]+$/.test(form.position)) next.position = "Only letters and spaces allowed";
        
        // Description: max 1000 characters
        if (!form.description.trim()) next.description = "Required";
        else if (form.description.length > 1000) next.description = "Description must be 1000 characters or less";
        
        // date validation: not before today, not more than 3 months
        if (!form.deadline) next.deadline = "Please choose a deadline";
        else if (form.deadline < todayStr) next.deadline = "Deadline cannot be before today";
        else if (form.deadline > maxDateStr) next.deadline = "Deadline cannot be more than 3 months from today";
        
        return next;
    };

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        const next = validate();
        setErrors(next);
        if (Object.keys(next).length) return;

        try {
            const resp = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:4000/api"}/guide-jobs`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(form),
            });

            const json = await resp.json();

            if (!resp.ok) {
                if (json?.errors) setErrors((prev) => ({ ...prev, ...json.errors }));
                else alert(json?.error || "Submit failed");
                return;
            }

            alert("Submitted! ✅");
            handleClear();
            // Navigate to guide-job/:id
            if (json?.id) {
                navigate(`/admin/guide-job/${json.id}`);
            }
        } catch (err) {
            console.error(err);
            alert("Network error. Is the API running?");
        }
    };


    const isInvalid = Boolean(
        errors.contact ||
        errors.position ||
        errors.description ||
        errors.deadline ||
        form.contact.length !== 10 ||
        !form.position.trim() ||
        !form.description.trim() ||
        !form.deadline ||
        (form.deadline && form.deadline < todayStr) ||
        (form.deadline && form.deadline > maxDateStr)
    );

    return (
        <div className="min-h-screen bg-white text-gray-900">
        <header className="border-b justify-center text-center bg-gray-100/50 shadow-sm">
            <h1 className="text-3xl font-bold p-6">Create Job Post</h1>
        </header>

        <main className="max-w-6xl mx-auto px-6 md:px-12 py-10">
            <form onSubmit={handleSubmit} className="space-y-8 bg-slate-400/10 p-8 rounded-lg shadow">
            {/* Application Title */}
            <FormRow label="Application Title">
                <input
                name="title"
                value={form.title}
                onChange={handleChange}
                className="w-full max-w-3xl rounded-md bg-gray-100 border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-300"
                placeholder="e.g., Senior Tour Guide – Colombo Region"
                />
            </FormRow>

            {/* Job Position */}
            <FormRow label="Job Position" error={errors.position}>
                <input
                name="position"
                value={form.position}
                onChange={handleChange}
                className={`w-full max-w-sm rounded-md bg-gray-100 border px-4 py-2.5 focus:outline-none focus:ring-2 ${
                    errors.position ? "border-red-500 focus:ring-red-300" : "border-gray-200 focus:ring-gray-300"
                }`}
                placeholder="e.g., Tour Guide"
                />
                {errors.position && <p className="mt-1 text-sm text-red-600">{errors.position}</p>}
            </FormRow>

            {/* Description */}
            <FormRow label="Description" error={errors.description}>
                <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={6}
                maxLength={1000}
                className={`w-full max-w-4xl rounded-md bg-gray-100 border px-4 py-3 focus:outline-none focus:ring-2 resize-y ${
                    errors.description ? "border-red-500 focus:ring-red-300" : "border-gray-200 focus:ring-gray-300"
                }`}
                placeholder="Describe responsibilities, expectations, benefits, etc."
                />
                <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-gray-500">Maximum 1000 characters</p>
                    <p className={`text-xs ${form.description.length > 1000 ? "text-red-600" : "text-gray-500"}`}>
                        {form.description.length}/1000
                    </p>
                </div>
                {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
            </FormRow>

            {/* Contact + Deadline */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <FormRow label="Contact Number" error={errors.contact}>
                <input
                    name="contact"
                    inputMode="numeric"
                    type="tel"
                    pattern="[0-9]*"
                    maxLength={10}
                    value={form.contact}
                    onChange={handleChange}
                    className={`w-full max-w-xs rounded-md bg-gray-100 border px-4 py-2.5 focus:outline-none focus:ring-2 ${
                    errors.contact ? "border-red-500 focus:ring-red-300" : "border-gray-200 focus:ring-gray-300"
                    }`}
                    placeholder="e.g., 0771234567"
                    aria-invalid={Boolean(errors.contact)}
                />
                {errors.contact && <p className="mt-1 text-sm text-red-600">{errors.contact}</p>}
                </FormRow>

                <FormRow label="Deadline" error={errors.deadline}>
                <input
                    type="date"
                    name="deadline"
                    value={form.deadline}
                    onChange={handleChange}
                    min={todayStr}
                    max={maxDateStr}
                    className={`w-full max-w-xs rounded-md bg-gray-100 border px-4 py-2.5 focus:outline-none focus:ring-2 ${
                    errors.deadline ? "border-red-500 focus:ring-red-300" : "border-gray-200 focus:ring-gray-300"
                    }`}
                    aria-invalid={Boolean(errors.deadline)}
                />
                {errors.deadline && <p className="mt-1 text-sm text-red-600">{errors.deadline}</p>}
                </FormRow>
            </div>

            {/* Salary */}
            <FormRow label="Salary">
                <input
                name="salary"
                type="number"
                value={form.salary}
                onChange={handleChange}
                className="w-full max-w-xs rounded-md bg-gray-100 border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-300"
                placeholder="e.g., LKR 120,000 / month"
                />
            </FormRow>

            {/* Contract Duration */}
            <FormRow label="Contract Duration">
                <input
                name="duration"
                value={form.duration}
                onChange={handleChange}
                className="w-full max-w-xs rounded-md bg-gray-100 border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-300"
                placeholder="e.g., 12 months"
                />
            </FormRow>

            {/* Requirements */}
            <FormRow label="Requirements">
                <input
                name="requirements"
                value={form.requirements}
                onChange={handleChange}
                className="w-full max-w-3xl rounded-md bg-gray-100 border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-300"
                placeholder="e.g., English + Sinhala, 3+ years guiding, valid license"
                />
            </FormRow>

            {/* Actions */}
            <div className="flex justify-end gap-6 pt-6">
                <button
                type="button"
                onClick={handleClear}
                className="rounded-full border border-gray-700 px-7 py-2.5 text-sm font-medium hover:bg-gray-50 active:scale-95 transition"
                >
                Clear
                </button>
                <button
                type="submit"
                disabled={isInvalid}
                className={`rounded-full border border-gray-700 px-7 py-2.5 text-sm font-medium active:scale-95 transition ${
                    isInvalid ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-900 hover:text-white"
                }`}
                >
                Submit
                </button>
            </div>
            </form>
        </main>
        </div>
    );
    }

    function FormRow({ label, error, children }) {
    return (
        <div className="grid grid-cols-[160px_minmax(0,1fr)] items-start gap-6">
        <label className="pt-2 font-medium text-sm md:text-base select-none">{label}</label>
        <div>
            {children}
            {error ? null : null}
        </div>
        </div>
    );
}
