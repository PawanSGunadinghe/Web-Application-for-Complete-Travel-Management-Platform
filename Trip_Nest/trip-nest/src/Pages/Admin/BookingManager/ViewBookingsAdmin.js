//view booking package details admin

// src/Pages/Customer/CheckoutSuccess.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate, Link, useParams, useLocation } from "react-router-dom";

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const onlyDigits = (s) => String(s || "").replace(/\D/g, "");

export default function CheckoutSuccess() {
        const [search] = useSearchParams();
        const params = useParams();
        const location = useLocation();
        const navigate = useNavigate();
        
        // Accept id from multiple places
        const id =
        search.get("id") ||                         // /checkout-success?id=...
        search.get("bookingId") ||                  // /checkout-success?bookingId=...
        params.id ||                                // /checkout-success/:id
        location.state?.bookingId ||                // navigate('/checkout-success', { state: { bookingId } })
        "";

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
    const [form, setForm] = useState({ email: "", phone: "", requests: "" });
    const [ferr, setFerr] = useState({});

    const startEdit = () => {
        const c = booking?.customer || {};
        setForm({
        email: c.email || "",
        phone: onlyDigits(c.phone || ""),
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
        const email = String(form.email || "").trim();
        if (!email.includes("@")) next.email = "Email must contain @";
        else if (!EMAIL_RX.test(email)) next.email = "Enter a valid email";

        const dialDigits = onlyDigits(booking?.customer?.phoneCode || "");
        const phoneDigits = onlyDigits(form.phone);
        const e164Len = dialDigits.length + phoneDigits.length;
        if (phoneDigits.length === 0) {
        next.phone = "Phone number is required";
        } else if (e164Len < 6 || e164Len > 15) {
        next.phone = "Enter a valid phone number (6–15 digits incl. country code)";
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
            email: form.email.trim(),
            phone: onlyDigits(form.phone),
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

    // ------ Assignment (guides & vehicles) -------------------------------------
    const [guides, setGuides] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [assignedGuideId, setAssignedGuideId] = useState("");
    const [assignedVehicleId, setAssignedVehicleId] = useState("");
    const [assignmentNotes, setAssignmentNotes] = useState("");
    const [savingAssignment, setSavingAssignment] = useState(false);
    const [assignmentMsg, setAssignmentMsg] = useState("");

    // Fetch guides, vehicles, and all bookings (regular + custom) to filter assigned ones
    useEffect(() => {
        (async () => {
            try {
                const [gRes, vRes, bRes, cRes] = await Promise.all([
                    fetch(`${apiBase}/guide-applications`, { credentials: "include" }),
                    fetch(`${apiBase}/vehicles`, { credentials: "include" }),
                    fetch(`${apiBase}/bookings/all`, { credentials: "include" }),
                    fetch(`${apiBase}/custom-packages`, { credentials: "include" })
                ]);
                const gData = await gRes.json();
                const vData = await vRes.json();
                const bData = await bRes.json();
                const cData = await cRes.json();
                
                // Get all assigned guide IDs and vehicle IDs from other bookings (regular + custom)
                const assignedGuideIds = new Set();
                const assignedVehicleIds = new Set();
                
                // From regular bookings
                if (bRes.ok && Array.isArray(bData)) {
                    bData.forEach(b => {
                        // Exclude current booking
                        if (b._id !== booking?._id) {
                            // Collect assigned guide IDs
                            if (b.assignedGuideId) {
                                assignedGuideIds.add(typeof b.assignedGuideId === 'object' ? b.assignedGuideId._id : b.assignedGuideId);
                            }
                            // Collect assigned vehicle IDs
                            if (Array.isArray(b.assignedVehicleIds)) {
                                b.assignedVehicleIds.forEach(v => {
                                    assignedVehicleIds.add(typeof v === 'object' ? v._id : v);
                                });
                            }
                        }
                    });
                }
                
                // From custom bookings
                if (cRes.ok && Array.isArray(cData)) {
                    cData.forEach(cb => {
                        // Collect assigned guide IDs
                        if (cb.assignedGuideId) {
                            assignedGuideIds.add(typeof cb.assignedGuideId === 'object' ? cb.assignedGuideId._id : cb.assignedGuideId);
                        }
                        // Collect assigned vehicle IDs
                        if (Array.isArray(cb.assignedVehicleIds)) {
                            cb.assignedVehicleIds.forEach(v => {
                                assignedVehicleIds.add(typeof v === 'object' ? v._id : v);
                            });
                        }
                    });
                }
                
                // Filter out already assigned guides
                if (gRes.ok) {
                    const allGuides = Array.isArray(gData) ? gData : gData.items || [];
                    const availableGuides = allGuides.filter(g => !assignedGuideIds.has(g._id));
                    setGuides(availableGuides);
                }
                
                // Filter out already assigned vehicles
                if (vRes.ok) {
                    const allVehicles = Array.isArray(vData) ? vData : vData.items || [];
                    const availableVehicles = allVehicles.filter(v => !assignedVehicleIds.has(v._id));
                    setVehicles(availableVehicles);
                }
            } catch (e) {
                console.error("Failed to load guides/vehicles", e);
            }
        })();
    }, [apiBase, booking?._id]);

    // Initialize assignment fields when booking loads
    useEffect(() => {
        if (booking) {
            setAssignedGuideId(booking.assignedGuideId?._id || booking.assignedGuideId || "");
            setAssignedVehicleId(booking.assignedVehicleIds?.[0]?._id || booking.assignedVehicleIds?.[0] || "");
            setAssignmentNotes(booking.assignmentNotes || "");
        }
    }, [booking]);

    const saveAssignment = async () => {
        try {
            setSavingAssignment(true);
            setAssignmentMsg("");
            const payload = {
                assignedGuideId: assignedGuideId || null,
                assignedVehicleIds: assignedVehicleId ? [assignedVehicleId] : [],
                assignmentNotes,
            };
            const r = await fetch(`${apiBase}/bookings/${booking._id}/assignment`, {
                method: "PATCH",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await r.json();
            if (!r.ok) throw new Error(data?.error || "Failed to save assignment");
            setBooking(data);
            setAssignmentMsg("Assignment saved successfully!");
            setTimeout(() => setAssignmentMsg(""), 3000);
        } catch (e) {
            setAssignmentMsg(e.message || "Failed to save assignment");
        } finally {
            setSavingAssignment(false);
        }
    };

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

    // Optional discount (if backend sends it)
    const hasDiscount = Number(p.discount || 0) > 0;
    const originalBeforeFees = Number(p.subtotal || 0);
    const discountedBeforeFees = hasDiscount ? Math.max(0, originalBeforeFees - Number(p.discount)) : originalBeforeFees;

    return (
        <div className="min-h-screen bg-white text-gray-900">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
            <div className="print:hidden">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight print:hidden">Booking confirmed 🎉</h1>
                <div className="mt-1 text-sm text-gray-600">
                Booking ID: <span className="font-mono">{booking._id || id}</span> • Created {fmtDate(booking.createdAt)}
                </div>
                {deleteErr ? (
                <div className="mt-2 text-sm text-red-600">{deleteErr}</div>
                ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
                <button
                onClick={() => window.print()}
                className="rounded-full border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100 transition print:hidden"
                >
                Print
                </button>

            </div>
            </div>

            {/* Content */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: property + dates + guest details */}
            <div className="lg:col-span-2 space-y-32">
                {/* Booking Details Section */}
                <div className="space-y-6">
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

                </div>

                {!editing ? (
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2 text-sm">
                    <div className="flex justify-between">
                        <dt className="text-gray-500">Name</dt>
                        <dd className="font-medium">
                        {c?.firstName} {c?.lastName}
                        </dd>
                    </div>
                    <div className="flex justify-between">
                        <dt className="text-gray-500">Email</dt>
                        <dd className="font-medium">{c?.email || "—"}</dd>
                    </div>
                    <div className="flex justify-between">
                        <dt className="text-gray-500">Phone</dt>
                        <dd className="font-medium">
                        {(c?.phoneCode ? `${c.phoneCode} ` : "") + (c?.phone || "—")}
                        </dd>
                    </div>
                    <div className="flex justify-between">
                        <dt className="text-gray-500">Country</dt>
                        <dd className="font-medium">{c?.country || "—"}</dd>
                    </div>
                    {c?.requests ? (
                        <div className="md:col-span-2">
                        <dt className="text-gray-500">Requests</dt>
                        <dd className="font-medium whitespace-pre-wrap">{c.requests}</dd>
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

                    {/* Phone (dial code read-only, number editable) */}
                    <div>
                        <label className="block text-sm text-gray-700 mb-1">Phone</label>
                        <div className="flex gap-2">
                        <input
                            value={booking?.customer?.phoneCode || ""}
                            readOnly
                            className="w-28 border rounded-lg px-3 py-2 text-sm bg-gray-50"
                            title="Dialing code"
                        />
                        <input
                            value={form.phone}
                            onChange={(e) => {
                            const digits = onlyDigits(e.target.value);
                            // Freeze at E.164 total 15 digits (minus dial)
                            const dialDigits = onlyDigits(booking?.customer?.phoneCode || "");
                            const maxLocal = Math.max(0, 15 - dialDigits.length);
                            const clipped = digits.slice(0, maxLocal);
                            setForm((f) => ({ ...f, phone: clipped }));
                            setFerr((er) => ({ ...er, phone: "" }));
                            }}
                            inputMode="numeric"
                            className="flex-1 border rounded-lg px-3 py-2 text-sm"
                            placeholder="Phone number"
                        />
                        </div>
                        {ferr.phone ? <p className="text-sm text-red-600 mt-1">{ferr.phone}</p> : null}
                        <p className="text-xs text-gray-500 mt-1">
                        Stored as E.164: {booking?.customer?.phoneCode || ""} {form.phone}
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

                {/* Assignment Section - Separate from Booking Details */}
                <div className="rounded-2xl border-2 border-blue-200 bg-blue-50/30 p-4">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Assignment</h2>
                    {(booking?.assignedGuideId || booking?.assignedVehicleIds?.length > 0) && (
                        <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-medium text-blue-700">
                            Assigned
                        </span>
                    )}
                </div>
                <div className="space-y-4">
                    {/* Tour Guide */}
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tour Guide -</label>
                    <select
                        value={assignedGuideId}
                        onChange={(e) => setAssignedGuideId(e.target.value)}
                        className="w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
                    >
                        <option value="">— Select a guide —</option>
                        {guides.map((g) => (
                        <option key={g._id} value={g._id}>
                            {g.fullName || g.email} {g.languages ? `- ${g.languages.join(", ")}` : ""}
                        </option>
                        ))}
                    </select>
                    {booking?.assignedGuideId && (
                        <p className="mt-1 text-xs text-gray-500">
                        Currently: <b>{booking.assignedGuideId?.fullName || booking.assignedGuideId?.email || "Assigned"}</b>
                        </p>
                    )}
                    </div>

                    {/* Vehicle */}
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle -</label>
                    <select
                        value={assignedVehicleId}
                        onChange={(e) => setAssignedVehicleId(e.target.value)}
                        className="w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
                    >
                        <option value="">— Select a vehicle —</option>
                        {vehicles.map((v) => (
                        <option key={v._id} value={v._id}>
                            {v.seatingCapacity ? `${v.seatingCapacity} seats` : "No info"} • {v.vehicleType || ""}
                        </option>
                        ))}
                    </select>
                    {booking?.assignedVehicleIds?.length > 0 && (
                        <p className="mt-1 text-xs text-gray-500">
                        Currently: <b>{booking.assignedVehicleIds.map(v => v.seatingCapacity ? `${v.seatingCapacity} seats` : v._id).join(", ")}</b>
                        </p>
                    )}
                    </div>

                    {/* Notes */}
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Note -</label>
                    <textarea
                        rows={3}
                        value={assignmentNotes}
                        onChange={(e) => setAssignmentNotes(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
                        placeholder="Internal notes about this assignment..."
                    />
                    </div>

                    {/* Save Button */}
                    <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={saveAssignment}
                        disabled={savingAssignment}
                        className="rounded-full bg-blue-600 text-white px-5 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
                    >
                        {savingAssignment ? "Saving..." : "Save Assignment"}
                    </button>
                    {assignmentMsg && (
                        <span className={`text-sm ${assignmentMsg.includes("success") ? "text-green-600" : "text-red-600"}`}>
                        {assignmentMsg}
                        </span>
                    )}
                    </div>
                </div>
                </div>
            </div>

            {/* Right: payment summary */}
            <aside className="space-y-6">
                <div className="rounded-2xl border p-4">
                <h2 className="text-lg font-semibold mb-3">Price summary</h2>

                <dl className="text-sm space-y-2">
                    {/* Original / Discount */}
                    {hasDiscount ? (
                    <>
                        <div className="flex justify-between">
                        <dt className="text-gray-600">Original price</dt>
                        <dd className="font-medium line-through opacity-70">{fmtMoney(originalBeforeFees)}</dd>
                        </div>
                        <div className="flex justify-between">
                        <dt className="text-gray-600">Discount</dt>
                        <dd className="font-medium text-emerald-700">−{fmtMoney(p.discount)}</dd>
                        </div>
                        <div className="flex justify-between">
                        <dt className="text-gray-600">Subtotal after discount</dt>
                        <dd className="font-medium">{fmtMoney(discountedBeforeFees)}</dd>
                        </div>
                    </>
                    ) : (
                    <div className="flex justify-between">
                        <dt className="text-gray-600">Original price</dt>
                        <dd className="font-medium">{fmtMoney(p.subtotal)}</dd>
                    </div>
                    )}

                    {/* Fees */}
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

            </aside>
            </div>
        </div>
        </div>
    );
}
