//booking form

// src/Pages/Customer/CheckoutDetails.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";

// Validation email structure
const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

function onlyDigits(v) {
    return String(v || "").replace(/\D/g, "");
    }

    //phone num validation
    const PHONE_RULES = {
    LK: { localMin: 9, localMax: 9, placeholder: "07XXXXXXX" }, // Sri Lanka (you requested 9 digits)
    IN: { localMin: 10, localMax: 10, placeholder: "9XXXXXXXXX" },  // India
    US: { localMin: 10, localMax: 10, placeholder: "2015550123" },  // United States
    CA: { localMin: 10, localMax: 10, placeholder: "4165550123" },  // Canada
    SG: { localMin: 8,  localMax: 8,  placeholder: "81234567" },    // Singapore
    AE: { localMin: 9,  localMax: 9,  placeholder: "512345678" },   // UAE
    JP: { localMin: 10, localMax: 11, placeholder: "09012345678" }, // Japan
    CN: { localMin: 11, localMax: 11, placeholder: "13800138000" }, // China
    };


    //get phone rules
    function getPhoneRules(code, phoneCode) {
    const r = PHONE_RULES[code];
    if (r) return r;
    const dialDigits = onlyDigits(phoneCode);
    const localMax = Math.max(6, 15 - dialDigits);
    return { localMin: 6, localMax, placeholder: "Phone number" };
    }

   
     //*dropdown list 
     
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
    { code: "PH", name: "Philippines", dial: "+63" },
    { code: "IT", name: "Italy", dial: "+39" },
    { code: "ES", name: "Spain", dial: "+34" },
    { code: "NL", name: "Netherlands", dial: "+31" },
    { code: "SE", name: "Sweden", dial: "+46" },
    { code: "CH", name: "Switzerland", dial: "+41" },
    { code: "NO", name: "Norway", dial: "+47" },
    { code: "DK", name: "Denmark", dial: "+45" },
    { code: "IE", name: "Ireland", dial: "+353" },
    { code: "SA", name: "Saudi Arabia", dial: "+966" },
    { code: "QA", name: "Qatar", dial: "+974" },
    { code: "KW", name: "Kuwait", dial: "+965" },
    { code: "BH", name: "Bahrain", dial: "+973" },
    { code: "OM", name: "Oman", dial: "+968" },
    
    ];

    export default function CheckoutDetails() {
    const navigate = useNavigate();
    const [search] = useSearchParams();
    const packageId = search.get("packageId");
    const qtyParam = Number(search.get("qty") || 1);

    const baseUrl = useMemo(
        () => process.env.REACT_APP_API_URL || "http://localhost:4000/api",
        []
    );
    const apiBase = process.env.REACT_APP_API_URL || "http://localhost:4000/api";
    const fileBase = apiBase.replace(/\/api\/?$/, "");

    const [pkg, setPkg] = useState(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    // quantity (adults)
    const [qty, setQty] = useState(Math.max(1, qtyParam));

    // form
    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        country: "LK",   // country CODE
        phoneCode: "+94",// dialing code (auto-syncs with country)
        phone: "",
        paperless: true,
        bookingFor: "me", // "me" | "someone"
        workTrip: "no",   // "yes" | "no"
        requests: "",
        acceptRules: false,
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        let live = true;
        setLoading(true);
        setErr("");

        if (!packageId) {
        setErr("Missing packageId.");
        setLoading(false);
        return;
        }

        fetch(`${baseUrl}/packages/${packageId}`, { credentials: "include" })
        .then(async (r) => {
            const data = await r.json();
            if (!r.ok) throw new Error(data?.error || "Failed to load package");
            return data;
        })
        .then((data) => {
            if (!live) return;
            setPkg(data);
            setQty((q) => Math.min(Math.max(1, q), Number(data.maxTourist || 10)));
        })
        .catch((e) => {
            if (!live) return;
            console.error(e);
            setErr(e.message || "Something went wrong");
        })
        .finally(() => live && setLoading(false));

        return () => { live = false; };
    }, [baseUrl, packageId]);

    const imageSrc = (u) => (u?.startsWith("http") ? u : (u ? `${fileBase}${u}` : ""));

    const fmtDate = (d) =>
        d ? new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";

    // price calculation: subtotal + 10% service + 1% city tax
    const price = Number(pkg?.price || 0);
    const subtotal = price * qty;
    const svc = subtotal * 0.10;
    const city = subtotal * 0.01;
    const taxes = svc + city;
    const total = subtotal + taxes;

    //calculate no of nights
    const nights = (() => {
        const s = pkg?.startDate ? new Date(pkg.startDate) : null;
        const e = pkg?.endDate ? new Date(pkg.endDate) : null;
        if (!s || !e) return 0;
        return Math.max(0, Math.round((e - s) / (1000 * 60 * 60 * 24)));
    })();

    // validation
    const validate = () => {
        const next = {};

        if (!form.firstName.trim()) next.firstName = "Required";
        else if (/\d/.test(form.firstName)) next.firstName = "First name cannot contain numbers";
        
        if (!form.lastName.trim()) next.lastName = "Required";
        else if (/\d/.test(form.lastName)) next.lastName = "Last name cannot contain numbers";

        const email = form.email.trim();
        if (!email.includes("@")) {
        next.email = "Email must contain @";
        } else if (!EMAIL_RX.test(email)) {
        next.email = "Enter a valid email address";
        } else if (email !== email.toLowerCase()) {
        next.email = "Email must be in lowercase letters only";
        }

        const country = COUNTRIES_ALLOWED.find(c => c.code === form.country);
        if (!country) {
        next.country = "Select a valid country";
        }

        const rules = getPhoneRules(form.country, form.phoneCode);
        const digits = onlyDigits(form.phone);
        if (digits.length < rules.localMin || digits.length > rules.localMax) {
        const range =
            rules.localMin === rules.localMax
            ? `${rules.localMax} digits`
            : `${rules.localMin}-${rules.localMax} digits`;
        next.phone = `Enter a valid ${range} number for the selected country`;
        }

        if (!form.acceptRules) {
        next.acceptRules = "You must accept the house rules to continue";
        }

        return next;
    };

    const DRAFT_KEY = "checkout_draft_v1";
    
    // Restore any previous draft for this packageId
    useEffect(() => {
        try {
        const raw = sessionStorage.getItem(DRAFT_KEY);
        if (!raw) return;
        const d = JSON.parse(raw);

        // Only restore if it matches the same package being booked
        if (d.packageId !== packageId) return;

        if (d.form) setForm(d.form);
        // keep qty within a sane range; if we don't know max yet, clamp at >=1
        if (d.pricing?.qty) setQty(Math.max(1, Number(d.pricing.qty)));
        } catch (e) {
        console.warn("Failed to restore checkout draft:", e);
        }
    }, [packageId]);

    const saveDraft = (draft) => sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));

    const onFinalDetails = (e) => {
        e.preventDefault();
        const next = validate();
        setErrors(next);
        if (Object.keys(next).length) return;

        const pricing = { subtotal, svc, city, taxes, total, price, qty };

        // (optional) persist draft so step 2 survives refresh/back
        saveDraft({
        packageId,
        form,
        pricing,
        pkgSnapshot: {
            _id: pkg._id,
            name: pkg.name,
            imageUrls: pkg.imageUrls,
            startDate: pkg.startDate,
            endDate: pkg.endDate,
            maxTourist: pkg.maxTourist,
        },
        });

        // proceed to step 2
        navigate(`/checkout/confirm?packageId=${packageId}&qty=${qty}`, {
        state: {
            form,
            pricing: { subtotal, svc, city, taxes, total, price, qty },
        },
        });
    };

    if (loading) {
        return (
        <div className="min-h-screen bg-white">
            <div className="max-w-6xl mx-auto p-6">
            <div className="h-6 w-48 bg-gray-200 animate-pulse rounded mb-4" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                <div className="h-56 bg-gray-200 animate-pulse rounded-2xl" />
                <div className="h-56 bg-gray-100 animate-pulse rounded-2xl" />
                </div>
                <div className="h-56 bg-gray-100 animate-pulse rounded-2xl" />
            </div>
            </div>
        </div>
        );
    }

    if (err || !pkg) {
        return (
        <div className="min-h-screen bg-white">
            <div className="max-w-3xl mx-auto p-6">
            <div className={`mb-6 ${err ? "text-red-600" : "text-gray-700"}`}>{err || "Package not found."}</div>
            <button
                onClick={() => window.history.back()}
                className="rounded-full border border-gray-900 px-5 py-2 text-sm hover:bg-gray-900 hover:text-white transition"
            >
                ← Back
            </button>
            </div>
        </div>
        );
    }

    const images = Array.isArray(pkg.imageUrls) ? pkg.imageUrls : [];

    // Helpers for phone input “freeze” UX
    const phoneRules = getPhoneRules(form.country, form.phoneCode);
    const phoneValue = form.phone;
    const phoneDigitsLen = onlyDigits(phoneValue).length;

    const handlePhoneKeyDown = (e) => {
        // Allow control keys
        const allowedKeys = [
        "Backspace", "Delete", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
        "Home", "End", "Tab",
        ];
        if (allowedKeys.includes(e.key)) return;

        // Block any non-digit key
        if (!/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        return;
        }

        // If at max and not replacing selection, block further digits (freeze)
        const el = e.target;
        const hasSelection = el.selectionStart !== el.selectionEnd;
        if (!hasSelection && phoneDigitsLen >= phoneRules.localMax) {
        e.preventDefault();
        }
    };

    const handlePhonePaste = (e) => {
        e.preventDefault();
        const pasted = (e.clipboardData || window.clipboardData).getData("text");
        const digits = onlyDigits(pasted);
        const clipped = digits.slice(0, phoneRules.localMax);
        setForm(f => ({ ...f, phone: clipped }));
        setErrors(er => ({ ...er, phone: "" }));
    };

    return (
        <div className="min-h-screen bg-white text-gray-900">
        {/* stepper */}
        <div className="max-w-6xl mx-auto px-4 md:px-8 pt-6 items-center">
            <ol className="flex items-center gap-6 text-sm">
            <li className="flex items-center gap-2">
                <span className="h-6 w-6 grid place-items-center rounded-full bg-black text-white text-xs">1</span>
                <span>Your selection</span>
            </li>
            <li className="flex items-center gap-2">
                <span className="h-6 w-6 grid place-items-center rounded-full bg-blue-600 text-white text-xs">2</span>
                <span>Your details</span>
            </li>
            <li className="flex items-center gap-2 text-gray-400">
                <span className="h-6 w-6 grid place-items-center rounded-full border border-gray-300 text-xs">3</span>
                <span>Finish booking</span>
            </li>
            </ol>
        </div>

        <div className="max-w-6xl mx-auto px-4 md:px-8 pb-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
            {/* LEFT COLUMN */}
            <div className="lg:col-span-1 space-y-6">
                {/* property card */}
                <div className="rounded-2xl border p-4">
                <div className="flex gap-4">
                    <img
                    src={images[0] ? imageSrc(images[0]) : "https://via.placeholder.com/160x120?text=No+Image"}
                    alt={pkg.name}
                    className="h-28 w-36 object-cover rounded"
                    />
                    <div className="min-w-0">
                    <div className="text-lg font-semibold truncate">{pkg.name || "Property"}</div>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-700">
                        <span>📶 Free Wi-Fi</span>
                        <span>🚐 Airport shuttle</span>
                        <span>🅿️ Parking</span>
                        <span>🍽️ Restaurant</span>
                    </div>
                    </div>
                </div>
                </div>

                {/* booking details */}
                <div className="rounded-2xl border p-4">
                <h3 className="font-semibold mb-3">Your booking details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                    <div className="text-gray-500">Check-in</div>
                    <div className="font-medium">{fmtDate(pkg.startDate)}</div>
                    </div>
                    <div>
                    <div className="text-gray-500">Check-out</div>
                    <div className="font-medium">{fmtDate(pkg.endDate)}</div>
                    </div>
                </div>

                <div className="mt-3 text-sm">
                    <div className="text-gray-500">You selected</div>
                    <div className="font-medium">
                    {nights || "—"} {nights === 1 ? "night" : "nights"}, {qty} {qty === 1 ? "adult" : "adults"}
                    </div>
                </div>

                <div className="mt-2">
                    <Link to={`/packages/${pkg._id}`} className="text-blue-600 text-sm hover:underline">
                    Change your selection
                    </Link>
                </div>
                </div>

                {/* price summary */}
                <div className="rounded-2xl border p-4">
                <h3 className="font-semibold mb-3">Your price summary</h3>
                <dl className="text-sm space-y-2">
                    <div className="flex justify-between">
                    <dt className="text-gray-600">Original price</dt>
                    <dd className="font-medium">{subtotal.toLocaleString(undefined, { style: "currency", currency: "USD" })}</dd>
                    </div>
                    <div className="flex justify-between">
                    <dt className="text-gray-600">10% Service charge</dt>
                    <dd className="font-medium">{svc.toLocaleString(undefined, { style: "currency", currency: "USD" })}</dd>
                    </div>
                    <div className="flex justify-between">
                    <dt className="text-gray-600">1% City tax</dt>
                    <dd className="font-medium">{city.toLocaleString(undefined, { style: "currency", currency: "USD" })}</dd>
                    </div>
                </dl>

                <div className="mt-4 rounded-xl bg-blue-50 p-4">
                    <div className="text-sm text-gray-600">Price</div>
                    <div className="text-2xl font-bold">
                    {total.toLocaleString(undefined, { style: "currency", currency: "USD" })}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                    Includes taxes & charges • {qty} × {price.toLocaleString(undefined, { style: "currency", currency: "USD" })}
                    </div>
                </div>

                <div className="mt-3 text-xs text-gray-600">
                    This is an approximate price. You’ll pay in your selected currency.
                </div>
                </div>
            </div>

            {/* RIGHT COLUMN (FORM) */}
            <div className="lg:col-span-2">
                <form onSubmit={onFinalDetails} className="rounded-2xl border p-4 space-y-6">
                <div className="rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-700">
                    Almost done! Just fill in the * required info
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Field label="First name *" error={errors.firstName}>
                    <input
                        value={form.firstName}
                        onChange={(e) => {
                        const value = e.target.value.replace(/[^A-Za-z\s]/g, ''); // Only letters and spaces
                        setForm((f) => ({ ...f, firstName: value }));
                        setErrors((er) => ({ ...er, firstName: "" }));
                        }}
                        className="w-full border rounded-lg px-3 py-2"
                        placeholder="Enter first name"
                    />
                    </Field>

                    <Field label="Last name *" error={errors.lastName}>
                    <input
                        value={form.lastName}
                        onChange={(e) => {
                        const value = e.target.value.replace(/[^A-Za-z\s]/g, ''); // Only letters and spaces
                        setForm((f) => ({ ...f, lastName: value }));
                        setErrors((er) => ({ ...er, lastName: "" }));
                        }}
                        className="w-full border rounded-lg px-3 py-2"
                        placeholder="Enter last name"
                    />
                    </Field>

                    <Field label="Email address *" error={errors.email} full>
                    <input
                        type="email"
                        value={form.email}
                        onChange={(e) => {
                        const lowercaseEmail = e.target.value.toLowerCase();
                        setForm((f) => ({ ...f, email: lowercaseEmail }));
                        setErrors((er) => ({ ...er, email: "" }));
                        }}
                        className="w-full border rounded-lg px-3 py-2"
                        placeholder="name@example.com"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Confirmation email goes to this address
                    </p>
                    </Field>

                    <Field label="Country/region" error={errors.country} full>
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
                        className="w-full border rounded-lg px-3 py-2"
                    >
                        {COUNTRIES_ALLOWED.map((c) => (
                        <option key={c.code} value={c.code}>{c.name}</option>
                        ))}
                    </select>
                    </Field>

                    <Field label="Phone number *" error={errors.phone} full>
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
                        className="border rounded-lg px-3 py-2 w-44"
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
                        onKeyDown={handlePhoneKeyDown}
                        onPaste={handlePhonePaste}
                        onChange={(e) => {
                            const rules = getPhoneRules(form.country, form.phoneCode);
                            const digits = onlyDigits(e.target.value);
                            const clipped = digits.slice(0, rules.localMax);
                            setForm(f => ({ ...f, phone: clipped }));
                            setErrors(er => ({ ...er, phone: "" }));
                        }}
                        maxLength={phoneRules.localMax} // extra guard for character count
                        className="flex-1 border rounded-lg px-3 py-2"
                        placeholder={phoneRules.placeholder}
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        We’ll use this to verify your booking, and for the property to contact you if needed.
                    </p>
                    </Field>

                    <div className="md:col-span-2">
                    <label className="inline-flex items-center gap-2 text-sm">
                        <input
                        type="checkbox"
                        checked={form.paperless}
                        onChange={(e) => setForm((f) => ({ ...f, paperless: e.target.checked }))}
                        />
                        Yes, I’d like free paperless confirmation (recommended)
                    </label>
                    </div>

                    <div className="md:col-span-2">
                    <div className="text-sm font-medium mb-1">Who are you booking for? (optional)</div>
                    <div className="flex gap-6 text-sm">
                        <label className="inline-flex items-center gap-2">
                        <input
                            type="radio"
                            name="bookingFor"
                            checked={form.bookingFor === "me"}
                            onChange={() => setForm((f) => ({ ...f, bookingFor: "me" }))}
                        />
                        I am the main guest
                        </label>
                        <label className="inline-flex items-center gap-2">
                        <input
                            type="radio"
                            name="bookingFor"
                            checked={form.bookingFor === "someone"}
                            onChange={() => setForm((f) => ({ ...f, bookingFor: "someone" }))}
                        />
                        Booking is for someone else
                        </label>
                    </div>
                    </div>

                    <div className="md:col-span-2">
                    <div className="text-sm font-medium mb-1">Are you travelling for work? (optional)</div>
                    <div className="flex gap-6 text-sm">
                        <label className="inline-flex items-center gap-2">
                        <input
                            type="radio"
                            name="workTrip"
                            checked={form.workTrip === "yes"}
                            onChange={() => setForm((f) => ({ ...f, workTrip: "yes" }))}
                        />
                        Yes
                        </label>
                        <label className="inline-flex items-center gap-2">
                        <input
                            type="radio"
                            name="workTrip"
                            checked={form.workTrip === "no"}
                            onChange={() => setForm((f) => ({ ...f, workTrip: "no" }))}
                        />
                        No
                        </label>
                    </div>
                    </div>

                    <Field label="Special requests (optional)" full>
                    <textarea
                        rows={4}
                        value={form.requests}
                        onChange={(e) => setForm((f) => ({ ...f, requests: e.target.value }))}
                        className="w-full border rounded-lg px-3 py-2"
                        placeholder="Please write your requests in English."
                    />
                    </Field>

                    <div className="md:col-span-2">
                    <div className="text-sm font-medium mb-1">Review house rules</div>
                    <ul className="text-sm text-gray-700 list-disc pl-5">
                        <li>No pets allowed.</li>
                    </ul>
                  
                    {/*check box*/}
                    
                    <label className="mt-2 inline-flex items-center gap-2 text-sm">
                        <input
                        type="checkbox"
                        checked={form.acceptRules}
                        onChange={(e) => {
                            setForm((f) => ({ ...f, acceptRules: e.target.checked }));
                            setErrors((er) => ({ ...er, acceptRules: "" }));
                        }}
                        />
                        By continuing to the next step, you agree to these house rules.
                    </label>
                    {errors.acceptRules ? <p className="text-sm text-red-600 mt-1">{errors.acceptRules}</p> : null}
                    </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                    <div className="text-sm text-gray-600 flex items-center gap-2">
                    <span>💬 We Price Match</span>
                    </div>
                    <button
                    type="submit"
                    className="rounded-full bg-black text-white px-6 py-2 text-sm font-medium hover:bg-indigo-900 transition"
                    >
                    Final details
                    </button>
                </div>
                </form>
            </div>
            </div>
        </div>
        </div>
    );
    }

    function Field({ label, error, full = false, children }) {
    return (
        <div className={full ? "md:col-span-2" : ""}>
        <label className="block text-sm text-gray-700 mb-1">{label}</label>
        {children}
        {error ? <p className="text-sm text-red-600 mt-1">{error}</p> : null}
        </div>
    );
}
