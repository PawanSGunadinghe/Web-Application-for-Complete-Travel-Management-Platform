import React, { useMemo, useState } from "react";
// import { useNavigate } from "react-router-dom"; // optional if you want to redirect after submit

export default function GuideApplicationForm() {
  // const navigate = useNavigate(); // optional

    const [form, setForm] = useState({
        // Personal
        fullName: "",
        birthday: "",
        gender: "",
        address: "",
        phone: "",
        email: "",
        profilePhoto: null, // File
        // Professional
        experienceYears: "",
        education: "",
        languages: "", // "English, Sinhala, Tamil"
        availabilityType: "full-time",
        daysAvailable: { mon: false, tue: false, wed: false, thu: false, fri: false, sat: false, sun: false },
        expectedRate: "",
        rateUnit: "per_day",
        // Licensing & Verification
        nationalIdOrPassport: "",
        guideLicenseNo: "",
        emergencyContactName: "",
        emergencyContactPhone: "",
    });

    const [errors, setErrors] = useState({});
    const [photoPreview, setPhotoPreview] = useState("");

    const maxBirthdayStr = useMemo(() => {
        const d = new Date();
        d.setFullYear(d.getFullYear() - 21);
        const pad = (n) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked, files } = e.target;

        // phone fields: digits only, max 10
        if (name === "phone" || name === "emergencyContactPhone") {
        const digits = value.replace(/\D/g, "").slice(0, 10);
        setForm((f) => ({ ...f, [name]: digits }));
        setErrors((err) => ({ ...err, [name]: digits.length === 10 ? "" : "Must be 10 digits" }));
        return;
        }

        // file
        if (name === "profilePhoto" && type === "file") {
        const file = files?.[0];
        if (!file) {
            setForm((f) => ({ ...f, profilePhoto: null }));
            setPhotoPreview("");
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            setErrors((err) => ({ ...err, profilePhoto: "Max size 2MB" }));
            return;
        }
        setForm((f) => ({ ...f, profilePhoto: file }));
        setErrors((err) => ({ ...err, profilePhoto: "" }));
        setPhotoPreview(URL.createObjectURL(file));
        return;
        }

        // daysAvailable
        if (name.startsWith("day_")) {
        const key = name.replace("day_", "");
        setForm((f) => ({ ...f, daysAvailable: { ...f.daysAvailable, [key]: checked } }));
        return;
        }

        // default
        setForm((f) => ({ ...f, [name]: value }));

        // live checks
        if (name === "email") {
        setErrors((err) => ({ ...err, email: validateEmail(value) ? "" : "Invalid email" }));
        }
        if (name === "birthday") {
        setErrors((err) => ({ ...err, birthday: is21OrOlder(value) ? "" : "Must be 21+" }));
        }
        if (name === "nationalIdOrPassport") {
        setErrors((err) => ({ ...err, nationalIdOrPassport: validateNICorPassport(value) ? "" : "Invalid NIC/Passport" }));
        }
    };

    const handleClear = () => {
        setForm({
        fullName: "",
        birthday: "",
        gender: "",
        address: "",
        phone: "",
        email: "",
        profilePhoto: null,
        experienceYears: "",
        education: "",
        languages: "",
        availabilityType: "full-time",
        daysAvailable: { mon: false, tue: false, wed: false, thu: false, fri: false, sat: false, sun: false },
        expectedRate: "",
        rateUnit: "per_day",
        nationalIdOrPassport: "",
        guideLicenseNo: "",
        emergencyContactName: "",
        emergencyContactPhone: "",
        });
        setErrors({});
        setPhotoPreview("");
    };

    const validateAll = () => {
        const next = {};
        if (!form.fullName.trim()) next.fullName = "Required";

        if (!form.birthday) next.birthday = "Required";
        else if (!is21OrOlder(form.birthday)) next.birthday = "Must be 21+";

        if (!form.gender) next.gender = "Required";
        if (!form.address.trim()) next.address = "Required";

        if (form.phone.length !== 10) next.phone = "Must be 10 digits";
        if (!validateEmail(form.email)) next.email = "Invalid email";

        if (!validateNICorPassport(form.nationalIdOrPassport)) next.nationalIdOrPassport = "Invalid NIC/Passport";

        if (!form.emergencyContactName.trim()) next.emergencyContactName = "Required";
        if (form.emergencyContactPhone.length !== 10) next.emergencyContactPhone = "Must be 10 digits";

        if (form.experienceYears !== "") {
        const n = Number(form.experienceYears);
        if (!Number.isFinite(n) || n < 0 || n > 60) next.experienceYears = "0 - 60";
        }
        if (form.expectedRate !== "") {
        const n = Number(form.expectedRate);
        if (!Number.isFinite(n) || n <= 0) next.expectedRate = "Enter a positive number";
        }
        return next;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const next = validateAll();
        setErrors(next);
        if (Object.keys(next).length) return;

        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => {
        if (k === "daysAvailable") fd.append(k, JSON.stringify(v));
        else if (k === "profilePhoto" && v) fd.append("profilePhoto", v);
        else fd.append(k, v ?? "");
        });

        try {
        const base = process.env.REACT_APP_API_URL || "http://localhost:4000/api";
        const resp = await fetch(`${base}/guide-applications`, {
            method: "POST",
            body: fd,
            credentials: "include",
        });
        const json = await resp.json();
        if (!resp.ok) {
            if (json?.errors) setErrors((prev) => ({ ...prev, ...json.errors }));
            else alert(json?.error || "Submit failed");
            return;
        }
        alert("Submitted! ✅");
        handleClear();
        // navigate(`/admin/guide-application/${json.id}`); // optional
        } catch (err) {
        console.error(err);
        alert("Network error. Is the API running?");
        }
    };

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
        <div className="min-h-screen bg-white text-gray-900">
        <form onSubmit={handleSubmit} className="max-w-5xl mx-auto px-6 md:px-10 py-10 space-y-10">
            {/* Personal Information */}
            <SectionCard title="Personal Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Full Name" error={errors.fullName}>
                <input
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    className="w-full rounded-md bg-gray-100 border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    placeholder="e.g., Saman Perera"
                />
                </Field>

                <Field label="Birthday" error={errors.birthday} hint="Must be 21+">
                <input
                    type="date"
                    name="birthday"
                    value={form.birthday}
                    onChange={handleChange}
                    max={maxBirthdayStr}
                    className={`w-full rounded-md bg-gray-100 border px-4 py-2.5 focus:outline-none focus:ring-2 ${
                    errors.birthday ? "border-red-500 focus:ring-red-300" : "border-gray-200 focus:ring-gray-300"
                    }`}
                />
                </Field>

                <Field label="Gender" error={errors.gender}>
                <select
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    className="w-full rounded-md bg-gray-100 border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                    <option value="">Select…</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not">Prefer not to say</option>
                </select>
                </Field>

                <Field label="Phone Number" error={errors.phone} hint="10 digits">
                <input
                    name="phone"
                    inputMode="numeric"
                    type="tel"
                    pattern="[0-9]*"
                    maxLength={10}
                    value={form.phone}
                    onChange={handleChange}
                    className={`w-full rounded-md bg-gray-100 border px-4 py-2.5 focus:outline-none focus:ring-2 ${
                    errors.phone ? "border-red-500 focus:ring-red-300" : "border-gray-200 focus:ring-gray-300"
                    }`}
                    placeholder="e.g., 0771234567"
                />
                </Field>

                <Field label="Email" error={errors.email}>
                <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    className={`w-full rounded-md bg-gray-100 border px-4 py-2.5 focus:outline-none focus:ring-2 ${
                    errors.email ? "border-red-500 focus:ring-red-300" : "border-gray-200 focus:ring-gray-300"
                    }`}
                    placeholder="e.g., saman@example.com"
                />
                </Field>

                <Field label="Address" error={errors.address} full>
                <textarea
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    rows={3}
                    className="w-full rounded-md bg-gray-100 border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-300 resize-y"
                    placeholder="Street, City, District"
                />
                </Field>

                <Field label="Profile Photo" error={errors.profilePhoto}>
                <div className="flex items-center gap-4">
                    <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-md cursor-pointer hover:opacity-90">
                    <input type="file" name="profilePhoto" accept="image/*" onChange={handleChange} className="hidden" />
                    <span>Upload</span>
                    </label>
                    {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="h-16 w-16 rounded-md object-cover border" />
                    ) : (
                    <span className="text-sm text-gray-500">PNG/JPG, max 2MB</span>
                    )}
                </div>
                </Field>
            </div>
            </SectionCard>

            {/* Professional Information */}
            <SectionCard title="Professional Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Years of Experience" error={errors.experienceYears}>
                <input
                    name="experienceYears"
                    type="number"
                    min={0}
                    max={60}
                    step="1"
                    value={form.experienceYears}
                    onChange={handleChange}
                    className="w-full rounded-md bg-gray-100 border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    placeholder="e.g., 3"
                />
                </Field>

                <Field label="Languages Spoken">
                <input
                    name="languages"
                    value={form.languages}
                    onChange={handleChange}
                    className="w-full rounded-md bg-gray-100 border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    placeholder="e.g., English, Sinhala, Tamil"
                />
                </Field>

                <Field label="Educational Qualifications" full>
                <textarea
                    name="education"
                    value={form.education}
                    onChange={handleChange}
                    rows={4}
                    className="w-full rounded-md bg-gray-100 border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-300 resize-y"
                    placeholder="Diploma/Certificate, Institution, Year"
                />
                </Field>

                <Field label="Availability (Type)">
                <div className="flex items-center gap-6">
                    <label className="inline-flex items-center gap-2">
                    <input
                        type="radio"
                        name="availabilityType"
                        value="full-time"
                        checked={form.availabilityType === "full-time"}
                        onChange={handleChange}
                    />
                    <span>Full-time</span>
                    </label>
                    <label className="inline-flex items-center gap-2">
                    <input
                        type="radio"
                        name="availabilityType"
                        value="part-time"
                        checked={form.availabilityType === "part-time"}
                        onChange={handleChange}
                    />
                    <span>Part-time</span>
                    </label>
                </div>
                </Field>

                <Field label="Days Available" full>
                <div className="flex flex-wrap gap-3">
                    {days.map((d) => (
                    <label key={d.key} className="inline-flex items-center gap-2">
                        <input type="checkbox" name={`day_${d.key}`} checked={form.daysAvailable[d.key]} onChange={handleChange} />
                        <span>{d.label}</span>
                    </label>
                    ))}
                </div>
                </Field>

                <Field label="Expected Salary/Rate">
                <div className="flex gap-3">
                    <input
                    name="expectedRate"
                    type="number"
                    min={0}
                    step="1"
                    value={form.expectedRate}
                    onChange={handleChange}
                    className={`w-40 rounded-md bg-gray-100 border px-4 py-2.5 focus:outline-none focus:ring-2 ${
                        errors.expectedRate ? "border-red-500 focus:ring-red-300" : "border-gray-200 focus:ring-gray-300"
                    }`}
                    placeholder="e.g., 8000"
                    />
                    <select
                    name="rateUnit"
                    value={form.rateUnit}
                    onChange={handleChange}
                    className="rounded-md bg-gray-100 border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    >
                    <option value="per_day">LKR / day</option>
                    <option value="per_hour">LKR / hour</option>
                    </select>
                </div>
                {errors.expectedRate && <p className="mt-1 text-sm text-red-600">{errors.expectedRate}</p>}
                </Field>
            </div>
            </SectionCard>

            {/* Licensing & Verification */}
            <SectionCard title="Licensing & Verification">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="National ID / Passport Number" error={errors.nationalIdOrPassport}>
                <input
                    name="nationalIdOrPassport"
                    value={form.nationalIdOrPassport}
                    onChange={handleChange}
                    className={`w-full rounded-md bg-gray-100 border px-4 py-2.5 focus:outline-none focus:ring-2 ${
                    errors.nationalIdOrPassport ? "border-red-500 focus:ring-red-300" : "border-gray-200 focus:ring-gray-300"
                    }`}
                    placeholder="NIC (123456789V) or Passport (N1234567)"
                />
                </Field>

                <Field label="Tour Guide License Number">
                <input
                    name="guideLicenseNo"
                    value={form.guideLicenseNo}
                    onChange={handleChange}
                    className="w-full rounded-md bg-gray-100 border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    placeholder="e.g., TG-12345"
                />
                </Field>

                <Field label="Emergency Contact Name" error={errors.emergencyContactName}>
                <input
                    name="emergencyContactName"
                    value={form.emergencyContactName}
                    onChange={handleChange}
                    className={`w-full rounded-md bg-gray-100 border px-4 py-2.5 focus:outline-none focus:ring-2 ${
                    errors.emergencyContactName ? "border-red-500 focus:ring-red-300" : "border-gray-200 focus:ring-gray-300"
                    }`}
                    placeholder="e.g., Kavindu Perera"
                />
                </Field>

                <Field label="Emergency Contact Phone" error={errors.emergencyContactPhone} hint="10 digits">
                <input
                    name="emergencyContactPhone"
                    inputMode="numeric"
                    type="tel"
                    pattern="[0-9]*"
                    maxLength={10}
                    value={form.emergencyContactPhone}
                    onChange={handleChange}
                    className={`w-full rounded-md bg-gray-100 border px-4 py-2.5 focus:outline-none focus:ring-2 ${
                    errors.emergencyContactPhone ? "border-red-500 focus:ring-red-300" : "border-gray-200 focus:ring-gray-300"
                    }`}
                    placeholder="e.g., 0712345678"
                />
                </Field>
            </div>
            </SectionCard>

            {/* Actions */}
            <div className="flex justify-end gap-6 pt-2">
            <button
                type="button"
                onClick={handleClear}
                className="rounded-full border border-gray-700 px-7 py-2.5 text-sm font-medium hover:bg-gray-50 active:scale-95 transition"
            >
                Clear
            </button>
            <button
                type="submit"
                className="rounded-full border border-gray-700 px-7 py-2.5 text-sm font-medium hover:bg-gray-900 hover:text-white active:scale-95 transition"
            >
                Submit
            </button>
            </div>
        </form>
        </div>
    );
    }

    function SectionCard({ title, children }) {
    return (
        <section className="bg-slate-400/10 border border-gray-200 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-5">{title}</h2>
        {children}
        </section>
    );
    }

    function Field({ label, error, hint, full, children }) {
    return (
        <div className={full ? "md:col-span-2" : ""}>
        <label className="block font-medium mb-1">{label}</label>
        {children}
        <div className="flex items-center gap-3 mt-1 min-h-[1.25rem]">
            {error ? <p className="text-sm text-red-600">{error}</p> : hint ? <p className="text-xs text-gray-500">{hint}</p> : null}
        </div>
        </div>
    );
    }

    // helpers
    function validateEmail(email) {
    if (!email) return false;
    return /.+@.+\..+/.test(email);
    }
    function is21OrOlder(yyyyMmDd) {
    if (!yyyyMmDd) return false;
    const b = new Date(yyyyMmDd);
    if (isNaN(b)) return false;
    const now = new Date();
    const cutoff = new Date(now.getFullYear() - 21, now.getMonth(), now.getDate());
    return b <= cutoff;
    }
    function validateNICorPassport(val) {
    if (!val) return false;
    const s = String(val).trim();
    const nicOld = /^\d{9}[VvXx]$/; // 123456789V
    const nicNew = /^\d{12}$/;      // 200012301234
    const passport = /^[A-Za-z][0-9]{7}$/; // N1234567
    return nicOld.test(s) || nicNew.test(s) || passport.test(s);
}
