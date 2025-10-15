// src/Pages/Admin/ToureGuide/GuideApplicationDetail.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";

/**
 * Fonts (add once in src/index.css or a global stylesheet):
 * --------------------------------------------------------
 * @import url('https://fonts.googleapis.com/css2?family=Gugi&family=Poppins:wght@400;500;600&display=swap');
 * .font-title { font-family: 'Gugi', system-ui, sans-serif; }
 * .font-body  { font-family: 'Poppins', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif; }
 * .inp        { @apply w-full rounded-xl bg-white border border-slate-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-300; }
 */

export default function GuideApplicationDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [g, setG] = useState(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState(null);
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState("");

    // Base API URL (e.g., http://localhost:4000/api)
    const base = useMemo(
        () => process.env.REACT_APP_API_URL || "http://localhost:4000/api",
        []
    );
    // Origin for absolute image URLs (e.g., http://localhost:4000)
    const API_ORIGIN =
        process.env.REACT_APP_API_ORIGIN || new URL(base).origin;

    // ---------- Local helpers ----------
    function getInitials(name) {
        if (!name) return "?";
        const parts = String(name).trim().split(/\s+/).slice(0, 2);
        return parts.map((p) => p[0]?.toUpperCase() || "").join("") || "?";
    }
    function toYyyyMmDd(d) {
        if (!d) return "";
        const dt = new Date(d);
        if (isNaN(dt)) return "";
        const pad = (n) => String(n).padStart(2, "0");
        return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
    }
    function toAbsUrl(u) {
        if (!u) return "";
        if (/^https?:/i.test(u)) return u; // already absolute
        return `${API_ORIGIN}${u.startsWith("/") ? "" : "/"}${u}`;
    }

    // ---------- Fetch doc ----------
    useEffect(() => {
        let live = true;
        setLoading(true);
        fetch(`${base}/guide-applications/${id}`, { credentials: "include" })
        .then(async (r) => {
            const data = await r.json();
            if (!r.ok) throw new Error(data?.error || "Failed");
            return data;
        })
        .then((data) => {
            if (!live) return;
            setG(data);
            setErr("");
        })
        .catch((e) => live && setErr(e.message || "Error"))
        .finally(() => live && setLoading(false));
        return () => {
        live = false;
        };
    }, [base, id]);

    // ---------- Prepare edit form when entering edit mode ----------
    useEffect(() => {
        if (!g || !isEditing) return;
        setForm({
        fullName: g.fullName || "",
        birthday: toYyyyMmDd(g.birthday),
        gender: g.gender || "",
        address: g.address || "",
        phone: g.phone || "",
        email: g.email || "",
        experienceYears: g.experienceYears ?? "",
        education: g.education || "",
        languages: Array.isArray(g.languages)
            ? g.languages.join(", ")
            : g.languages || "",
        availabilityType: g.availabilityType || "full-time",
        daysAvailable: {
            mon: !!g.daysAvailable?.mon,
            tue: !!g.daysAvailable?.tue,
            wed: !!g.daysAvailable?.wed,
            thu: !!g.daysAvailable?.thu,
            fri: !!g.daysAvailable?.fri,
            sat: !!g.daysAvailable?.sat,
            sun: !!g.daysAvailable?.sun,
        },
        expectedRate: g.expectedRate ?? "",
        rateUnit: g.rateUnit || "per_day",
        nationalIdOrPassport: g.nationalIdOrPassport || "",
        guideLicenseNo: g.guideLicenseNo || "",
        emergencyContactName: g.emergencyContactName || "",
        emergencyContactPhone: g.emergencyContactPhone || "",
        });
        setPhotoFile(null);
        setPhotoPreview(g.profilePhotoUrl || "");
    }, [g, isEditing]);

    // ---------- Handlers ----------
    const handleChange = (e) => {
        const { name, value, type, checked, files } = e.target;

        if (name === "phone" || name === "emergencyContactPhone") {
        const digits = value.replace(/\D/g, "").slice(0, 10);
        setForm((f) => ({ ...f, [name]: digits }));
        return;
        }

        if (name === "profilePhoto" && type === "file") {
        const file = files?.[0];
        if (!file) {
            setPhotoFile(null);
            setPhotoPreview(g?.profilePhotoUrl || "");
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            alert("Max photo size: 2MB");
            return;
        }
        setPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(file)); // blob URL preview
        return;
        }

        if (name.startsWith("day_")) {
        const key = name.replace("day_", "");
        setForm((f) => ({
            ...f,
            daysAvailable: { ...f.daysAvailable, [key]: checked },
        }));
        return;
        }

        setForm((f) => ({ ...f, [name]: value }));
    };

    const handleSave = async () => {
        if (!form) return;
        if (!form.fullName.trim()) return alert("Full name required");
        if (!form.birthday) return alert("Birthday required");
        if (String(form.phone).length !== 10) return alert("Phone must be 10 digits");
        if (String(form.emergencyContactPhone).length !== 10)
        return alert("Emergency phone must be 10 digits");
        if (!/.+@.+\..+/.test(form.email)) return alert("Invalid email");

        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => {
        if (k === "daysAvailable") fd.append(k, JSON.stringify(v));
        else fd.append(k, v ?? "");
        });
        if (photoFile) fd.append("profilePhoto", photoFile);

        setSaving(true);
        try {
        const resp = await fetch(`${base}/guide-applications/${id}`, {
            method: "PUT",
            body: fd,
            credentials: "include",
        });
        const json = await resp.json();
        if (!resp.ok) {
            if (json?.errors) {
            const firstErr = Object.values(json.errors)[0];
            alert(firstErr || "Update failed");
            } else {
            alert(json?.error || "Update failed");
            }
            return;
        }
        setG(json); // updated doc
        setIsEditing(false);
        alert("Updated ✅");
        } catch (e) {
        console.error(e);
        alert("Network error");
        } finally {
        setSaving(false);
        }
    };

    // const handleDelete = async () => {
    //     if (!window.confirm("Delete this application? This cannot be undone.")) return;
    //     try {
    //     const resp = await fetch(`${base}/guide-applications/${id}`, {
    //         method: "DELETE",
    //         credentials: "include",
    //     });
    //     const json = await resp.json();
    //     if (!resp.ok) {
    //         alert(json?.error || "Delete failed");
    //         return;
    //     }
    //     alert("This application has been rejected ✅");
    //     navigate("/admin/guide-applications", { replace: true });
    //     } catch (e) {
    //     console.error(e);
    //     alert("Network error");
    //     }
    // };

    // ---------- Render ----------
    if (loading) return <div className="p-8">Loading…</div>;
    if (err) return <div className="p-8 text-red-600">{err}</div>;
    if (!g) return null;

    return (
        <div className="min-h-screen bg-white text-gray-900 font-body">
        <div className="max-w-5xl mx-auto px-6 md:px-10 py-8">
            {/* Action bar (right-aligned) */}
            <div className="flex">
            <div className="flex gap-3 ml-auto justify-end">
                {!isEditing && (
                <>
                    {/* <button
                    onClick={() => setIsEditing(true)}
                    className="rounded-full border px-4 py-2 text-sm hover:bg-gray-900 hover:text-white"
                    >
                    Edit
                    </button> */}
                </>
                )}
                <Link
                to="/admin/guide-applications"
                className="rounded-full border px-4 py-2 text-sm hover:bg-gray-900 hover:text-white"
                >
                Back
                </Link>
            </div>
            </div>

            {/* VIEW MODE */}
            {!isEditing && (
            <>
                <HeaderBlock
                photo={g.profilePhotoUrl}
                fullName={g.fullName}
                getInitials={getInitials}
                toAbsUrl={toAbsUrl}
                />
                <ViewSections g={g} />
            </>
            )}

            {/* EDIT MODE */}
            {isEditing && form && (
            <EditForm
                form={form}
                photoPreview={photoPreview}
                onChange={handleChange}
                onCancel={() => setIsEditing(false)}
                onSave={handleSave}
                saving={saving}
            />
            )}
        </div>
        </div>
    );
    }

    // ---------- View-mode bits ----------
    function HeaderBlock({ photo, fullName, getInitials, toAbsUrl }) {
    const src = toAbsUrl(photo);
    return (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-[160px_1fr] gap-6">
        <div>
            {src ? (
            <img
                src={src}
                alt={fullName}
                className="h-40 w-40 object-cover rounded-2xl border"
                onError={(e) => {
                // clear src so fallback renders
                e.currentTarget.src = "";
                e.currentTarget.alt = fullName || "Profile";
                }}
            />
            ) : (
            <div className="h-40 w-40 rounded-2xl bg-[#F1F7FF] grid place-items-center text-gray-700 font-semibold border">
                {getInitials(fullName)}
            </div>
            )}
        </div>
        <div className="flex items-end">
            <h2 className="text-2xl md:text-3xl font-semibold">{fullName}</h2>
        </div>
        </div>
    );
    }

    function ViewSections({ g }) {
    const fmtDate = (d) =>
        d
        ? new Date(d).toLocaleDateString("en-LK", {
            year: "numeric",
            month: "long",
            day: "2-digit",
            })
        : "";
    const yesno = (b) => (b ? "Yes" : "No");

    return (
        <div className="mt-8 space-y-8">
        <SectionCard title="Personal">
            <KVGrid>
            <Row k="Birthday" v={fmtDate(g.birthday)} />
            <Row k="Gender" v={g.gender} />
            <Row k="Address" v={g.address} span />
            <Row k="Phone" v={g.phone} />
            <Row k="Email" v={g.email} />
            </KVGrid>
        </SectionCard>

        <SectionCard title="Professional">
            <KVGrid>
            <Row k="Experience (years)" v={g.experienceYears ?? "—"} />
            <Row k="Availability" v={g.availabilityType} />
            <Row
                k="Expected Rate"
                v={
                g.expectedRate
                    ? `LKR ${g.expectedRate} (${g.rateUnit.replace("_", "/")})`
                    : "—"
                }
            />
            <Row
                k="Languages"
                v={Array.isArray(g.languages) ? g.languages.join(", ") : g.languages}
                span
            />
            <Row k="Education" v={g.education || "—"} span />
            <Row
                k="Days Available"
                v={`Mon ${yesno(g.daysAvailable?.mon)} · Tue ${yesno(
                g.daysAvailable?.tue
                )} · Wed ${yesno(g.daysAvailable?.wed)} · Thu ${yesno(
                g.daysAvailable?.thu
                )} · Fri ${yesno(g.daysAvailable?.fri)} · Sat ${yesno(
                g.daysAvailable?.sat
                )} · Sun ${yesno(g.daysAvailable?.sun)}`}
                span
            />
            </KVGrid>
        </SectionCard>

        <SectionCard title="Licensing & Verification">
            <KVGrid>
            <Row k="NIC / Passport" v={g.nationalIdOrPassport} />
            <Row k="Guide License No" v={g.guideLicenseNo || "—"} />
            <Row k="Emergency Contact Name" v={g.emergencyContactName} />
            <Row k="Emergency Contact Phone" v={g.emergencyContactPhone} />
            </KVGrid>
        </SectionCard>
        </div>
    );
    }

    function SectionCard({ title, children }) {
    return (
        <section className="rounded-2xl bg-[#F1F7FF] border border-slate-200 p-5">
        <h3 className="font-title text-base tracking-wide text-slate-700 mb-3">
            {title}
        </h3>
        {children}
        </section>
    );
    }
    function KVGrid({ children }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    );
    }
    function Row({ k, v, span }) {
    return (
        <div className={span ? "md:col-span-2" : ""}>
        <span className="font-title text-sm text-slate-700 mr-1">{k}:</span>
        <span className="font-body">{v}</span>
        </div>
    );
    }

    // ---------- Edit-mode ----------
    function EditForm({ form, photoPreview, onChange, onCancel, onSave, saving }) {
    const days = [
        { key: "mon", label: "Mon" },
        { key: "tue", label: "Tue" },
        { key: "wed", label: "Wed" },
        { key: "thu", label: "Thu" },
        { key: "fri", label: "Fri" },
        { key: "sat", label: "Sat" },
        { key: "sun", label: "Sun" },
    ];

    return (
        <form onSubmit={(e) => (e.preventDefault(), onSave())} className="mt-6 space-y-8">
        <section className="rounded-2xl bg-[#F1F7FF] border border-slate-200 p-5">
            <h3 className="font-title text-base tracking-wide text-slate-700 mb-3">
            Edit Application
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-6">
            <div>
                {photoPreview ? (
                <img
                    src={photoPreview}
                    alt="Preview"
                    className="h-40 w-40 object-cover rounded-2xl border"
                />
                ) : (
                <div className="h-40 w-40 rounded-2xl bg-white grid place-items-center border">
                    No Photo
                </div>
                )}
                <label className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 bg-gray-900 text-white rounded-full cursor-pointer hover:opacity-90">
                <input
                    type="file"
                    name="profilePhoto"
                    accept="image/*"
                    onChange={onChange}
                    className="hidden"
                />
                Change Photo
                </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Full Name">
                <input name="fullName" value={form.fullName} onChange={onChange} className="inp" />
                </Field>
                <Field label="Birthday">
                <input type="date" name="birthday" value={form.birthday} onChange={onChange} className="inp" />
                </Field>
                <Field label="Gender">
                <select name="gender" value={form.gender} onChange={onChange} className="inp">
                    <option value="">Select…</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not">Prefer not to say</option>
                </select>
                </Field>
                <Field label="Phone (10 digits)">
                <input name="phone" inputMode="numeric" pattern="[0-9]*" maxLength={10} value={form.phone} onChange={onChange} className="inp" />
                </Field>
                <Field label="Email">
                <input type="email" name="email" value={form.email} onChange={onChange} className="inp" />
                </Field>
                <Field label="Address" full>
                <textarea name="address" value={form.address} onChange={onChange} rows={3} className="inp" />
                </Field>

                <Field label="Experience (years)">
                <input type="number" min="0" max="60" step="1" name="experienceYears" value={form.experienceYears} onChange={onChange} className="inp" />
                </Field>
                <Field label="Availability">
                <div className="flex items-center gap-6">
                    <label className="inline-flex items-center gap-2">
                    <input type="radio" name="availabilityType" value="full-time" checked={form.availabilityType === "full-time"} onChange={onChange} /> Full-time
                    </label>
                    <label className="inline-flex items-center gap-2">
                    <input type="radio" name="availabilityType" value="part-time" checked={form.availabilityType === "part-time"} onChange={onChange} /> Part-time
                    </label>
                </div>
                </Field>

                <Field label="Expected Rate">
                <div className="flex gap-3">
                    <input type="number" min="0" step="1" name="expectedRate" value={form.expectedRate} onChange={onChange} className="inp w-40" />
                    <select name="rateUnit" value={form.rateUnit} onChange={onChange} className="inp">
                    <option value="per_day">LKR / day</option>
                    <option value="per_hour">LKR / hour</option>
                    </select>
                </div>
                </Field>

                <Field label="Languages (comma separated)">
                <input name="languages" value={form.languages} onChange={onChange} className="inp" />
                </Field>
                <Field label="Education" full>
                <textarea name="education" value={form.education} onChange={onChange} rows={3} className="inp" />
                </Field>

                <Field label="Days Available" full>
                <div className="flex flex-wrap gap-3">
                    {days.map((d) => (
                    <label key={d.key} className="inline-flex items-center gap-2">
                        <input type="checkbox" name={`day_${d.key}`} checked={!!form.daysAvailable[d.key]} onChange={onChange} />
                        <span>{d.label}</span>
                    </label>
                    ))}
                </div>
                </Field>

                <Field label="NIC / Passport">
                <input name="nationalIdOrPassport" value={form.nationalIdOrPassport} onChange={onChange} className="inp" />
                </Field>
                <Field label="Guide License No">
                <input name="guideLicenseNo" value={form.guideLicenseNo} onChange={onChange} className="inp" />
                </Field>
                <Field label="Emergency Contact Name">
                <input name="emergencyContactName" value={form.emergencyContactName} onChange={onChange} className="inp" />
                </Field>
                <Field label="Emergency Contact Phone (10 digits)">
                <input name="emergencyContactPhone" inputMode="numeric" pattern="[0-9]*" maxLength={10} value={form.emergencyContactPhone} onChange={onChange} className="inp" />
                </Field>
            </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={onCancel} className="rounded-full border px-5 py-2 text-sm">
                Cancel
            </button>
            <button
                type="submit"
                disabled={saving}
                className={`rounded-full border px-5 py-2 text-sm ${
                saving ? "opacity-60 cursor-wait" : "hover:bg-gray-900 hover:text-white"
                }`}
            >
                {saving ? "Saving…" : "Save"}
            </button>
            </div>
        </section>
        </form>
    );
    }

    function Field({ label, children, full }) {
    return (
        <div className={full ? "md:col-span-2" : ""}>
        <label className="block font-title text-sm text-slate-700 mb-1">{label}</label>
        {children}
        </div>
    );
}
