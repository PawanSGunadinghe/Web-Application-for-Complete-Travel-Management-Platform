//payment page

// src/Pages/Customer/CheckoutConfirm.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams, Link } from "react-router-dom";

/* ---------------- Draft helpers (same key as step 1) ---------------- */
const DRAFT_KEY = "checkout_draft_v1";
const loadDraft = () => {
    try {
        const s = sessionStorage.getItem(DRAFT_KEY);
        return s ? JSON.parse(s) : null;
    } catch {
        return null;
    }
    };
    const saveDraft = (patch) => {
    const cur = loadDraft() || {};
    const next = { ...cur, ...patch };
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(next));
    };
    const clearDraft = () => sessionStorage.removeItem(DRAFT_KEY);

    /* ---------------- Small helpers ---------------- */
    const DIGITS = (s) => String(s || "").replace(/\D/g, "");

    // group as 4-4-4-4 visually

    function formatPan16(d) {
    const g = DIGITS(d).slice(0, 16);
    return g.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
    }

    // returns {mm, yy, year, okBasic}

    function parseExpiry(v) {
    const clean = v.replace(/[^\d/]/g, "");
    if (!/^\d{2}\/\d{2}$/.test(clean)) return { okBasic: false };
    const [mmStr, yyStr] = clean.split("/");
    const mm = +mmStr;
    const yy = +yyStr;
    const year = 2000 + yy;
    return { mm, yy, year, okBasic: mm >= 1 && mm <= 12 };
    }

    // expiry of card: current month (inclusive) .. current month + 10 years (inclusive)

    function isExpiryInAllowedWindow(mm, year, now = new Date()) {
    const curY = now.getFullYear();
    const curM = now.getMonth() + 1; // 1..12
    const maxY = curY + 10;
    const maxM = curM;

    // too far in past?
    if (year < curY || (year === curY && mm < curM)) return false;
    // too far in future?
    if (year > maxY || (year === maxY && mm > maxM)) return false;

    return true;
    }

    /* Component */
    export default function CheckoutConfirm() {
    const navigate = useNavigate();
    const location = useLocation();
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

    // draft from step 1
    const [draft, setDraft] = useState(null);

    // card form
    const [card, setCard] = useState({
        name: "",         
        number: "",       // digits only, 16
        expiry: "",       // MM/YY with window rules
        cvc: "",          // 3 or 4 digits
        saveCard: false,
        marketingOptIn: false,
    });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    // Load draft (or fallback to router state) and package snapshot
    useEffect(() => {
        const d = loadDraft();
        if (!d || !d.form || !d.pricing || !d.packageId) {
        // try router state fallback
        if (location.state?.form && location.state?.pricing && packageId) {
            const fallback = { form: location.state.form, pricing: location.state.pricing, packageId };
            setDraft(fallback);
            saveDraft(fallback);
        } else {
            // no data—send back to step 1
            navigate(`/checkout?packageId=${packageId || ""}&qty=${qtyParam || 1}`);
            return;
        }
        } else {
        setDraft(d);
        }
    }, [location.state, navigate, packageId, qtyParam]);

    useEffect(() => {
        // If we have a snapshot from step 1, use it; else fetch
        const d = loadDraft();
        const snapshot = d?.pkgSnapshot;
        if (snapshot?._id) {
        setPkg(snapshot);
        setLoading(false);
        return;
        }
        if (!packageId) {
        setErr("Missing packageId");
        setLoading(false);
        return;
        }
        setLoading(true);
        fetch(`${baseUrl}/packages/${packageId}`, { credentials: "include" })
        .then(async (r) => {
            const data = await r.json();
            if (!r.ok) throw new Error(data?.error || "Failed to load package");
            return data;
        })
        .then((data) => setPkg(data))
        .catch((e) => setErr(e.message || "Something went wrong"))
        .finally(() => setLoading(false));
    }, [baseUrl, packageId]);

    // Restore card fields that might be in the draft
    useEffect(() => {
        const d = loadDraft();
        if (d?.card) setCard(d.card);
    }, []);

    // Keep draft updated when card changes
    useEffect(() => {
        saveDraft({ card });
    }, [card]);

    const images = Array.isArray(pkg?.imageUrls) ? pkg.imageUrls : [];
    const imageSrc = (u) => (u?.startsWith("http") ? u : u ? `${fileBase}${u}` : "");
    const fmtDate = (d) =>
        d ? new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";

    // Pull pricing from the draft
    const qty = draft?.pricing?.qty || qtyParam;
    const price = Number(draft?.pricing?.price || 0);
    const subtotal = Number(draft?.pricing?.subtotal || 0);
    const svc = Number(draft?.pricing?.svc || 0);
    const city = Number(draft?.pricing?.city || 0);
    const taxes = Number(draft?.pricing?.taxes || 0);
    const total = Number(draft?.pricing?.total || 0);

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

    if (err || !pkg || !draft) {
        return (
        <div className="min-h-screen bg-white">
            <div className="max-w-3xl mx-auto p-6">
            <div className={`mb-6 ${err ? "text-red-600" : "text-gray-700"}`}>{err || "Missing checkout data."}</div>
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

    /* ---------- UI ---------- */
    const nights = (() => {
        const s = pkg?.startDate ? new Date(pkg.startDate) : null;
        const e = pkg?.endDate ? new Date(pkg.endDate) : null;
        if (!s || !e) return 0;
        return Math.max(0, Math.round((e - s) / (1000 * 60 * 60 * 24)));
    })();

    // Display versions (but state keeps raw digits for number)
    const numberPretty = formatPan16(card.number);

    /* ---------- Input guards ---------- */
    const onNumberKeyDown = (e) => {
        const allowed = [
        "Backspace", "Delete", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
        "Home", "End", "Tab",
        ];
        if (allowed.includes(e.key)) return;

        if (!/^\d$/.test(e.key)) {
        e.preventDefault();
        return;
        }

        // freeze at 16 digits (ignore spaces in display)
        if (DIGITS(card.number).length >= 16) {
        // allow if user is replacing a selection that spans at least 1 digit
        const el = e.target;
        const hasSel = el.selectionStart !== el.selectionEnd;
        if (!hasSel) e.preventDefault();
        }
    };

    const onNumberChange = (e) => {
        const digits = DIGITS(e.target.value).slice(0, 16);
        setCard((c) => ({ ...c, number: digits }));
        setErrors((er) => ({ ...er, number: "" }));
    };

    const onNumberPaste = (e) => {
        e.preventDefault();
        const digits = DIGITS((e.clipboardData || window.clipboardData).getData("text")).slice(0, 16);
        setCard((c) => ({ ...c, number: digits }));
        setErrors((er) => ({ ...er, number: "" }));
    };

    const onExpiryKeyDown = (e) => {
        const allowed = [
        "Backspace", "Delete", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
        "Home", "End", "Tab",
        ];
        if (allowed.includes(e.key)) return;
        if (e.key === "/") return;

        if (!/^\d$/.test(e.key)) {
        e.preventDefault();
        return;
        }

        // freeze length at 5 (MM/YY)
        const el = e.target;
        const hasSel = el.selectionStart !== el.selectionEnd;
        if (!hasSel && (card.expiry || "").length >= 5) e.preventDefault();
    };

    const onExpiryChange = (e) => {
        let v = e.target.value.replace(/[^\d/]/g, "");

        // Auto-insert slash
        if (v.length === 2 && !v.includes("/")) v = v + "/";
        if (v.length > 5) v = v.slice(0, 5);

        setCard((c) => ({ ...c, expiry: v }));

        // live validation for window
        const parsed = parseExpiry(v);
        if (!parsed.okBasic) {
        setErrors((er) => ({ ...er, expiry: v.length > 0 && v.length < 5 ? "" : "Use MM/YY" }));
        return;
        }
        const { mm, year } = parsed;
        if (!isExpiryInAllowedWindow(mm, year)) {
        setErrors((er) => ({
            ...er,
            expiry: "Expiry must be this month or up to 10 years ahead",
        }));
        } else {
        setErrors((er) => ({ ...er, expiry: "" }));
        }
    };

    const onExpiryPaste = (e) => {
        e.preventDefault();
        let text = (e.clipboardData || window.clipboardData).getData("text") || "";
        text = text.replace(/[^\d]/g, "").slice(0, 4); // MMYY
        if (text.length >= 3) text = `${text.slice(0, 2)}/${text.slice(2, 4)}`;
        setCard((c) => ({ ...c, expiry: text }));
    };

    const onCvcKeyDown = (e) => {
        const allowed = [
        "Backspace", "Delete", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
        "Home", "End", "Tab",
        ];
        if (allowed.includes(e.key)) return;
        if (!/^\d$/.test(e.key)) {
        e.preventDefault();
        return;
        }
        const el = e.target;
        const hasSel = el.selectionStart !== el.selectionEnd;
        if (!hasSel && (card.cvc || "").length >= 4) e.preventDefault(); // freeze at 4
    };

    const onCvcChange = (e) => {
        const v = DIGITS(e.target.value).slice(0, 4);
        setCard((c) => ({ ...c, cvc: v }));
        setErrors((er) => ({ ...er, cvc: "" }));
    };

    const onCvcPaste = (e) => {
        e.preventDefault();
        const v = DIGITS((e.clipboardData || window.clipboardData).getData("text")).slice(0, 4);
        setCard((c) => ({ ...c, cvc: v }));
        setErrors((er) => ({ ...er, cvc: "" }));
    };

    /* ---------- Submit with only your requested rules ---------- */
    const onSubmit = async (e) => {
        e.preventDefault();
        const errs = {};

        // 1) Card number = exactly 16 digits
        const pan = DIGITS(card.number);
        if (pan.length !== 16) errs.number = "Card number must be 16 digits";

        // 2) Expiry in allowed window (>= current month, <= +10 years)
        const parsed = parseExpiry(card.expiry);
        if (!parsed.okBasic) {
        errs.expiry = "Use MM/YY";
        } else if (!isExpiryInAllowedWindow(parsed.mm, parsed.year)) {
        errs.expiry = "Expiry must be this month or up to 10 years ahead";
        }

        // 3) CVC is 3 or 4 digits
        if (!/^\d{3,4}$/.test(card.cvc)) {
        errs.cvc = "CVC must be 3 or 4 digits";
        }

        if (Object.keys(errs).length) {
        setErrors(errs);
        return;
        }

        try {
        setSubmitting(true);
        setErrors({});

        const [mm, yy] = card.expiry.split("/");
        const payload = {
            packageId,
            qty: draft.pricing.qty || qtyParam,
            customer: draft.form,   // step-1 form data
            pricing: draft.pricing, // server should recompute/validate too
            payment: {
            brand: "unknown",
            last4: pan.slice(-4),
            expMonth: +mm,
            expYear: 2000 + (+yy),
            saveCard: !!card.saveCard,
            marketingOptIn: !!card.marketingOptIn,
            },
        };

        const resp = await fetch(`${baseUrl}/bookings`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) {
            setErrors(prev => ({ ...prev, ...(data?.errors || {}), global: data?.error || `Server error (${resp.status})` }));
            return;
        }

        sessionStorage.removeItem(DRAFT_KEY);
        navigate(`/checkout/success?id=${data.id}`);
        } catch (e2) {
        console.error(e2);
        setErrors(prev => ({ ...prev, global: e2.message || "Network error" }));
        } finally {
        setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-white text-gray-900">
        <div className="max-w-6xl mx-auto px-4 md:px-8 pt-6 pb-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                    <dd className="font-medium">
                    {subtotal.toLocaleString(undefined, { style: "currency", currency: "USD" })}
                    </dd>
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
                    Includes taxes & charges • {qty} ×{" "}
                    {price.toLocaleString(undefined, { style: "currency", currency: "USD" })}
                </div>
                </div>
            </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="lg:col-span-2 space-y-6">
            {/* Pay when you stay (info box) */}
            <div className="rounded-2xl border p-4">
                <h3 className="font-semibold mb-2">Pay when you stay</h3>
                <p className="text-sm text-gray-700">
                The property will handle payment. The date you’ll be charged depends on your booking conditions.
                </p>
                <div className="mt-3 text-sm text-gray-600 flex items-center justify-between">
                <span>The property will charge you</span>
                <span className="font-medium">
                    {total.toLocaleString(undefined, { style: "currency", currency: "USD" })}
                </span>
                </div>
            </div>

            {/* Card form */}
            <form onSubmit={onSubmit} className="rounded-2xl border p-4 space-y-4">
                <h3 className="font-semibold">Choose how to pay</h3>

                {errors.global ? (
                <div className="rounded-md bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
                    {errors.global}
                </div>
                ) : null}

                {/* Cardholder name - only letters and spaces */}
                <Field label="Cardholder's Name">
                <input
                    value={card.name}
                    onChange={(e) => {
                        const value = e.target.value.replace(/[^A-Za-z\s]/g, ''); // Only letters and spaces
                        setCard((c) => ({ ...c, name: value }));
                    }}
                    className="w-full border rounded-lg px-3 py-2"
                    autoComplete="cc-name"
                    placeholder="Name on card"
                />
                </Field>

                <Field label="Card Number" error={errors.number}>
                <input
                    value={numberPretty}
                    onKeyDown={onNumberKeyDown}
                    onPaste={onNumberPaste}
                    onChange={onNumberChange}
                    inputMode="numeric"
                    autoComplete="cc-number"
                    className="w-full border rounded-lg px-3 py-2 tracking-widest"
                    placeholder="1234 5678 9012 3456"
                    maxLength={19} // visual (16 digits + 3 spaces)
                />
                <p className="text-xs text-gray-500 mt-1">Must be exactly 16 digits.</p>
                </Field>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Expiry Date (MM/YY)" error={errors.expiry}>
                    <input
                    value={card.expiry}
                    onKeyDown={onExpiryKeyDown}
                    onPaste={onExpiryPaste}
                    onChange={onExpiryChange}
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="MM/YY"
                    maxLength={5}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                    Must be this month or up to 10 years ahead.
                    </p>
                </Field>

                <Field label="CVC" error={errors.cvc}>
                    <input
                    value={card.cvc}
                    onKeyDown={onCvcKeyDown}
                    onPaste={onCvcPaste}
                    onChange={onCvcChange}
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="3 or 4 digits"
                    maxLength={4}
                    />
                </Field>
                </div>

                <label className="flex items-center gap-2 text-sm">
                <input
                    type="checkbox"
                    checked={card.saveCard}
                    onChange={(e) => setCard((c) => ({ ...c, saveCard: e.target.checked }))}
                />
                Save card for future purchases
                </label>

                <label className="flex items-center gap-2 text-xs text-gray-600">
                <input
                    type="checkbox"
                    checked={card.marketingOptIn}
                    onChange={(e) => setCard((c) => ({ ...c, marketingOptIn: e.target.checked }))}
                />
                I agree to receive marketing emails (optional).
                </label>

                <div className="flex items-center justify-end pt-2">
                <button
                    type="submit"
                    disabled={submitting}
                    className={`rounded-full px-6 py-2 text-sm font-medium transition ${
                    submitting ? "bg-gray-400 text-white" : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                >
                    {submitting ? "Processing…" : "Complete booking"}
                </button>
                </div>
            </form>
            </div>
        </div>
        </div>
    );
    }

    function Field({ label, error, children }) {
    return (
        <div>
        <label className="block text-sm text-gray-700 mb-1">{label}</label>
        {children}
        {error ? <p className="text-sm text-red-600 mt-1">{error}</p> : null}
        </div>
    );
}
