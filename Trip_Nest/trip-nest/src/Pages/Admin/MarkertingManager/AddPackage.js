import { useMemo, useState } from "react";
import { Plus, Minus, Image as ImageIcon, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

    // Image uploader (drag & drop + preview)
    function ImageUploader({ images, setImages }) {
    const onFiles = (files) => {
        const fileArr = Array.from(files || []);
        if (!fileArr.length) return;
        const next = fileArr.map((f) => ({ file: f, url: URL.createObjectURL(f) }));
        setImages((prev) => [...prev, ...next]);
    };

    return (
        <div>
        <label className="block mb-2 font-medium">Upload Images</label>
        <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
            e.preventDefault();
            onFiles(e.dataTransfer.files);
            }}
            className="relative rounded-2xl border-2 border-dashed bg-gray-100 text-gray-700 grid place-items-center h-48 md:h-56 select-none"
        >
            <div className="text-center">
            <ImageIcon className="mx-auto mb-2" />
            <p className="font-semibold">Drag & drop or click to upload</p>
            <p className="text-xs text-gray-500">PNG, JPG up to ~5MB each</p>
            </div>
            <input
            type="file"
            accept="image/*"
            multiple
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={(e) => onFiles(e.target.files)}
            />
        </div>
        {images.length > 0 && (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((img, idx) => (
                <div key={idx} className="relative group">
                <img src={img.url} alt={`preview-${idx}`} className="h-28 w-full object-cover rounded-xl border" />
                <button
                    type="button"
                    onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                    className="absolute top-2 right-2 p-1 rounded-full bg-white/90 shadow hover:bg-white"
                    aria-label="Remove image"
                >
                    <Trash2 className="h-4 w-4" />
                </button>
                </div>
            ))}
            </div>
        )}
        </div>
    );
    }

    export default function NewPackagePage() {

    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: "",
        about: "",
        maxTourist: 10,
        startDate: "",
        endDate: "",
        contact: "",
        email: "",
        price: "",
        guide: "",
    });
    const [images, setImages] = useState([]);
    const [errors, setErrors] = useState({});

    // today in YYYY-MM-DD for date input min attributes
    const today = useMemo(() => new Date().toISOString().split("T")[0], []);

    // Calculate max date (1 year from today)
    const maxStartDate = useMemo(() => {
        const d = new Date();
        d.setFullYear(d.getFullYear() + 1);
        return d.toISOString().split("T")[0];
    }, []);

    // Calculate max end date based on start date (6 months after start date)
    const maxEndDate = useMemo(() => {
        if (!form.startDate) return null;
        const startDate = new Date(form.startDate);
        startDate.setMonth(startDate.getMonth() + 6);
        return startDate.toISOString().split("T")[0];
    }, [form.startDate]);

    const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const clear = () => {
        setForm({ name: "", about: "", maxTourist: 10, startDate: "", endDate: "", contact: "", email: "", price: "", guide: "" });
        setImages([]);
        setErrors({});
    };

    const validate = () => {
        const next = {};

        // Dates: cannot be in the past
        if (!form.startDate) next.startDate = "Start date is required";
        else if (form.startDate < today) next.startDate = "Start date can't be in the past";

        if (!form.endDate) next.endDate = "End date is required";
        else if (form.endDate < today) next.endDate = "End date can't be in the past";
        else if (form.startDate && form.endDate <= form.startDate) next.endDate = "End date must be at least one day after start date";

        // Contact number: digits only, max 10
        if (!form.contact) next.contact = "Contact number is required";
        else if (!/^\d{1,10}$/.test(form.contact)) next.contact = "Only digits, max 10";

        // Email basic check
        if (!form.email) next.email = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email)) next.email = "Enter a valid email";

        // Name required (reasonable)
        if (!form.name.trim()) next.name = "Package name is required";

        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const submit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        const fd = new FormData();
        // append scalar fields
        fd.append("name", form.name);
        fd.append("about", form.about);
        fd.append("maxTourist", String(form.maxTourist ?? 0));
        fd.append("startDate", form.startDate);
        fd.append("endDate", form.endDate);
        fd.append("contact", form.contact);
        fd.append("email", form.email);
        fd.append("price", String(form.price ?? 0));
        fd.append("guide", form.guide);

        // append files (field name must be 'images' to match route)
        images.forEach((img) => {
            if (img?.file) fd.append("images", img.file);
        });

        try {
            const base = process.env.REACT_APP_API_URL || "http://localhost:4000/api";
            const resp = await fetch(`${base}/packages`, {
            method: "POST",
            body: fd,                // don't set Content-Type manually
            credentials: "include",
            });
            const json = await resp.json();
            if (!resp.ok) {
            if (json?.errors) setErrors((prev) => ({ ...prev, ...json.errors }));
            else alert(json?.error || "Submit failed");
            return;
            }
            alert("Package submitted! ✅");
            navigate(`/admin`);
            clear();
        } catch (err) {
            console.error(err);
            alert("Network error. Is the API running?");
        }
    };



    return (
        <div className="min-h-screen bg-white text-gray-900">

        <main className="max-w-6xl mx-auto px-4 py-8">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">New Packages</h1>

            <form onSubmit={submit} className="mt-8 space-y-6">
            {/* Package name */}
            <div className="grid gap-2">
                <label className="text-sm font-medium">Package Name:</label>
                <input
                type="text"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                className={`w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 ${errors.name ? "border-red-500 focus:ring-red-500" : "focus:ring-sky-500"}`}
                placeholder="e.g. Kandy & Ella 3D2N"
                required
                />
                {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
            </div>

            {/* Upload Images */}
            <ImageUploader images={images} setImages={setImages} />

            {/* About */}
            <div className="grid gap-2">
                <label className="text-sm font-medium">Add About this Property</label>
                <textarea
                value={form.about}
                onChange={(e) => setField("about", e.target.value)}
                rows={4}
                className="w-full rounded-xl border px-3 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="Write a short description..."
                />
            </div>

            {/* Max tourist */}
            <div className="flex items-center gap-4 text-sm">
                <span className="font-medium">Max Tourist Allowed:</span>
                <div className="inline-flex items-center border rounded-full overflow-hidden">
                <button type="button" className="px-3 py-1 hover:bg-gray-100" onClick={() => setField("maxTourist", Math.max(1, form.maxTourist - 1))}>
                    <Minus className="h-4 w-4" />
                </button>
                <input
                    type="number"
                    value={form.maxTourist}
                    onChange={(e) => {
                        const value = Number(e.target.value);
                        setField("maxTourist", Math.max(1, value));
                    }}
                    className="w-16 text-center outline-none"
                    min={1}
                />
                <button type="button" className="px-3 py-1 hover:bg-gray-100" onClick={() => setField("maxTourist", form.maxTourist + 1)}>
                    <Plus className="h-4 w-4" />
                </button>
                </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid gap-2">
                <label className="text-sm font-medium">Start Date:</label>
                <input
                    type="date"
                    value={form.startDate}
                    min={today}
                    onChange={(e) => setField("startDate", e.target.value)}
                    className={`w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 ${errors.startDate ? "border-red-500 focus:ring-red-500" : "focus:ring-sky-500"}`}
                    required
                />
                {errors.startDate && <p className="text-xs text-red-600">{errors.startDate}</p>}
                </div>
                <div className="grid gap-2">
                <label className="text-sm font-medium">End Date:</label>
                <input
                    type="date"
                    value={form.endDate}
                    min={form.startDate ? new Date(new Date(form.startDate).getTime() + 86400000).toISOString().split('T')[0] : today}
                    onChange={(e) => setField("endDate", e.target.value)}
                    className={`w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 ${errors.endDate ? "border-red-500 focus:ring-red-500" : "focus:ring-sky-500"}`}
                    required
                />
                {errors.endDate && <p className="text-xs text-red-600">{errors.endDate}</p>}
                </div>
            </div>

            {/* Contact + Email + Price + Guide */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid gap-2">
                <label className="text-sm font-medium">Contact Number</label>
                <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={form.contact}
                    onChange={(e) => {
                    const onlyDigits = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setField("contact", onlyDigits);
                    }}
                    className={`w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 ${errors.contact ? "border-red-500 focus:ring-red-500" : "focus:ring-sky-500"}`}
                    placeholder="e.g. 0712345678"
                />
                {errors.contact && <p className="text-xs text-red-600">{errors.contact}</p>}
                </div>
                <div className="grid gap-2">
                <label className="text-sm font-medium">Email Address</label>
                <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    className={`w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 ${errors.email ? "border-red-500 focus:ring-red-500" : "focus:ring-sky-500"}`}
                    placeholder="e.g. hello@tripnest.com"
                />
                {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
                </div>
                <div className="grid gap-2">
                <label className="text-sm font-medium">Price per One Tourist</label>
                <input
                    type="number"
                    value={form.price}
                    onChange={(e) => {
                        const value = Number(e.target.value);
                        setField("price", value > 0 ? value : "");
                    }}
                    className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="e.g. 250"
                    min={1}
                />
                {errors.price && <p className="text-sm text-red-600">{errors.price}</p>}
                </div>
                <div className="grid gap-2">
                <label className="text-sm font-medium">Airport Pickup</label>
                <input
                    type="text"
                    value={form.guide}
                    onChange={(e) => {
                        const lettersOnly = e.target.value.replace(/[^A-Za-z\s]/g, '');
                        setField("guide", lettersOnly);
                    }}
                    className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="e.g. John Doe"
                />
                {errors.guide && <p className="text-sm text-red-600">{errors.guide}</p>}
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
                <button
                type="button"
                onClick={clear}
                className="px-6 py-2 rounded-full border bg-white hover:bg-gray-50 shadow-sm"
                >
                Clear
                </button>
                <button
                type="submit"
                className="px-6 py-2 rounded-full bg-black text-white hover:bg-sky-700 shadow-sm"
                >
                Submit
                </button>
            </div>
            </form>
        </main>
        </div>
    );
}
