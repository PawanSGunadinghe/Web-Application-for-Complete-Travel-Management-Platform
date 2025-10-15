// src/pages/CustomRequestDetails.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

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

// Get phone rules for a country code
function getPhoneRules(countryCode) {
    const r = PHONE_RULES[countryCode];
    if (r) return r;
    return { localMin: 6, localMax: 15, placeholder: "Phone number" };
}

export default function CustomRequestDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const API_BASE = useMemo(
        () => process.env.REACT_APP_API_URL || "http://localhost:4000/api",
        []
    );

    const [data, setData] = useState(null);
    const [err, setErr] = useState("");
    const [deleting, setDeleting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [updating, setUpdating] = useState(false);

    // Get today's date in YYYY-MM-DD format
    const todayStr = new Date().toISOString().split('T')[0];

    //Fetch request details

    useEffect(() => {
        let live = true;
        (async () => {
        try {
            const r = await fetch(`${API_BASE}/custom-packages/${id}`, { credentials: "include" });
            const d = await r.json();
            if (!r.ok) throw new Error(d?.error || "Failed to load");
            if (live) setData(d);
        } catch (e) {
            if (live) setErr(e.message || "Failed to load");
        }
        })();
        return () => { live = false; };
    }, [API_BASE, id]);

    const fmt = (d) =>
        d ? new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";

    const toDateInput = (d) => {
        if (!d) return "";
        const dt = new Date(d);
        if (isNaN(dt)) return "";
        return dt.toISOString().split('T')[0];
    };

    // Start editing
    function startEdit() {
        const countryData = COUNTRIES_ALLOWED.find(c => c.code === data.country) || COUNTRIES_ALLOWED[0];
        setEditForm({
            fullName: data.fullName || "",
            email: data.email || "",
            phone: data.phone || "",
            country: data.country || "LK",
            phoneCode: countryData.dial,
            travellers: data.travellers || 1,
            startDate: toDateInput(data?.preferredDates?.start),
            endDate: toDateInput(data?.preferredDates?.end),
            durationDays: data.durationDays || 1,
            destinations: data.destinations || "",
        });
        setIsEditing(true);
    }

    // Cancel editing
    function cancelEdit() {
        setIsEditing(false);
        setEditForm({});
    }

    // Validation helper
    function validateForm() {
        // Validate name - no digits allowed
        if (/\d/.test(editForm.fullName)) {
            alert("Name cannot contain digits");
            return false;
        }

        if (!editForm.fullName.trim()) {
            alert("Name is required");
            return false;
        }

        // Validate email - must contain @ and .
        const email = editForm.email.trim();
        if (!email) {
            alert("Email is required");
            return false;
        }
        if (!email.includes('@')) {
            alert("Email must contain @");
            return false;
        }
        if (!email.includes('.')) {
            alert("Email must contain a dot (.)");
            return false;
        }
        // Additional email validation
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
            alert("Please enter a valid email address");
            return false;
        }

        return true;
    }

    // Update handler
    async function handleUpdate() {
        if (!validateForm()) return;

        try {
            setUpdating(true);
            const payload = {
                fullName: editForm.fullName,
                email: editForm.email,
                phone: editForm.phone,
                country: editForm.country,
                travellers: Number(editForm.travellers),
                preferredDates: {
                    start: editForm.startDate,
                    end: editForm.endDate,
                },
                durationDays: Number(editForm.durationDays),
                destinations: editForm.destinations,
            };

            const r = await fetch(`${API_BASE}/custom-packages/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload),
            });
            const d = await r.json();
            if (!r.ok) throw new Error(d?.error || "Update failed");
            
            setData(d);
            setIsEditing(false);
            alert("Updated successfully!");
        } catch (e) {
            alert(e.message || "Update failed");
        } finally {
            setUpdating(false);
        }
    }

//delete

    async function handleDelete() {
        const yes = window.confirm("Delete this request permanently?");
        if (!yes) return;
        const typed = window.prompt('Type "DELETE" to confirm:');
        if (typed !== "DELETE") return;

        try {
        setDeleting(true);
        const r = await fetch(`${API_BASE}/custom-packages/${id}`, {
            method: "DELETE",
            credentials: "include",
        });
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d?.error || "Failed to delete");
        // Go back to list and ask it to refresh
        navigate("/custom-request-view", { replace: true, state: { refresh: true } });
        } catch (e) {
        alert(e.message || "Delete failed");
        } finally {
        setDeleting(false);
        }
    }

    return (
        <div className="max-w-3xl mx-auto p-6">
        <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Request Details</h1>
            <div className="flex gap-2">
            <Link to="/custom-request" className="rounded-full border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100">
                Back to list
            </Link>
            {!isEditing ? (
                <>
                <button
                    onClick={startEdit}
                    className="rounded-full border border-blue-600 text-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-600 hover:text-white"
                >
                    Edit
                </button>
                <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="rounded-full border border-red-600 text-red-600 px-4 py-2 text-sm font-medium hover:bg-red-600 hover:text-white disabled:opacity-60"
                    title="Delete this request"
                >
                    {deleting ? "Deleting…" : "Delete"}
                </button>
                </>
            ) : (
                <>
                <button
                    onClick={cancelEdit}
                    className="rounded-full border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100"
                >
                    Cancel
                </button>
                <button
                    onClick={handleUpdate}
                    disabled={updating}
                    className="rounded-full bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
                >
                    {updating ? "Saving…" : "Save"}
                </button>
                </>
            )}
            </div>
        </div>

 {/*layouts*/}

        {err && <p className="mt-4 text-red-600">{err}</p>}

        {!data ? (
            <div className="mt-6 h-40 animate-pulse rounded-lg bg-gray-100" />
        ) : !isEditing ? (
            <div className="mt-6 space-y-3 rounded-xl border p-5">
            <div><span className="font-medium">Name:</span> {data.fullName}</div>
            <div><span className="font-medium">Email:</span> {data.email}</div>
            <div><span className="font-medium">Phone:</span> {data.phone}</div>
            <div><span className="font-medium">Country:</span> {data.country}</div>
            <div><span className="font-medium">Travellers:</span> {data.travellers}</div>
            <div>
                <span className="font-medium">Dates:</span>{" "}
                {fmt(data?.preferredDates?.start)} – {fmt(data?.preferredDates?.end)}
            </div>
            <div><span className="font-medium">Duration:</span> {data.durationDays} days</div>
            <div><span className="font-medium">Destinations:</span> {data.destinations}</div>
            <div><span className="font-medium">Status:</span> {data.status}</div>
            </div>
        ) : (
            <div className="mt-6 space-y-4 rounded-xl border p-5">
            <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input 
                    type="text" 
                    value={editForm.fullName || ""} 
                    onChange={(e) => {
                        const value = e.target.value.replace(/[0-9]/g, ''); // Remove any digits
                        setEditForm({...editForm, fullName: value});
                    }} 
                    className="w-full rounded border px-3 py-2" 
                    placeholder="Enter name (letters only)"
                />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input 
                    type="email" 
                    value={editForm.email || ""} 
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})} 
                    className="w-full rounded border px-3 py-2" 
                    placeholder="example@domain.com"
                />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">Country/Region</label>
                <select
                    value={editForm.country || "LK"}
                    onChange={(e) => {
                        const code = e.target.value;
                        const match = COUNTRIES_ALLOWED.find(c => c.code === code);
                        const nextDial = match?.dial || editForm.phoneCode;
                        const rules = getPhoneRules(code);
                        const clipped = (editForm.phone || '').slice(0, rules.localMax);
                        
                        setEditForm({
                            ...editForm,
                            country: code,
                            phoneCode: nextDial,
                            phone: clipped,
                        });
                    }}
                    className="w-full rounded border px-3 py-2"
                >
                    {COUNTRIES_ALLOWED.map((c) => (
                        <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">Phone Number</label>
                <div className="flex gap-2">
                    <select
                        value={editForm.phoneCode || "+94"}
                        onChange={(e) => {
                            const newPhoneCode = e.target.value;
                            const newCountry = COUNTRIES_ALLOWED.find(c => c.dial === newPhoneCode);
                            const rules = getPhoneRules(newCountry?.code || 'LK');
                            // Trim phone number if it exceeds new country's max length
                            const trimmedPhone = (editForm.phone || '').slice(0, rules.localMax);
                            setEditForm({...editForm, phoneCode: newPhoneCode, country: newCountry?.code || 'LK', phone: trimmedPhone});
                        }}
                        className="border rounded px-3 py-2 w-32"
                        title="Dialing code"
                    >
                        {COUNTRIES_ALLOWED.map(c => (
                            <option key={c.code} value={c.dial}>
                                {c.code} {c.dial}
                            </option>
                        ))}
                    </select>
                    <input 
                        type="text" 
                        inputMode="tel"
                        value={editForm.phone || ""} 
                        onChange={(e) => {
                            const rules = getPhoneRules(editForm.country || 'LK');
                            const value = e.target.value.replace(/[^0-9]/g, ''); // Only digits
                            const clipped = value.slice(0, rules.localMax); // Limit to max length
                            setEditForm({...editForm, phone: clipped});
                        }}
                        maxLength={getPhoneRules(editForm.country || 'LK').localMax}
                        className="flex-1 border rounded px-3 py-2" 
                        placeholder={getPhoneRules(editForm.country || 'LK').placeholder}
                    />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">Travellers</label>
                <input type="number" min="1" value={editForm.travellers || 1} onChange={(e) => setEditForm({...editForm, travellers: e.target.value})} className="w-full rounded border px-3 py-2" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Start Date</label>
                    <input 
                        type="date" 
                        value={editForm.startDate || ""} 
                        min={todayStr}
                        onChange={(e) => {
                            const newStartDate = e.target.value;
                            setEditForm({...editForm, startDate: newStartDate});
                            // If end date is before new start date, clear it
                            if (editForm.endDate && new Date(editForm.endDate) < new Date(newStartDate)) {
                                setEditForm(prev => ({...prev, startDate: newStartDate, endDate: ""}));
                            }
                        }} 
                        className="w-full rounded border px-3 py-2" 
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">End Date</label>
                    <input 
                        type="date" 
                        value={editForm.endDate || ""} 
                        min={editForm.startDate ? new Date(new Date(editForm.startDate).getTime() + 86400000).toISOString().split('T')[0] : todayStr}
                        onChange={(e) => setEditForm({...editForm, endDate: e.target.value})} 
                        className="w-full rounded border px-3 py-2" 
                    />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">Duration (days)</label>
                <input type="number" min="1" value={editForm.durationDays || 1} onChange={(e) => setEditForm({...editForm, durationDays: e.target.value})} className="w-full rounded border px-3 py-2" />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">Destinations</label>
                <textarea rows="3" value={editForm.destinations || ""} onChange={(e) => setEditForm({...editForm, destinations: e.target.value})} className="w-full rounded border px-3 py-2" />
            </div>
            </div>
        )}
        </div>
    );
}
