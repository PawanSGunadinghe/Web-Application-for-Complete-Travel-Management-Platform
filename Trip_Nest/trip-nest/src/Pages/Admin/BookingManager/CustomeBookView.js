//customize package view(assign driver and tour guide)

import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";

export default function CustomBookView() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [doc, setDoc] = useState(null);
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(true);

    // assignment state (kept from your version)
    const [guides, setGuides] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [saving, setSaving] = useState(false);
    const [assignedGuideId, setAssignedGuideId] = useState("");
    const [assignedVehicleId, setAssignedVehicleId] = useState("");
    const [assignmentNotes, setAssignmentNotes] = useState("");
    const [saveMsg, setSaveMsg] = useState("");

    // status buttons state
    const [statusSaving, setStatusSaving] = useState(false);
    const [statusMsg, setStatusMsg] = useState("");

    const API_BASE = useMemo(
        () => `${process.env.REACT_APP_API_URL || "http://localhost:4000/api"}`,
        []
    );

    // Load custome package data
    useEffect(() => {
        let live = true;
        (async () => {
        setLoading(true);
        setErr("");
        try {
            const r = await fetch(`${API_BASE}/custom-packages/${id}`, { credentials: "include" });
            const data = await r.json();
            if (!r.ok) throw new Error(data?.error || "Failed to load");
            if (!live) return;
            setDoc(data);
            setAssignedGuideId(data?.assignedGuideId || "");
            setAssignedVehicleId(data?.assignedVehicleIds?.[0] || data?.assignedVehicleId || "");
            setAssignmentNotes(data?.assignmentNotes || "");
        } catch (e) {
            if (live) setErr(e.message || "Something went wrong");
        } finally {
            if (live) setLoading(false);
        }
        })();
        return () => { live = false; };
    }, [API_BASE, id]);

    // Load options (guides, vehicles) and filter out already-assigned ones
    useEffect(() => {
        let live = true;
        (async () => {
        try {
            const [g, v, regularBookings, customBookings] = await Promise.all([
            fetch(`${API_BASE}/guide-applications?limit=200`, { credentials: "include" }).then(r => r.json()).catch(() => ({ items: [] })),
            fetch(`${API_BASE}/vehicles?limit=200`, { credentials: "include" }).then(r => r.json()).catch(() => ({ items: [] })),
            fetch(`${API_BASE}/bookings/all`, { credentials: "include" }).then(r => r.json()).catch(() => []),
            fetch(`${API_BASE}/custom-packages`, { credentials: "include" }).then(r => r.json()).catch(() => []),
            ]);
            if (!live) return;
            
            // Collect assigned guide IDs and vehicle IDs from both regular and custom bookings
            const assignedGuideIds = new Set();
            const assignedVehicleIds = new Set();
            
            // From regular bookings
            if (Array.isArray(regularBookings)) {
                regularBookings.forEach(b => {
                    if (b._id !== id && b.assignedGuideId) {
                        assignedGuideIds.add(typeof b.assignedGuideId === 'object' ? b.assignedGuideId._id : b.assignedGuideId);
                    }
                    if (b._id !== id && Array.isArray(b.assignedVehicleIds)) {
                        b.assignedVehicleIds.forEach(v => {
                            assignedVehicleIds.add(typeof v === 'object' ? v._id : v);
                        });
                    }
                });
            }
            
            // From custom bookings
            if (Array.isArray(customBookings)) {
                customBookings.forEach(cb => {
                    if (cb._id !== id && cb.assignedGuideId) {
                        assignedGuideIds.add(typeof cb.assignedGuideId === 'object' ? cb.assignedGuideId._id : cb.assignedGuideId);
                    }
                    if (cb._id !== id && Array.isArray(cb.assignedVehicleIds)) {
                        cb.assignedVehicleIds.forEach(v => {
                            assignedVehicleIds.add(typeof v === 'object' ? v._id : v);
                        });
                    }
                });
            }
            
            // Filter out already assigned guides and vehicles
            const allGuides = Array.isArray(g) ? g : g.items || [];
            const availableGuides = allGuides.filter(guide => !assignedGuideIds.has(guide._id));
            
            const allVehicles = Array.isArray(v) ? v : v.items || [];
            const availableVehicles = allVehicles.filter(vehicle => !assignedVehicleIds.has(vehicle._id));
            
            setGuides(availableGuides);
            setVehicles(availableVehicles);
        } catch {
            /* ignore for options */
        }
        })();
        return () => { live = false; };
    }, [API_BASE, id]);

    const onSelectVehicle = (vid) => {
        setAssignedVehicleId(vid);
    };

