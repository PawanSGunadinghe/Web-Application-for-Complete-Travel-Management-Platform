import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

// Helper function to extract only digits
function onlyDigits(v) {
    return String(v || "").replace(/\D/g, "");
}

// Phone validation rules per country
const PHONE_RULES = {
    LK: { localMin: 9, localMax: 9, placeholder: "07XXXXXXX" },
    IN: { localMin: 10, localMax: 10, placeholder: "9XXXXXXXXX" },
    US: { localMin: 10, localMax: 10, placeholder: "2015550123" },
    CA: { localMin: 10, localMax: 10, placeholder: "4165550123" },
    SG: { localMin: 8, localMax: 8, placeholder: "81234567" },
    AE: { localMin: 9, localMax: 9, placeholder: "512345678" },
    JP: { localMin: 10, localMax: 11, placeholder: "09012345678" },
    CN: { localMin: 11, localMax: 11, placeholder: "13800138000" },
};

// Get phone rules for a country
function getPhoneRules(code, phoneCode) {
    const r = PHONE_RULES[code];
    if (r) return r;
    const dialDigits = onlyDigits(phoneCode);
    const localMax = Math.max(6, 15 - dialDigits.length);
    return { localMin: 6, localMax, placeholder: "Phone number" };
}

// Countries with dial codes
const COUNTRIES_ALLOWED = [
    { code: "LK", name: "Sri Lanka", dial: "+94" },
    { code: "IN", name: "India", dial: "+91" },
    { code: "US", name: "United States", dial: "+1" },
    { code: "GB", name: "United Kingdom", dial: "+44" },
    { code: "AU", name: "Australia", dial: "+61" },
    { code: "AE", name: "United Arab Emirates", dial: "+971" },
    { code: "SG", name: "Singapore", dial: "+65" },
    { code: "DE", name: "Germany", dial: "+49" },
    { code: "FR", name: "France", dial: "+33" },
    { code: "CA", name: "Canada", dial: "+1" },
    { code: "NZ", name: "New Zealand", dial: "+64" },
    { code: "JP", name: "Japan", dial: "+81" },
    { code: "CN", name: "China", dial: "+86" },
    { code: "MY", name: "Malaysia", dial: "+60" },
    { code: "TH", name: "Thailand", dial: "+66" },
    { code: "ID", name: "Indonesia", dial: "+62" },
];

