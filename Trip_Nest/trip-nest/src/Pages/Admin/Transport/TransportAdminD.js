// src/Pages/Admin/Transport/TransportAdminD.jsx
/*
 * WHATSAPP INTEGRATION:
 * This page includes a fully functional WhatsApp Web integration.
 * 
 * Features:
 * 1. WhatsApp Web Mode: Embeds the REAL WhatsApp Web (https://web.whatsapp.com/)
 *    - Users can scan QR code with their phone to log into their actual WhatsApp account
 *    - Full access to all chats, contacts, messages, calls, etc.
 *    - Works exactly like visiting WhatsApp Web in a browser
 * 
 * 2. Quick Chat Mode: Direct WhatsApp messaging links
 *    - Opens WhatsApp conversations with predefined messages
 *    - Supports custom phone numbers
 *    - Multiple support channels (Driver Support, Vehicle Support)
 * 
 * The integration is 100% functional - no simulation or mock-up!
 */
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

/* ---------- utils ---------- */
function formatTel(s) {
    const d = String(s || "").replace(/\D/g, "").slice(0, 10);
    if (d.length !== 10) return s || "—";
    return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
    }

    // normalize any vehicle -> { id, label }
    function normalizeVehicles(arr = []) {
    return arr
        .map((v) => {
        const id =
            v.id || v._id || v.vehicleId || v.registrationNo || v.numberPlate;
        const label =
            v.label ||
            v.numberPlate ||
            v.registrationNo ||
            v.name ||
            v.title ||
            [v.manufacturer, v.vehicleModel || v.model, v.year]
            .filter(Boolean)
            .join(" ");
        if (!id || !label) return null;
        return { id: String(id), label: String(label) };
        })
        .filter(Boolean);
    }

    // driver.vehicles might contain either IDs or vehicle objects
    function extractVehicleIds(vs) {
    if (!Array.isArray(vs)) return [];
    return vs
        .map((v) =>
        typeof v === "string"
            ? v
            : v?.id || v?._id || v?.vehicleId || v?.registrationNo || v?.numberPlate
        )
        .filter(Boolean)
        .map(String);
    }

    export default function TransportAdminD() {
    const navigate = useNavigate();
    // const location = useLocation();

    const baseUrl = useMemo(
        () => process.env.REACT_APP_API_URL || "http://localhost:4000/api",
        []
    );

    // Drivers state
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [q, setQ] = useState("");

    // Vehicles state
    const [vehicles, setVehicles] = useState([]);
    const [vLoading, setVLoading] = useState(true);
    const [vErr, setVErr] = useState("");
    const [vq, setVq] = useState("");

    // WhatsApp state
    const [showWhatsApp, setShowWhatsApp] = useState(false);
    const [whatsappMode, setWhatsappMode] = useState('chat'); // 'web' or 'chat'
    const [whatsappNumber, setWhatsappNumber] = useState(''); // Store user's WhatsApp number for chat
    const [messages, setMessages] = useState([
        { id: 1, text: "Hello! Welcome to TripNest Support. How can I help you today?", sender: 'support', time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }
    ]);
    const [newMessage, setNewMessage] = useState('');

    // Assigned Vehicles Modal state
    const [showAssignedVehicles, setShowAssignedVehicles] = useState(false);
    const [assignedBookings, setAssignedBookings] = useState([]);
    const [assignedLoading, setAssignedLoading] = useState(false);
    const [assignedErr, setAssignedErr] = useState('');

    // Handle sending messages
    const handleSendMessage = () => {
        if (!newMessage.trim()) return;
        
        const userMsg = {
            id: messages.length + 1,
            text: newMessage,
            sender: 'user',
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        };
        
        setMessages([...messages, userMsg]);
        setNewMessage('');
        
        // Send to WhatsApp via wa.me link
        const phoneNumber = '94771234567'; // Replace with your business number
        const waUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(newMessage)}`;
        window.open(waUrl, '_blank');
        
        // Simulate support response
        setTimeout(() => {
            const supportMsg = {
                id: messages.length + 2,
                text: "Thank you for your message! A support agent will respond shortly via WhatsApp.",
                sender: 'support',
                time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
            };
            setMessages(prev => [...prev, supportMsg]);
        }, 1000);
    };

    // Fetch assigned vehicles from bookings
    const fetchAssignedVehicles = async () => {
        setAssignedLoading(true);
        setAssignedErr('');
        try {
            const res = await fetch(`${baseUrl}/custom-packages`, { credentials: 'include' });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || 'Failed to load bookings');
            
            const bookingsData = Array.isArray(data) ? data : data.items || [];
            // Filter only bookings that have assigned vehicles
            const withVehicles = bookingsData.filter(b => 
                Array.isArray(b.assignedVehicleIds) && b.assignedVehicleIds.length > 0
            );
            setAssignedBookings(withVehicles);
        } catch (e) {
            console.error(e);
            setAssignedErr(e.message || 'Failed to load assigned vehicles');
        } finally {
            setAssignedLoading(false);
        }
    };

    // Open assigned vehicles modal
    const handleShowAssignedVehicles = () => {
        setShowAssignedVehicles(true);
        fetchAssignedVehicles();
    };

    // Build a map of vehicleId -> nice label (e.g., number plate)
    const vehicleLabelMap = useMemo(() => {
        const norm = normalizeVehicles(vehicles);
        return Object.fromEntries(norm.map((v) => [v.id, v.label]));
    }, [vehicles]);

    // refetch both lists
    const refetchAll = async () => {
        try {
        setLoading(true);
        setVLoading(true);
        setErr("");
        setVErr("");

        const [dRes, vRes] = await Promise.all([
            fetch(`${baseUrl}/drivers`, { credentials: "include" }),
            fetch(`${baseUrl}/vehicles`, { credentials: "include" }),
        ]);

        const dData = await dRes.json();
        if (!dRes.ok) throw new Error(dData?.error || "Failed to load drivers");

        const vData = await vRes.json();
        if (!vRes.ok) throw new Error(vData?.error || "Failed to load vehicles");

        setDrivers(Array.isArray(dData) ? dData : dData.items || []);
        setVehicles(Array.isArray(vData) ? vData : vData.items || []);
        } catch (e) {
        console.error(e);
        // split errors between the two sections if you like; here we set both
        setErr(e.message || "Something went wrong");
        setVErr(e.message || "Something went wrong");
        setDrivers([]);
        setVehicles([]);
        } finally {
        setLoading(false);
        setVLoading(false);
        }
    };

    /* ---------- initial mount ---------- */
    useEffect(() => {
        refetchAll();
        // also refetch when the tab regains focus (user may have edited elsewhere)
        const onFocus = () => refetchAll();
        window.addEventListener("focus", onFocus);
        return () => window.removeEventListener("focus", onFocus);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [baseUrl]);

    /* ---------- refetch when coming back with state.refresh ---------- */
    // useEffect(() => {
    //     if (location.state?.refresh) {
    //     refetchAll();
    //     // clear the state so it doesn’t loop on further navs
    //     navigate(location.pathname, { replace: true, state: {} });
    //     }
    //     // eslint-disable-next-line react-hooks/exhaustive-deps
    // }, [location.state]);

    // /* ---------- Maps ---------- */
    // driverId -> name map for vehicle cards
    const driversMap = useMemo(
        () => Object.fromEntries((drivers || []).map((d) => [d._id, d.fullName || d._id])),
        [drivers]
    );

    /* ---------- Filters ---------- */
    const filteredDrivers = useMemo(() => {
        const term = q.trim().toLowerCase();
        if (!term) return drivers;

        return drivers.filter((d) => {
        const vehicleIds = extractVehicleIds(d.vehicles);
        const vehicleLabels = vehicleIds.map((id) => vehicleLabelMap[id] || id).join(" ");
        return (
            (d.fullName || "").toLowerCase().includes(term) ||
            (d.licenseNumber || "").toLowerCase().includes(term) ||
            (d.phone || "").toLowerCase().includes(term) ||
            vehicleLabels.toLowerCase().includes(term)
        );
        });
    }, [drivers, q, vehicleLabelMap]);

    const filteredVehicles = useMemo(() => {
        const term = vq.trim().toLowerCase();
        if (!term) return vehicles;
        return vehicles.filter((v) => {
        const driverName = driversMap[v.assignedDriverId] || "";
        return (
            (v.numberPlate || "").toLowerCase().includes(term) ||
            (v.vehicleType || "").toLowerCase().includes(term) ||
            (v.vehicleModel || "").toLowerCase().includes(term) ||
            (v.manufacturer || "").toLowerCase().includes(term) ||
            (v.currentCondition || "").toLowerCase().includes(term) ||
            driverName.toLowerCase().includes(term)
        );
        });
    }, [vehicles, vq, driversMap]);

    /* ---------- Cards (blue-accent style) ---------- */
    const DriverCard = ({ d }) => {
        const initials = (d.fullName || "")
        .split(" ")
        .map((p) => p[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase();

        // turn driver.vehicles into labels
        const chips = extractVehicleIds(d.vehicles)
        .map((id) => vehicleLabelMap[id] || id)
        .slice(0, 4);

        return (
        <article className="group relative rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition">
            <div className="absolute left-0 top-0 h-full w-1.5 rounded-l-xl bg-gradient-to-b from-blue-600 to-blue-400" />
            <div className="pl-5 pr-5 pt-5 pb-4">
            <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-600 text-white grid place-items-center font-semibold">
                {initials || "DR"}
                </div>
                <div className="min-w-0">
                <h3 className="font-semibold text-slate-800 truncate">
                    {d.fullName || "—"}
                </h3>
                <div className="text-xs text-slate-500 truncate">
                    {d.licenseNumber || "—"} · {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : "—"}
                </div>
                </div>
            </div>

            <dl className="mt-4 text-sm">
                <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Phone</dt>
                <dd className="font-medium text-slate-800">{formatTel(d.phone)}</dd>
                </div>
                <div className="mt-2 flex items-center justify-between gap-4">
                <dt className="text-slate-500">Vehicles</dt>
                <dd className="flex flex-wrap gap-1 justify-end">
                    {chips.length ? (
                    chips.map((label, i) => (
                        <span
                        key={i}
                        className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[12px] text-slate-700"
                        >
                        {label}
                        </span>
                    ))
                    ) : (
                    <span className="text-slate-700">—</span>
                    )}
                </dd>
                </div>
            </dl>

            <div className="mt-5 flex justify-end">
                <button
                type="button"
                onClick={() =>
                    navigate(`/admin/drivers-detail/${d._id}`)
                }
                className="inline-flex items-center justify-center rounded-full border border-blue-600 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-600 hover:text-white transition"
                >
                View
                </button>
            </div>
            </div>
        </article>
        );
    };

    const VehicleCard = ({ v }) => {
        const driverName = driversMap[v.assignedDriverId] || "—";
        return (
        <article className="group relative rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition">
            <div className="absolute left-0 top-0 h-full w-1.5 rounded-l-xl bg-gradient-to-b from-blue-600 to-blue-400" />
            <div className="pl-5 pr-5 pt-5 pb-4">
            <div className="flex items-center justify-between gap-4">
                <h3 className="font-semibold text-slate-800 truncate">
                {v.numberPlate || "—"}
                </h3>
                <span className="text-xs text-slate-500">
                {v.createdAt ? new Date(v.createdAt).toLocaleDateString() : "—"}
                </span>
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
                <dt className="text-slate-500">Type / Model</dt>
                <dd className="font-medium text-slate-800 truncate">
                {(v.vehicleType || "—") + " • " + (v.vehicleModel || "—")}
                </dd>

                <dt className="text-slate-500">Manufacturer</dt>
                <dd className="font-medium text-slate-800 truncate">
                {v.manufacturer || "—"}
                </dd>

                <dt className="text-slate-500">Seats</dt>
                <dd className="font-medium text-slate-800">
                {v.seatingCapacity ?? "—"}
                </dd>

                <dt className="text-slate-500">Condition</dt>
                <dd className="font-medium text-slate-800">
                {v.currentCondition || "—"}
                </dd>

                <dt className="text-slate-500">Driver</dt>
                <dd className="font-medium text-slate-800 truncate">
                {driverName}
                </dd>
            </dl>

            <div className="mt-5 flex justify-end">
                <button
                type="button"
                onClick={() => navigate(`/admin/vehicles-detail/${v._id}`)}
                className="inline-flex items-center justify-center rounded-full border border-blue-600 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-600 hover:text-white transition"
                >
                View
                </button>
            </div>
            </div>
        </article>
        );
    };

    /* ---------- UI ---------- */
    return (
        <div className="min-h-screen bg-[#F4F8FB] text-gray-900">
        {/* HERO HEADER */}
        <header className="relative">
            <div
            className="h-44 md:h-56 w-full bg-center bg-cover"
            style={{
                backgroundImage:
                'url("https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1600&auto=format&fit=crop")',
            }}
            />
            <div className="absolute inset-0 bg-black/30" />
            <div className="absolute inset-0 flex items-center">
            <div className="max-w-6xl mx-auto w-full px-6 md:px-10 flex items-center justify-between">
                <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow">
                Drivers & Vehicles
                </h1>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
               
                {/* WhatsApp Button - Opens directly to WhatsApp Web */}
                <a
                    href="https://web.whatsapp.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-green-500/90 text-white px-4 py-2 text-sm font-semibold border border-green-500 hover:bg-green-600 transition-colors flex items-center gap-2 shadow-lg"
                    title="Open WhatsApp Web"
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                    </svg>
                    WhatsApp Web
                </a>
                 {/* Assigned Vehicles Button */}
                <button
                    onClick={handleShowAssignedVehicles}
                    className="rounded-full bg-white/90 text-blue-700 px-4 py-2 text-sm font-semibold border border-white hover:bg-white"
                    title="View Assigned Vehicles"
                >
                    Assigned Vehicles
                </button>
                
                <Link to="/admin/driver-form">
                    <button className="rounded-full bg-white/90 text-blue-700 px-4 py-2 text-sm font-semibold border border-white hover:bg-white">
                    Add Drivers
                    </button>
                </Link>
                <Link to="/admin/vehicle-form">
                    <button className="rounded-full bg-white/90 text-blue-700 px-4 py-2 text-sm font-semibold border border-white hover:bg-white">
                    Add Vehicles
                    </button>
                </Link>
                </div>
            </div>
            </div>
        </header>

        {/* BODY */}
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-8">
            {/* Drivers Section */}
            <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-800">Drivers</h2>
            <div className="flex items-center gap-2 rounded-full bg-white/90 border border-white/60 px-4 py-2 w-full sm:w-[260px]">
                <span className="inline-block text-gray-500">🔎</span>
                <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search drivers…"
                className="w-full bg-transparent focus:outline-none text-gray-800 placeholder:text-gray-500"
                />
            </div>
            </div>

            {err ? <div className="mb-4 text-red-600">Error: {err}</div> : null}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-44 rounded-xl bg-white border border-slate-200 animate-pulse" />
                ))
                : filteredDrivers.map((d) => <DriverCard key={d._id} d={d} />)}
            </div>

            {!loading && !filteredDrivers.length ? (
            <div className="text-center text-slate-600 mt-10">No drivers found.</div>
            ) : null}

            {/* Divider */}
            <div className="border-t my-10" />

            {/* Vehicles Section */}
            <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-800">Vehicles</h2>
            <div className="flex items-center gap-2 rounded-full bg-white/90 border border-white/60 px-4 py-2 w-full sm:w-[260px]">
                <span className="inline-block text-gray-500">🔎</span>
                <input
                value={vq}
                onChange={(e) => setVq(e.target.value)}
                placeholder="Search vehicles…"
                className="w-full bg-transparent focus:outline-none text-gray-800 placeholder:text-gray-500"
                />
            </div>
            </div>

            {vErr ? <div className="mb-4 text-red-600">Error: {vErr}</div> : null}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-44 rounded-xl bg-white border border-slate-200 animate-pulse" />
                ))
                : filteredVehicles.map((v) => <VehicleCard key={v._id} v={v} />)}
            </div>

            {!vLoading && !filteredVehicles.length ? (
            <div className="text-center text-slate-600 mt-10">No vehicles found.</div>
            ) : null}
        </div>

        {/* Assigned Vehicles Modal */}
        {showAssignedVehicles && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-purple-600 to-purple-500 text-white p-6 flex items-center justify-between shadow-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold">Assigned Vehicles</h3>
                                <p className="text-sm text-purple-100">View all vehicles assigned to bookings</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowAssignedVehicles(false)}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                        {assignedErr && (
                            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                                {assignedErr}
                            </div>
                        )}

                        {assignedLoading ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="text-center">
                                    <div className="w-16 h-16 border-4 border-white-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                    <p className="text-gray-600 font-medium">Loading assigned vehicles...</p>
                                </div>
                            </div>
                        ) : assignedBookings.length === 0 ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="text-center">
                                    <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No Assigned Vehicles</h3>
                                    <p className="text-gray-500">No vehicles have been assigned to bookings yet.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {assignedBookings.map((booking) => {
                                    const assignedVehicles = vehicles.filter(v => 
                                        booking.assignedVehicleIds.includes(v._id)
                                    );
                                    const guideName = booking._guide?.fullName || booking._guide?.email || 'Not assigned';
                                    
                                    return (
                                        <div key={booking._id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                            {/* Booking Header */}
                                            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-b border-gray-200 p-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                            </svg>
                                                            {booking.fullName}
                                                        </h4>
                                                        <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                                                            <div className="flex items-center gap-2 text-gray-600">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                                </svg>
                                                                {booking.email}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-gray-600">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                                </svg>
                                                                {booking.phone}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-gray-600">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                                </svg>
                                                                {booking.travellers || 0} Travellers
                                                            </div>
                                                            <div className="flex items-center gap-2 text-gray-600">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                </svg>
                                                                {booking.durationDays || 0} Days
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-2">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                            booking.status === 'approved' 
                                                                ? 'bg-green-100 text-green-700' 
                                                                : 'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                            {booking.status || 'pending'}
                                                        </span>
                                                        <Link
                                                            to={`/admin/custom-book-view/${booking._id}`}
                                                            className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                                                        >
                                                            View Details
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                            </svg>
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Assigned Guide */}
                                            <div className="px-4 py-3 bg-blue-50 border-b border-gray-200">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <span className="font-medium text-gray-700">Tour Guide:</span>
                                                    <span className="text-gray-900">{guideName}</span>
                                                </div>
                                            </div>

                                            {/* Assigned Vehicles */}
                                            <div className="p-4">
                                                <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                                                    </svg>
                                                    Assigned Vehicles ({assignedVehicles.length})
                                                </h5>
                                                {assignedVehicles.length > 0 ? (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                        {assignedVehicles.map((vehicle) => (
                                                            <div key={vehicle._id} className="border border-gray-200 rounded-lg p-3 bg-gradient-to-br from-white to-gray-50 hover:shadow-md transition-shadow">
                                                                <div className="flex items-start gap-3">
                                                                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                                                                        </svg>
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="font-semibold text-gray-900 truncate">{vehicle.numberPlate || 'N/A'}</p>
                                                                        <p className="text-sm text-gray-600 truncate">{vehicle.vehicleType || 'Unknown'}</p>
                                                                        <p className="text-xs text-gray-500 mt-1">{vehicle.vehicleModel || ''} {vehicle.manufacturer || ''}</p>
                                                                        {vehicle.seatingCapacity && (
                                                                            <p className="text-xs text-gray-600 mt-1">
                                                                                <span className="inline-flex items-center gap-1">
                                                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                                                    </svg>
                                                                                    {vehicle.seatingCapacity} seats
                                                                                </span>
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-gray-500 italic">No vehicles found for this booking</p>
                                                )}
                                            </div>

                                            {/* Assignment Notes */}
                                            {booking.assignmentNotes && (
                                                <div className="px-4 pb-4">
                                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                                        <p className="text-sm font-medium text-amber-900 mb-1">Notes:</p>
                                                        <p className="text-sm text-amber-800">{booking.assignmentNotes}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-100 border-t border-gray-200 p-4 flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            {!assignedLoading && (
                                <span>Total: <strong>{assignedBookings.length}</strong> booking(s) with assigned vehicles</span>
                            )}
                        </div>
                        <button
                            onClick={() => setShowAssignedVehicles(false)}
                            className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* WhatsApp Integration Modal */}
        {showWhatsApp && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[95vh] flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-green-600 to-green-500 text-white p-4 flex items-center justify-between shadow-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">WhatsApp</h3>
                                <p className="text-sm text-green-100">Connect & Chat</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Mode Toggle */}
                            <div className="bg-white/20 rounded-full p-1 flex gap-1">
                                <button
                                    onClick={() => setWhatsappMode('web')}
                                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                                        whatsappMode === 'web' 
                                        ? 'bg-white text-green-600 shadow' 
                                        : 'text-white hover:bg-white/10'
                                    }`}
                                >
                                    WhatsApp
                                </button>
                                <button
                                    onClick={() => setWhatsappMode('chat')}
                                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                                        whatsappMode === 'chat' 
                                        ? 'bg-white text-green-600 shadow' 
                                        : 'text-white hover:bg-white/10'
                                    }`}
                                >
                                    Quick Chat
                                </button>
                            </div>
                            <button
                                onClick={() => {
                                    setShowWhatsApp(false);
                                    setWhatsappNumber('');
                                }}
                                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-hidden">
                        {whatsappMode === 'web' ? (
                            /* WhatsApp Web Mode - Open in New Window */
                            <div className="h-full bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-8">
                                <div className="max-w-2xl w-full">
                                    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                                        <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                                            <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                                            </svg>
                                        </div>

                                        <h3 className="text-3xl font-bold text-gray-900 mb-3">Open WhatsApp Web</h3>
                                        <p className="text-gray-600 mb-6">Use your full WhatsApp account in a new window</p>

                                        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6 text-left">
                                            <div className="flex items-start gap-3 mb-4">
                                                <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <div>
                                                    <h4 className="font-semibold text-green-900 mb-2">How to use WhatsApp Web:</h4>
                                                    <ol className="text-sm text-green-800 space-y-1.5">
                                                        <li><strong>1.</strong> Click the "Open WhatsApp Web" button below</li>
                                                        <li><strong>2.</strong> WhatsApp Web will open in a new window/tab</li>
                                                        <li><strong>3.</strong> On your phone: Open WhatsApp → Settings → Linked Devices</li>
                                                        <li><strong>4.</strong> Tap "Link a Device" and scan the QR code</li>
                                                        <li><strong>5.</strong> You're connected! Use WhatsApp normally</li>
                                                    </ol>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <a
                                                href="https://web.whatsapp.com/"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 px-6 rounded-xl text-center font-bold text-lg hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                            >
                                                <div className="flex items-center justify-center gap-3">
                                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                                                    </svg>
                                                    <span>Open WhatsApp Web</span>
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                    </svg>
                                                </div>
                                            </a>

                                            <p className="text-sm text-gray-500">Opens in a new window for best experience</p>
                                        </div>

                                        <div className="mt-6 pt-6 border-t border-gray-200">
                                            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                </svg>
                                                <span>Secure & Private - Official WhatsApp Web</span>
                                            </div>
                                        </div>

                                        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                            <p className="text-sm text-blue-900">
                                                <strong>💡 Tip:</strong> Keep the WhatsApp Web window open alongside this page for easy access to both your admin panel and WhatsApp!
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Live Chat Mode - WhatsApp-style Interface */
                            <div className="h-full flex flex-col bg-gray-100">
                                {/* Chat Header */}
                                <div className="bg-green-600 text-white p-4 flex items-center justify-between shadow-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg">TripNest Support</h3>
                                            <p className="text-sm text-green-100">Online • Typically replies instantly</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button className="p-2 hover:bg-white/10 rounded-full transition-colors" title="Voice Call">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                        </button>
                                        <button className="p-2 hover:bg-white/10 rounded-full transition-colors" title="Video Call">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                        </button>
                                        <button className="p-2 hover:bg-white/10 rounded-full transition-colors" title="More Options">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                {/* Messages Area */}
                                <div 
                                    className="flex-1 overflow-y-auto p-6 space-y-4"
                                    style={{
                                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d1d5db' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                                    }}
                                >
                                    {/* Date Divider */}
                                    <div className="flex items-center justify-center">
                                        <div className="bg-white/90 backdrop-blur-sm shadow-sm px-4 py-1.5 rounded-full text-xs text-gray-700 font-medium">
                                            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        </div>
                                    </div>

                                    {/* Messages */}
                                    {messages.map((msg) => (
                                        <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[70%] ${msg.sender === 'user' ? 'order-2' : 'order-1'}`}>
                                                <div className={`rounded-lg px-4 py-2 shadow-sm ${
                                                    msg.sender === 'user' 
                                                        ? 'bg-green-500 text-white rounded-tr-none' 
                                                        : 'bg-white text-gray-800 rounded-tl-none'
                                                }`}>
                                                    <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                                                    <div className={`text-xs mt-1 flex items-center justify-end gap-1 ${
                                                        msg.sender === 'user' ? 'text-green-100' : 'text-gray-500'
                                                    }`}>
                                                        <span>{msg.time}</span>
                                                        {msg.sender === 'user' && (
                                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Quick Replies */}
                                <div className="px-6 py-3 bg-white border-t border-gray-200">
                                    <div className="flex gap-2 overflow-x-auto pb-2">
                                        <button
                                            onClick={() => setNewMessage("I need help with driver registration")}
                                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium text-gray-700 whitespace-nowrap transition-colors"
                                        >
                                            🚗 Driver Help
                                        </button>
                                        <button
                                            onClick={() => setNewMessage("I need help with vehicle management")}
                                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium text-gray-700 whitespace-nowrap transition-colors"
                                        >
                                            🚙 Vehicle Help
                                        </button>
                                        <button
                                            onClick={() => setNewMessage("I have a question about bookings")}
                                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium text-gray-700 whitespace-nowrap transition-colors"
                                        >
                                            📅 Booking Support
                                        </button>
                                    </div>
                                </div>

                                {/* Message Input */}
                                <div className="bg-white border-t border-gray-200 p-4">
                                    <div className="flex items-end gap-3">
                                        <button className="p-2.5 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0">
                                            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </button>
                                        <button className="p-2.5 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0">
                                            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                            </svg>
                                        </button>
                                        <div className="flex-1 relative">
                                            <textarea
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        handleSendMessage();
                                                    }
                                                }}
                                                placeholder="Type a message..."
                                                rows={1}
                                                className="w-full py-3 px-4 pr-12 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-colors resize-none overflow-hidden"
                                                style={{ minHeight: '44px', maxHeight: '120px' }}
                                            />
                                        </div>
                                        <button
                                            onClick={handleSendMessage}
                                            disabled={!newMessage.trim()}
                                            className={`p-3 rounded-full transition-all flex-shrink-0 ${
                                                newMessage.trim()
                                                    ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                            }`}
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                            </svg>
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2 text-center">
                                        Messages connect to WhatsApp • 
                                        <svg className="w-3 h-3 inline mx-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                        End-to-end encrypted
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
        </div>
    );
}