//assigmnet logic

    // Build display label for a guide: "Name - language(s)"
    function guideLabel(g) {
        const name = g.fullName || g.name || g.email || g._id;
        const langs = Array.isArray(g.languages)
            ? g.languages.filter(Boolean).join(", ")
            : (g.languages || "");
        return langs ? `${name} - ${langs}` : String(name);
    }

    const onSaveAssignment = async () => {
        setSaving(true);
        setSaveMsg("");
        try {
        const r = await fetch(`${API_BASE}/custom-packages/${id}/assignment`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
            assignedGuideId: assignedGuideId || null,
            assignedVehicleIds: assignedVehicleId ? [assignedVehicleId] : [],
            assignmentNotes,
            }),
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data?.error || "Failed to save assignment");
        setDoc(data);
        setSaveMsg("Assignment saved.");
        } catch (e) {
        setSaveMsg(e.message || "Failed to save.");
        } finally {
        setSaving(false);
        }
    };

    // approve and reject (only two buttons) ----
    async function approve() {
        if (!id) return;
        try {
        setStatusSaving(true);
        setStatusMsg("");
        const r = await fetch(`${API_BASE}/custom-packages/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ status: "approved" }),
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data?.error || "Failed to approve");
        setDoc(data); // will now show approved and hide buttons
        setStatusMsg("Approved.");
        
        // Send WhatsApp message after approval
        if (data.phone && data.fullName) {
            sendWhatsAppMessage(data.phone, data.fullName, 'approved');
        }
        } catch (e) {
        setStatusMsg(e.message || "Failed to approve.");
        } finally {
        setStatusSaving(false);
        setTimeout(() => setStatusMsg(""), 2500);
        }
    }
    
    // Function to send WhatsApp message
    function sendWhatsAppMessage(phone, name, type) {
        // Remove any non-digit characters from phone
        const cleanPhone = phone.replace(/\D/g, '');
        
        // Create message based on type
        let message = '';
        if (type === 'approved') {
            message = `Hello ${name}! 🎉\n\nGreat news! Your custom package request has been *APPROVED* by TripNest.\n\nOur team will assign a tour guide and vehicle for your trip shortly. You'll receive another notification once everything is confirmed.\n\nThank you for choosing TripNest!\n\n- TripNest Team`;
        } else if (type === 'rejected') {
            message = `Hello ${name},\n\nThank you for your interest in TripNest. Unfortunately, your custom package request has been *REJECTED*.\n\nThis could be due to limited availability or capacity constraints. We encourage you to browse our pre-designed packages or submit a new request.\n\nWe apologize for any inconvenience.\n\n- TripNest Team`;
        }
        
        // Open WhatsApp with pre-filled message
        const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    }

//update status to "approved"

    async function rejectAndDelete() {
        if (!id) return;
        const yes = window.confirm("Reject this request and delete it permanently?");
        if (!yes) return;
        
        // Send WhatsApp message before deleting
        if (doc?.phone && doc?.fullName) {
            sendWhatsAppMessage(doc.phone, doc.fullName, 'rejected');
        }
        
        try {
        setStatusSaving(true);
        setStatusMsg("");
        const r = await fetch(`${API_BASE}/custom-packages/${id}`, {
            method: "DELETE",
            credentials: "include",
        });
        if (!r.ok) {
            const data = await r.json().catch(() => ({}));
            throw new Error(data?.error || "Failed to delete");
        }
        setStatusMsg("Rejected and deleted.");
        // back to list after delete
        navigate("/admin/custom-bookings");
        } catch (e) {
        setStatusMsg(e.message || "Failed to delete.");
        } finally {
        setStatusSaving(false);
        }
    }
    // -------------------------------------------

    return (
        <div className="min-h-screen bg-[#F4F8FB]">
        {/* Hero */}
        <header className="relative">
            <div
            className="h-40 md:h-48 w-full bg-center bg-cover"
            style={{
                backgroundImage:
                'url("https://images.unsplash.com/photo-1465101046530-73398c7f28ca?q=80&w=1600&auto=format&fit=crop")',
            }}
            />
            <div className="absolute inset-0 bg-black/30" />
            <div className="absolute inset-0 flex items-center">
            <div className="max-w-6xl mx-auto w-full px-6 md:px-10 flex items-center justify-between">
                <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow">
                Request Details
                </h1>
                <button
                onClick={() => navigate(-1)}
                className="rounded-full bg-white/90 text-blue-700 px-4 py-2 text-sm font-semibold border border-white hover:bg-white"
                >
                Back
                </button>
            </div>
            </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 md:px-10 py-10">
            {err && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
                {err}
            </div>
            )}

            {loading && (
            <div className="rounded-2xl bg-white border border-slate-200 p-6 animate-pulse">
                <div className="h-6 w-1/3 bg-slate-200 rounded" />
                <div className="mt-4 h-4 w-2/3 bg-slate-200 rounded" />
                <div className="mt-2 h-4 w-1/2 bg-slate-200 rounded" />
            </div>
            )}

            {!loading && doc && (
            <div className="space-y-8">
                {/* Request info */}
                <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                    <h2 className="text-xl font-semibold text-slate-800">{doc.fullName}</h2>
                    <p className="mt-1 text-sm text-slate-500">Submitted {formatDate(doc.createdAt)}</p>
                    </div>

                    {/* Status + 2 buttons */}
                    <div className="flex items-center gap-2">
                    <StatusPill status={doc.status || "pending"} />
                    {doc.status !== "approved" && (
                        <>
                        <button
                            type="button"
                            onClick={approve}
                            disabled={statusSaving}
                            className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                        >
                            {statusSaving ? "Saving…" : "Approve"}
                        </button>
                        <button
                            type="button"
                            onClick={rejectAndDelete}
                            disabled={statusSaving}
                            className="rounded-full bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                        >
                            {statusSaving ? "Saving…" : "Reject"}
                        </button>
                        </>
                    )}
                    </div>
                </div>

                {statusMsg && <div className="mt-2 text-xs text-slate-600">{statusMsg}</div>}

                <dl className="mt-6 grid sm:grid-cols-2 gap-5 text-sm">
                    <Info label="Email" value={doc.email} />
                    <Info label="Phone" value={doc.phone} />
                    <Info label="Country" value={doc.country} />
                    <Info label="Travellers" value={doc.travellers} />
                    <Info
                    label="Preferred Dates"
                    value={`${formatDate(doc?.preferredDates?.start)} → ${formatDate(doc?.preferredDates?.end)}`}
                    />
                    <Info label="Duration (days)" value={doc.durationDays} />
                    <Info className="sm:col-span-2" label="Preferred Destination(s)" value={doc.destinations} />
                </dl>
                </div>

                {/* Assignment Form - Show only if approved or assigned */}
                {(doc.status === "approved" || doc.status === "assigned") && (
                <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-slate-800">Assignment</h3>
                    {doc.status === "assigned" && (
                        <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-medium text-blue-700">
                            Assigned
                        </span>
                    )}
                </div>

                <div className="space-y-5">
                    {/* Tour Guide */}
                    <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Tour Guide -
                    </label>
                    <select
                        value={assignedGuideId}
                        onChange={(e) => setAssignedGuideId(e.target.value)}
                        className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-200"
                    >
                        <option value="">— Select a guide —</option>
                        {guides.map((g) => (
                        <option key={g._id} value={g._id}>
                            {guideLabel(g)}
                        </option>
                        ))}
                    </select>
                    {doc._guide && (
                        <p className="mt-2 text-xs text-slate-500">
                        Currently assigned: <b>{doc._guide.fullName || doc._guide.email || doc._guide._id}</b>
                        </p>
                    )}
                    </div>

                    {/* Vehicle */}
                    <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Vehicle -
                    </label>
                    <select
                        value={assignedVehicleId}
                        onChange={(e) => setAssignedVehicleId(e.target.value)}
                        className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-200"
                    >
                        <option value="">— Select a vehicle —</option>
                        {vehicles.map((v) => (
                        <option key={v._id} value={v._id}>
                            {v.seatingCapacity ? `${v.seatingCapacity} seats` : "No seats info"} • {v.vehicleType || ""}
                        </option>
                        ))}
                    </select>
                    {Array.isArray(doc._vehicles) && doc._vehicles.length > 0 && (
                        <p className="mt-2 text-xs text-slate-500">
                        Currently assigned: {doc._vehicles.map((v) => v.seatingCapacity ? `${v.seatingCapacity} seats` : v._id).join(", ")}
                        </p>
                    )}
                    </div>

                    {/* Notes */}
                    <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Note -
                    </label>
                    <textarea
                        rows={3}
                        value={assignmentNotes}
                        onChange={(e) => setAssignmentNotes(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-200"
                        placeholder="Internal notes about this assignment..."
                    />
                    </div>

                    {/* Save Button */}
                    <div className="flex items-center gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onSaveAssignment}
                        disabled={saving}
                        className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                        {saving ? "Saving..." : "Save Assignment"}
                    </button>
                    {saveMsg && <span className="text-sm text-slate-700">{saveMsg}</span>}
                    </div>
                </div>
                </div>
                )}

                {/* Back to list */}
                <div className="flex">
                <Link
                    to="/admin/custom-bookings"
                    className="rounded-full border border-blue-600 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-600 hover:text-white"
                >
                    Back to list
                </Link>
                </div>
            </div>
            )}
        </main>
        </div>
    );
    }

    /* UI helpers */
    function Info({ label, value, className = "" }) {
    return (
        <div className={className}>
        <dt className="text-slate-500">{label}</dt>
        <dd className="mt-1 font-medium text-slate-800 break-words">{value ?? "—"}</dd>
        </div>
    );
    }

    function StatusPill({ status }) {
    const map = {
        pending: "bg-amber-50 text-amber-700 border-amber-200",
        approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
        assigned: "bg-blue-50 text-blue-700 border-blue-200",
        confirmed: "bg-green-50 text-green-700 border-green-200",
        completed: "bg-purple-50 text-purple-700 border-purple-200",
        cancelled: "bg-red-50 text-red-700 border-red-200",
    };
    const cls = map[status] || "bg-gray-50 text-gray-700 border-gray-200";
    return <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs ${cls}`}>{status}</span>;
    }

    function formatDate(d) {
    if (!d) return "—";
    const dt = new Date(d);
    if (isNaN(dt)) return String(d);
    return dt.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
    }
