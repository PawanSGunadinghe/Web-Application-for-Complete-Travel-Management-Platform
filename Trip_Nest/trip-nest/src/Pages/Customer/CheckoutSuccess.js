
// src/Pages/Customer/CheckoutSuccess.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const onlyDigits = (s) => String(s || "").replace(/\D/g, "");

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
    GB: { localMin: 10, localMax: 10, placeholder: "7400123456" },
    AU: { localMin: 9, localMax: 9, placeholder: "412345678" },
    DE: { localMin: 10, localMax: 11, placeholder: "15112345678" },
    FR: { localMin: 9, localMax: 9, placeholder: "612345678" },
    NZ: { localMin: 9, localMax: 10, placeholder: "211234567" },
    MY: { localMin: 9, localMax: 10, placeholder: "123456789" },
    TH: { localMin: 9, localMax: 9, placeholder: "812345678" },
    ID: { localMin: 10, localMax: 12, placeholder: "8123456789" },
};

// Get phone rules for a country code
function getPhoneRules(countryCode) {
    const r = PHONE_RULES[countryCode];
    if (r) return r;
    return { localMin: 6, localMax: 15, placeholder: "Phone number" };
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

export default function CheckoutSuccess() {
    const [search] = useSearchParams();
    const navigate = useNavigate();
    const id = search.get("id");

    const baseUrl = useMemo(
        () => (process.env.REACT_APP_API_URL || "http://localhost:4000/api").replace(/\/+$/, ""),
        []
    );

    // apiBase ends with “…/api”; fileBase strips “/api” → origin used for static files
    const apiBase = baseUrl;
    const fileBase = apiBase.replace(/\/api$/, "");

    const [booking, setBooking] = useState(null);
    const [pkg, setPkg] = useState(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    // --- helpers --------------------------------------------------------------
    const joinUrl = (base, path) => {
        const b = String(base || "").replace(/\/+$/, "");
        const p = String(path || "").replace(/^\/+/, "");
        return `${b}/${p}`;
    };

    const imageSrc = (u) => {
        if (!u) return "";
        if (/^https?:\/\//i.test(u)) return u; // already absolute
        return joinUrl(fileBase, u); // relative → join with host
    };

    const fmtDate = (d) =>
        d ? new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";

    const fmtMoney = (n) => Number(n || 0).toLocaleString(undefined, { style: "currency", currency: "USD" });

    // -------------------------------------------------------------------------

    useEffect(() => {
        let live = true;
        if (!id) {
        setErr("Missing booking id.");
        setLoading(false);
        return;
        }

        (async () => {
        try {
            setLoading(true);
            setErr("");

            // 1) get booking
            const r = await fetch(`${apiBase}/bookings/${id}`, { credentials: "include" });
            const data = await r.json();
            if (!r.ok) throw new Error(data?.error || "Failed to load booking");
            if (!live) return;
            setBooking(data);

            // 2) get package (use snapshot if provided; otherwise fetch)
            const pkgObj = data.package || data.pkg || data.packageSnapshot;
            if (pkgObj?.name) {
            setPkg(pkgObj);
            } else if (data.packageId) {
            const pr = await fetch(`${apiBase}/packages/${data.packageId}`, { credentials: "include" });
            const p = await pr.json();
            if (pr.ok) setPkg(p);
            }
        } catch (e) {
            if (!live) return;
            console.error(e);
            setErr(e.message || "Something went wrong");
        } finally {
            if (live) setLoading(false);
        }
        })();

        return () => {
        live = false;
        };
    }, [apiBase, id]);

    // ------ Edit contact details ----------------------------------------------
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveErr, setSaveErr] = useState("");
    const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", phoneCode: "", country: "", requests: "" });
    const [ferr, setFerr] = useState({});

    const startEdit = () => {
        const c = booking?.customer || {};
        const countryData = COUNTRIES_ALLOWED.find(ct => ct.code === c.country) || COUNTRIES_ALLOWED[0];
        setForm({
        firstName: c.firstName || "",
        lastName: c.lastName || "",
        email: c.email || "",
        phone: onlyDigits(c.phone || ""),
        phoneCode: c.phoneCode || countryData.dial,
        country: c.country || "LK",
        requests: c.requests || "",
        });
        setFerr({});
        setSaveErr("");
        setEditing(true);
    };

    const cancelEdit = () => {
        setEditing(false);
        setFerr({});
        setSaveErr("");
    };

    const validate = () => {
        const next = {};
        
        // Validate first name - no digits
        if (!form.firstName.trim()) {
            next.firstName = "First name is required";
        } else if (/\d/.test(form.firstName)) {
            next.firstName = "First name cannot contain digits";
        }
        
        // Validate last name - no digits
        if (!form.lastName.trim()) {
            next.lastName = "Last name is required";
        } else if (/\d/.test(form.lastName)) {
            next.lastName = "Last name cannot contain digits";
        }
        
        const email = String(form.email || "").trim();
        if (!email.includes("@")) next.email = "Email must contain @";
        else if (!EMAIL_RX.test(email)) next.email = "Enter a valid email";
        
        if (!form.country) {
            next.country = "Country is required";
        }

        // Validate phone number based on country
        const rules = getPhoneRules(form.country || 'LK');
        const phoneDigits = onlyDigits(form.phone);
        if (phoneDigits.length === 0) {
            next.phone = "Phone number is required";
        } else if (phoneDigits.length < rules.localMin || phoneDigits.length > rules.localMax) {
            const range = rules.localMin === rules.localMax
                ? `${rules.localMax} digits`
                : `${rules.localMin}-${rules.localMax} digits`;
            next.phone = `Enter a valid ${range} number for ${COUNTRIES_ALLOWED.find(c => c.code === form.country)?.name || 'selected country'}`;
        }
        return next;
    };

    const saveEdit = async () => {
        const v = validate();
        setFerr(v);
        if (Object.keys(v).length) return;

        try {
        setSaving(true);
        setSaveErr("");

        const payload = {
            customer: {
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            email: form.email.trim(),
            phone: onlyDigits(form.phone),
            phoneCode: form.phoneCode,
            country: form.country,
            requests: form.requests,
            },
        };

        const r = await fetch(`${apiBase}/bookings/${booking._id}`, {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
            setSaveErr(data?.error || "Failed to update booking");
            setFerr((prev) => ({ ...prev, ...(data?.errors || {}) }));
            return;
        }

        setBooking(data);
        setEditing(false);
        } catch (e) {
        console.error(e);
        setSaveErr(e.message || "Network error");
        } finally {
        setSaving(false);
        }
    };

    // ------ Edit number of tourists (qty) -------------------------------------
    const [editGuests, setEditGuests] = useState(false);
    const [qtyDraft, setQtyDraft] = useState(1);
    const [qtyErr, setQtyErr] = useState("");

    useEffect(() => {
        if (booking?.pricing?.qty) setQtyDraft(Number(booking.pricing.qty));
    }, [booking]);

    const maxGuests = Number(
        booking?.package?.maxTourist ??
        booking?.packageSnapshot?.maxTourist ??
        pkg?.maxTourist ??
        10
    );

    const startEditGuests = () => {
        const q = Number(booking?.pricing?.qty || 1);
        setQtyDraft(q);
        setQtyErr("");
        setEditGuests(true);
    };

    const cancelEditGuests = () => {
        setEditGuests(false);
        setQtyErr("");
    };

    const saveGuests = async () => {
        try {
        setSaving(true);
        setQtyErr("");
        setSaveErr("");

        const r = await fetch(`${apiBase}/bookings/${booking._id}`, {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ qty: qtyDraft }),
        });
        const data = await r.json().catch(() => ({}));

        if (!r.ok) {
            if (data?.errors?.qty) setQtyErr(data.errors.qty);
            else setSaveErr(data?.error || "Failed to update guests");
            return;
        }

        setBooking(data); // re-priced booking from server
        setEditGuests(false);
        } catch (e) {
        setSaveErr(e.message || "Network error");
        } finally {
        setSaving(false);
        }
    };


    // ------ Delete booking ----------------------------------------------------
    const [deleting, setDeleting] = useState(false);
    const [deleteErr, setDeleteErr] = useState("");

    const onDelete = async () => {
        if (!booking?._id) return;
        const ok = window.confirm("Delete this booking? This action cannot be undone.");
        if (!ok) return;

        try {
        setDeleting(true);
        setDeleteErr("");

        const r = await fetch(`${apiBase}/bookings/${booking._id}`, {
            method: "DELETE",
            credentials: "include",
        });
        const data = await r.json().catch(() => ({}));

        if (!r.ok) {
            setDeleteErr(data?.error || "Failed to delete booking");
            return;
        }

        // Success: go somewhere nice
        navigate("/user-profile", { replace: true });
        } catch (e) {
        setDeleteErr(e.message || "Network error");
        } finally {
        setDeleting(false);
        }
    };

    // -------------------------------------------------------------------------

    if (loading) {
        return (
        <div className="min-h-screen bg-white">
            <div className="max-w-5xl mx-auto p-6">
            <div className="h-6 w-56 bg-gray-200 animate-pulse rounded mb-4" />
            <div className="rounded-2xl h-64 bg-gray-200 animate-pulse" />
            </div>
        </div>
        );
    }

    if (err || !booking) {
        return (
        <div className="min-h-screen bg-white">
            <div className="max-w-3xl mx-auto p-6">
            <div className={`mb-6 ${err ? "text-red-600" : "text-gray-700"}`}>{err || "Booking not found."}</div>
            <button
                onClick={() => navigate(-1)}
                className="rounded-full border border-gray-900 px-5 py-2 text-sm hover:bg-gray-900 hover:text-white transition"
            >
                ← Back
            </button>
            </div>
        </div>
        );
    }

    // accept multiple possible image field names
    const images = (() => {
        if (Array.isArray(pkg?.imageUrls)) return pkg.imageUrls;
        if (Array.isArray(pkg?.images)) return pkg.images;
        if (Array.isArray(pkg?.photos)) return pkg.photos;
        if (pkg?.image) return [pkg.image];
        return [];
    })();

    const nights = (() => {
        const s = pkg?.startDate ? new Date(pkg.startDate) : null;
        const e = pkg?.endDate ? new Date(pkg.endDate) : null;
        if (!s || !e) return 0;
        return Math.max(0, Math.round((e - s) / (1000 * 60 * 60 * 24)));
    })();

    const c = booking.customer || {};
    const p = booking.pricing || {};
    const pay = booking.payment || {};

    return (
        <div className="min-h-screen bg-white text-gray-900">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
            <div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Booking confirmed 🎉</h1>
                <div className="mt-1 text-sm text-gray-600">
                Booking ID: <span className="font-mono">{booking._id || id}</span> • Created {fmtDate(booking.createdAt)}
                </div>
                {deleteErr ? (
                <div className="mt-2 text-sm text-red-600">{deleteErr}</div>
                ) : null}
            </div>
            <div className="flex gap-2">
                <button
                onClick={() => window.print()}
                className="rounded-full border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100 transition print:hidden"
                >
                Download PDF
                </button>
                <button
                onClick={onDelete}
                disabled={deleting}
                className={`rounded-full px-4 py-2 text-sm font-medium transition print:hidden ${
                    deleting
                    ? "bg-red-300 text-white"
                    : "bg-red-600 text-white hover:bg-red-700"
                }`}
                title="Delete this booking"
                >
                {deleting ? "Deleting…" : "Delete"}
                </button>
                <Link to="/home">
                <button className="rounded-full border border-gray-900 px-4 py-2 text-sm font-medium hover:bg-gray-900 hover:text-white transition print:hidden">
                    Home
                </button>
                </Link>
            </div>
            </div>

            {/* Content */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: property + dates */}
            <div className="lg:col-span-2 space-y-6">
                <div className="rounded-2xl border p-4">
                <div className="flex gap-4">
                    <img
                    src={images[0] ? imageSrc(images[0]) : "https://via.placeholder.com/160x120?text=No+Image"}
                    alt={pkg?.name || "Package"}
                    className="h-28 w-36 object-cover rounded"
                    />
                    <div className="min-w-0">
                    <div className="text-lg font-semibold truncate">{pkg?.name || "Package"}</div>
                    <div className="text-sm text-gray-600">
                        Check-in <span className="font-medium">{fmtDate(pkg?.startDate)}</span> • Check-out{" "}
                        <span className="font-medium">{fmtDate(pkg?.endDate)}</span>
                    </div>

                    {/* Guests row with inline editor */}
                    {!editGuests ? (
                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-3">
                        <span>
                            {nights || "—"} {nights === 1 ? "night" : "nights"} • {p.qty || 1}{" "}
                            {p.qty === 1 ? "guest" : "guests"}
                        </span>
                        <button
                            onClick={startEditGuests}
                            className="rounded-full border border-gray-300 px-2.5 py-0.5 text-xs hover:bg-gray-100 transition print:hidden"
                            title="Edit number of guests"
                        >
                            Edit guests
                        </button>
                        </div>
                    ) : (
                        <div className="mt-2 flex items-center gap-2">
                        <span className="text-sm text-gray-700">Guests:</span>
                        <div className="inline-flex items-center border rounded-full overflow-hidden">
                            <button
                            type="button"
                            className="px-3 py-1 text-lg leading-none"
                            onClick={() => setQtyDraft((q) => Math.max(1, q - 1))}
                            disabled={saving}
                            >
                            −
                            </button>
                            <input
                            value={qtyDraft}
                            onChange={(e) => {
                                const n = Number(e.target.value);
                                if (Number.isFinite(n)) setQtyDraft(Math.max(1, Math.min(maxGuests, n)));
                            }}
                            className="w-14 text-center outline-none"
                            inputMode="numeric"
                            />
                            <button
                            type="button"
                            className="px-3 py-1 text-lg leading-none"
                            onClick={() => setQtyDraft((q) => Math.min(maxGuests, q + 1))}
                            disabled={saving}
                            >
                            +
                            </button>
                        </div>
                        <span className="text-xs text-gray-500">(max {maxGuests})</span>
                        <div className="ml-auto flex items-center gap-2">
                            <button
                            type="button"
                            onClick={cancelEditGuests}
                            className="rounded-full border border-gray-300 px-3 py-1 text-xs hover:bg-gray-100 transition"
                            disabled={saving}
                            >
                            Cancel
                            </button>
                            <button
                            type="button"
                            onClick={saveGuests}
                            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                                saving ? "bg-gray-400 text-white" : "bg-blue-600 text-white hover:bg-blue-700"
                            }`}
                            >
                            {saving ? "Saving…" : "Save"}
                            </button>
                        </div>
                        </div>
                    )}
                    {qtyErr ? <div className="text-xs text-red-600 mt-1">{qtyErr}</div> : null}
                    {saveErr && !editGuests ? <div className="text-xs text-red-600 mt-1">{saveErr}</div> : null}
                    </div>
                </div>
                </div>

                {/* Guest details */}
                <div className="rounded-2xl border p-4">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold">Guest details</h2>

                    {!editing ? (
                    <button
                        onClick={startEdit}
                        className="rounded-full border border-gray-900 px-4 py-1.5 text-sm font-medium hover:bg-gray-900 hover:text-white transition print:hidden"
                        title="Edit email, phone, and special requests"
                    >
                        Edit
                    </button>
                    ) : null}
                </div>

                {!editing ? (
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2 text-sm">
                    <div className="flex justify-between">
                        <dt className="text-gray-500">Name</dt>
                        <dd className="font-medium">
                        {booking?.customer?.firstName} {booking?.customer?.lastName}
                        </dd>
                    </div>
                    <div className="flex justify-between">
                        <dt className="text-gray-500">Email</dt>
                        <dd className="font-medium">{booking?.customer?.email || "—"}</dd>
                    </div>
                    <div className="flex justify-between">
                        <dt className="text-gray-500">Phone</dt>
                        <dd className="font-medium">
                        {(booking?.customer?.phoneCode ? `${booking?.customer?.phoneCode} ` : "") +
                            (booking?.customer?.phone || "—")}
                        </dd>
                    </div>
                    <div className="flex justify-between">
                        <dt className="text-gray-500">Country</dt>
                        <dd className="font-medium">{booking?.customer?.country || "—"}</dd>
                    </div>
                    {booking?.customer?.requests ? (
                        <div className="md:col-span-2">
                        <dt className="text-gray-500">Requests</dt>
                        <dd className="font-medium whitespace-pre-wrap">{booking.customer.requests}</dd>
                        </div>
                    ) : null}
                    </dl>
                ) : (
                    <div className="space-y-4">
                    {saveErr ? (
                        <div className="rounded-md bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
                        {saveErr}
                        </div>
                    ) : null}

                    {/* First Name */}
                    <div>
                        <label className="block text-sm text-gray-700 mb-1">First Name</label>
                        <input
                        value={form.firstName}
                        onChange={(e) => {
                            const value = e.target.value.replace(/[0-9]/g, ''); // Remove digits
                            setForm((f) => ({ ...f, firstName: value }));
                            setFerr((er) => ({ ...er, firstName: "" }));
                        }}
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                        placeholder="John"
                        />
                        {ferr.firstName ? <p className="text-sm text-red-600 mt-1">{ferr.firstName}</p> : null}
                    </div>

                    {/* Last Name */}
                    <div>
                        <label className="block text-sm text-gray-700 mb-1">Last Name</label>
                        <input
                        value={form.lastName}
                        onChange={(e) => {
                            const value = e.target.value.replace(/[0-9]/g, ''); // Remove digits
                            setForm((f) => ({ ...f, lastName: value }));
                            setFerr((er) => ({ ...er, lastName: "" }));
                        }}
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                        placeholder="Doe"
                        />
                        {ferr.lastName ? <p className="text-sm text-red-600 mt-1">{ferr.lastName}</p> : null}
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm text-gray-700 mb-1">Email</label>
                        <input
                        value={form.email}
                        onChange={(e) => {
                            setForm((f) => ({ ...f, email: e.target.value }));
                            setFerr((er) => ({ ...er, email: "" }));
                        }}
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                        placeholder="name@example.com"
                        />
                        {ferr.email ? <p className="text-sm text-red-600 mt-1">{ferr.email}</p> : null}
                    </div>

                    {/* Country */}
                    <div>
                        <label className="block text-sm text-gray-700 mb-1">Country/Region</label>
                        <select
                        value={form.country || "LK"}
                        onChange={(e) => {
                            const code = e.target.value;
                            const match = COUNTRIES_ALLOWED.find(c => c.code === code);
                            const nextDial = match?.dial || form.phoneCode;
                            const rules = getPhoneRules(code);
                            // Trim phone number if it exceeds new country's max length
                            const trimmedPhone = (form.phone || '').slice(0, rules.localMax);
                            
                            setForm((f) => ({ ...f, country: code, phoneCode: nextDial, phone: trimmedPhone }));
                            setFerr((er) => ({ ...er, country: "" }));
                        }}
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                        >
                        {COUNTRIES_ALLOWED.map((c) => (
                            <option key={c.code} value={c.code}>{c.name}</option>
                        ))}
                        </select>
                        {ferr.country ? <p className="text-sm text-red-600 mt-1">{ferr.country}</p> : null}
                    </div>

                    {/* Phone with editable country code */}
                    <div>
                        <label className="block text-sm text-gray-700 mb-1">Phone Number</label>
                        <div className="flex gap-2">
                        <select
                            value={form.phoneCode || "+94"}
                            onChange={(e) => {
                                const newPhoneCode = e.target.value;
                                const newCountry = COUNTRIES_ALLOWED.find(c => c.dial === newPhoneCode);
                                const rules = getPhoneRules(newCountry?.code || 'LK');
                                // Trim phone number if it exceeds new country's max length
                                const trimmedPhone = (form.phone || '').slice(0, rules.localMax);
                                setForm((f) => ({ ...f, phoneCode: newPhoneCode, country: newCountry?.code || f.country, phone: trimmedPhone }));
                                setFerr((er) => ({ ...er, phone: "" }));
                            }}
                            className="border rounded-lg px-3 py-2 text-sm w-32"
                            title="Dialing code"
                        >
                            {COUNTRIES_ALLOWED.map(c => (
                                <option key={c.code} value={c.dial}>
                                    {c.code} {c.dial}
                                </option>
                            ))}
                        </select>
                        <input
                            value={form.phone}
                            onChange={(e) => {
                            const rules = getPhoneRules(form.country || 'LK');
                            const digits = onlyDigits(e.target.value);
                            const clipped = digits.slice(0, rules.localMax);
                            setForm((f) => ({ ...f, phone: clipped }));
                            setFerr((er) => ({ ...er, phone: "" }));
                            }}
                            inputMode="numeric"
                            maxLength={getPhoneRules(form.country || 'LK').localMax}
                            className="flex-1 border rounded-lg px-3 py-2 text-sm"
                            placeholder={getPhoneRules(form.country || 'LK').placeholder}
                        />
                        </div>
                        {ferr.phone ? <p className="text-sm text-red-600 mt-1">{ferr.phone}</p> : null}
                        <p className="text-xs text-gray-500 mt-1">
                        {form.phoneCode || ""} {form.phone}
                        </p>
                    </div>

                    {/* Requests */}
                    <div>
                        <label className="block text-sm text-gray-700 mb-1">Special requests (optional)</label>
                        <textarea
                        rows={3}
                        value={form.requests}
                        onChange={(e) => setForm((f) => ({ ...f, requests: e.target.value }))}
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                        placeholder="Any special requests?"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2">
                        <button
                        type="button"
                        onClick={cancelEdit}
                        className="rounded-full border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100 transition"
                        >
                        Cancel
                        </button>
                        <button
                        type="button"
                        onClick={saveEdit}
                        disabled={saving}
                        className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                            saving ? "bg-gray-400 text-white" : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                        >
                        {saving ? "Saving…" : "Save changes"}
                        </button>
                    </div>
                    </div>
                )}
                </div>
            </div>

            {/* Right: payment summary */}
            <aside className="space-y-6">
                <div className="rounded-2xl border p-4">
                <h2 className="text-lg font-semibold mb-3">Price summary</h2>
                <dl className="text-sm space-y-2">
                    <div className="flex justify-between">
                    <dt className="text-gray-600">Original price</dt>
                    <dd className="font-medium">{fmtMoney(p.subtotal)}</dd>
                    </div>
                    <div className="flex justify-between">
                    <dt className="text-gray-600">10% Service charge</dt>
                    <dd className="font-medium">{fmtMoney(p.svc)}</dd>
                    </div>
                    <div className="flex justify-between">
                    <dt className="text-gray-600">1% City tax</dt>
                    <dd className="font-medium">{fmtMoney(p.city)}</dd>
                    </div>
                </dl>
                <div className="mt-4 rounded-xl bg-blue-50 p-4">
                    <div className="text-sm text-gray-600">Total</div>
                    <div className="text-2xl font-bold">{fmtMoney(p.total)}</div>
                    <div className="text-xs text-gray-500 mt-1">
                    Includes taxes & charges • {p.qty} × {fmtMoney(p.price)}
                    </div>
                </div>
                </div>

                <div className="rounded-2xl border p-4">
                <h2 className="text-lg font-semibold mb-3">Payment method</h2>
                <div className="text-sm">
                    <div className="flex justify-between">
                    <span className="text-gray-600">Card</span>
                    <span className="font-medium">{(pay.brand || "card").toUpperCase()} •••• {pay.last4 || "••••"}</span>
                    </div>
                    <div className="flex justify-between mt-1">
                    <span className="text-gray-600">Expiry</span>
                    <span className="font-medium">
                        {pay.expMonth?.toString().padStart(2, "0")}/{(pay.expYear || "").toString().slice(-2)}
                    </span>
                    </div>
                </div>
                </div>

                <div className="rounded-2xl border p-4 flex items-center justify-between print:hidden">
                <Link to="/">
                    <button className="rounded-full border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100 transition">
                    Continue browsing
                    </button>
                </Link>
                <Link to="/user-profile">
                    <button className="rounded-full border border-gray-900 px-4 py-2 text-sm font-medium hover:bg-gray-900 hover:text-white transition">
                    View in profile
                    </button>
                </Link>
                </div>
            </aside>
            </div>
        </div>
        </div>
    );
}