export default function CustomizePackage() {
    const navigate = useNavigate();

    // You can change this API path if needed
    const API_BASE = useMemo(
        () => `${process.env.REACT_APP_API_URL || "http://localhost:4000/api"}`,
        []
    );

    // ----- Form state -----
    const [form, setForm] = useState({
        fullName: "",
        email: "",
        phone: "",
        country: "LK",
        phoneCode: "+94",
        travellers: 1,
        startDate: "",
        endDate: "",
        destinations: "",
        duration: "",
    });

    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [serverMsg, setServerMsg] = useState("");

    //get today date(block paste)
    const todayStr = new Date().toISOString().slice(0, 10);

    //email validation

    const emailOk = (v) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim());

    //check given date is before today
    const isPast = (dateStr) => {
        if (!dateStr) return false;
        const d = new Date(dateStr);
        const t = new Date(todayStr); // normalize to midnight local
        return d < t;
    };

    const setField = (name, value) => {
        setForm((f) => ({ ...f, [name]: value }));
        setErrors((e) => ({ ...e, [name]: "" })); // clear inline error as user edits
    };

    // ----- Validation -----
    const validate = () => {
        const err = {};

        if (!form.fullName.trim()) err.fullName = "Full name is required.";

        if (!form.email.trim()) err.email = "Email is required.";
        else if (!emailOk(form.email)) err.email = "Enter a valid email address.";

        const country = COUNTRIES_ALLOWED.find(c => c.code === form.country);
        if (!country) {
            err.country = "Select a valid country";
        }

        const rules = getPhoneRules(form.country, form.phoneCode);
        const digits = onlyDigits(form.phone);
        if (digits.length < rules.localMin || digits.length > rules.localMax) {
            const range =
                rules.localMin === rules.localMax
                    ? `${rules.localMax} digits`
                    : `${rules.localMin}-${rules.localMax} digits`;
            err.phone = `Enter a valid ${range} number for the selected country`;
        }

        const trav = Number(form.travellers);
        if (!trav || trav < 1) err.travellers = "Enter at least 1 traveller.";

        if (!form.startDate) err.startDate = "Start date is required.";
        else if (isPast(form.startDate)) err.startDate = "Start date can't be in the past.";

        if (!form.endDate) err.endDate = "End date is required.";
        else if (isPast(form.endDate)) err.endDate = "End date can't be in the past.";

        if (form.startDate && form.endDate) {
        const s = new Date(form.startDate);
        const e = new Date(form.endDate);
        if (e < s) err.endDate = "End date must be on/after start date.";
        }

        const dur = Number(form.duration);
        if (!dur || dur < 1) err.duration = "Duration must be at least 1 day.";
        else if (dur > 60) err.duration = "Duration cannot exceed 60 days.";

        if (!form.destinations.trim())
        err.destinations = "Please enter at least one preferred destination.";

        setErrors(err);
        return Object.keys(err).length === 0;
    };

    // ----- Submit -----
    const onSubmit = async (e) => {
        e.preventDefault();
        setServerMsg("");

        if (!validate()) return;

        setSubmitting(true);
        try {
        const payload = {
            fullName: form.fullName.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            country: form.country.trim(),
            travellers: Number(form.travellers),
            preferredDates: {
            start: form.startDate,
            end: form.endDate,
            },
            destinations: form.destinations.trim(),
            durationDays: Number(form.duration),
        };

        const r = await fetch(`${API_BASE}/custom-packages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload),
        });

        if (!r.ok) {
            const data = await r.json().catch(() => ({}));
            throw new Error(data?.error || "Failed to submit request");
        }

        setServerMsg("Request submitted! We’ll be in touch shortly.");
        setTimeout(() => navigate("/booking"), 1200);
        } catch (err) {
        setServerMsg(err.message || "Something went wrong. Please try again.");
        } finally {
        setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F4F8FB]">
        {/* Hero */}
        <header className="relative">
            <div
            className="h-48 md:h-56 w-full bg-center bg-cover"
            style={{
                backgroundImage:
                'url("https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=1600&auto=format&fit=crop")',
            }}
            />
            <div className="absolute inset-0 bg-black/30" />
            <div className="absolute inset-0 flex items-center">
            <div className="max-w-6xl mx-auto w-full px-6 md:px-10 flex items-center justify-between">
                <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow">
                Customize Your Package
                </h1>
                <Link
                to="/booking"
                className="rounded-full bg-white/90 text-blue-700 px-4 py-2 text-sm font-semibold border border-white hover:bg-white"
                >
                Back to Home
                </Link>
            </div>
            </div>
        </header>

        {/* Form */}
        <main className="max-w-6xl mx-auto px-6 md:px-10 py-10">
            <div className="grid md:grid-cols-3 gap-6">
            <section className="md:col-span-2">
                <form
                onSubmit={onSubmit}
                className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6"
                >
                <div className="grid sm:grid-cols-2 gap-5">
                    {/* Full Name */}
                    <div>
                    <label className="block text-sm font-medium text-slate-700">
                        Full Name<span className="text-red-500"> *</span>
                    </label>
                    <input
                        type="text"
                        value={form.fullName}
                        onChange={(e) => {
                            const value = e.target.value.replace(/[^A-Za-z\s]/g, ''); // Only letters and spaces
                            setField("fullName", value);
                        }}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
                        placeholder="John Doe"
                    />
                    {errors.fullName && (
                        <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>
                    )}
                    </div>

                    {/* Email */}
                    <div>
                    <label className="block text-sm font-medium text-slate-700">
                        Email<span className="text-red-500"> *</span>
                    </label>
                    <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setField("email", e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
                        placeholder="you@example.com"
                    />
                    {errors.email && (
                        <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                    )}
                    </div>

                    {/* Country */}
                    <div>
                    <label className="block text-sm font-medium text-slate-700">
                        Country/Region<span className="text-red-500"> *</span>
                    </label>
                    <select
                        value={form.country}
                        onChange={(e) => {
                            const code = e.target.value;
                            const match = COUNTRIES_ALLOWED.find(c => c.code === code);
                            const nextDial = match?.dial || form.phoneCode;

                            const rules = getPhoneRules(code, nextDial);
                            const clipped = onlyDigits(form.phone).slice(0, rules.localMax);

                            setForm(f => ({
                                ...f,
                                country: code,
                                phoneCode: nextDial,
                                phone: clipped,
                            }));
                            setErrors(er => ({ ...er, country: "" }));
                        }}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
                    >
                        {COUNTRIES_ALLOWED.map((c) => (
                            <option key={c.code} value={c.code}>{c.name}</option>
                        ))}
                    </select>
                    {errors.country && (
                        <p className="mt-1 text-xs text-red-600">{errors.country}</p>
                    )}
                    </div>

                    {/* Phone */}
                    <div>
                    <label className="block text-sm font-medium text-slate-700">
                        Phone Number<span className="text-red-500"> *</span>
                    </label>
                    <div className="flex gap-2">
                        <select
                            value={form.phoneCode}
                            onChange={(e) => {
                                const nextCode = e.target.value;
                                const rules = getPhoneRules(form.country, nextCode);
                                const clipped = onlyDigits(form.phone).slice(0, rules.localMax);
                                setForm(f => ({ ...f, phoneCode: nextCode, phone: clipped }));
                                setErrors(er => ({ ...er, phone: "" }));
                            }}
                            className="border rounded-lg px-3 py-2 w-32"
                            title="Dialing code"
                        >
                            {COUNTRIES_ALLOWED.map(c => (
                                <option key={c.code} value={c.dial}>
                                    {c.code} {c.dial}
                                </option>
                            ))}
                        </select>

                        <input
                            inputMode="tel"
                            value={form.phone}
                            onChange={(e) => {
                                const rules = getPhoneRules(form.country, form.phoneCode);
                                const digits = onlyDigits(e.target.value);
                                const clipped = digits.slice(0, rules.localMax);
                                setForm(f => ({ ...f, phone: clipped }));
                                setErrors(er => ({ ...er, phone: "" }));
                            }}
                            maxLength={getPhoneRules(form.country, form.phoneCode).localMax}
                            className="flex-1 border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
                            placeholder={getPhoneRules(form.country, form.phoneCode).placeholder}
                        />
                    </div>
                    {errors.phone && (
                        <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
                    )}
                    </div>

                    {/* Travellers */}
                    <div>
                    <label className="block text-sm font-medium text-slate-700">
                        Number of Travellers<span className="text-red-500"> *</span>
                    </label>
                    <input
                        type="number"
                        min={1}
                        value={form.travellers}
                        onChange={(e) =>
                        setField("travellers", Math.max(1, Number(e.target.value || 1)))
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
                    />
                    {errors.travellers && (
                        <p className="mt-1 text-xs text-red-600">{errors.travellers}</p>
                    )}
                    </div>

                    {/* Duration */}
                    <div>
                    <label className="block text-sm font-medium text-slate-700">
                        Duration of Stay (days)<span className="text-red-500"> *</span>
                    </label>
                    <input
                        type="number"
                        min={1}
                        value={form.duration}
                        onChange={(e) =>
                        setField("duration", e.target.value.replace(/[^\d]/g, ""))
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
                        placeholder="e.g., 7"
                    />
                    {errors.duration && (
                        <p className="mt-1 text-xs text-red-600">{errors.duration}</p>
                    )}
                    </div>

                    {/* Dates */}
                    <div>
                    <label className="block text-sm font-medium text-slate-700">
                        Preferred Travel Start Date<span className="text-red-500"> *</span>
                    </label>
                    <input
                        type="date"
                        min={todayStr}
                        value={form.startDate}
                        onChange={(e) => {
                        const v = e.target.value;
                        setField("startDate", v);
                        // If end date is before new start, clear it
                        if (form.endDate && new Date(form.endDate) < new Date(v)) {
                            setField("endDate", "");
                        }
                        }}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
                    />
                    {errors.startDate && (
                        <p className="mt-1 text-xs text-red-600">{errors.startDate}</p>
                    )}
                    </div>

                    <div>
                    <label className="block text-sm font-medium text-slate-700">
                        Preferred Travel End Date<span className="text-red-500"> *</span>
                    </label>
                    <input
                        type="date"
                        min={form.startDate || todayStr}
                        value={form.endDate}
                        onChange={(e) => setField("endDate", e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
                    />
                    {errors.endDate && (
                        <p className="mt-1 text-xs text-red-600">{errors.endDate}</p>
                    )}
                    </div>

                    {/* Destinations */}
                    <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700">
                        Preferred Destination(s)<span className="text-red-500"> *</span>
                    </label>
                    <textarea
                        rows={3}
                        value={form.destinations}
                        onChange={(e) => setField("destinations", e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
                        placeholder="e.g., Kandy, Ella, Galle"
                    />
                    {errors.destinations && (
                        <p className="mt-1 text-xs text-red-600">{errors.destinations}</p>
                    )}
                    </div>
                </div>

                {/* Submit */}
                <div className="mt-6 flex items-center gap-3">
                    <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                    {submitting ? "Submitting..." : "Submit Request"}
                    </button>
                    {serverMsg && (
                    <span className="text-sm text-slate-700">{serverMsg}</span>
                    )}
                </div>
                </form>
            </section>

            {/* Sidebar */}
            <aside className="md:col-span-1">
                <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
                <h3 className="text-base font-semibold text-slate-800">
                    Need help?
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                    Tell us where you want to go and when — we’ll tailor the perfect
                    plan for your group.
                </p>
                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                    <li>• No past dates allowed.</li>
                    <li>• Phone number validated by country.</li>
                    <li>• Duration: 1-60 days.</li>
                    <li>• Travellers must be at least 1.</li>
                </ul>
                </div>
            </aside>
            </div>
        </main>
        </div>
    );
}
