import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function PackageDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const baseUrl = useMemo(
        () => process.env.REACT_APP_API_URL || "http://localhost:4000/api",
        []
    );

    const [pkg, setPkg] = useState(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    // edit state
    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState({
        name: "",
        about: "",
        maxTourist: 10,
        startDate: "",
        endDate: "",
        contact: "",
        email: "",
        price: 0,
        guide: "",
    });
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [formErrors, setFormErrors] = useState({}); // server-side validation map

    const apiBase = process.env.REACT_APP_API_URL || "http://localhost:4000/api";
    const fileBase = apiBase.replace(/\/api\/?$/, "");
    
    // Get today's date in YYYY-MM-DD format
    const today = useMemo(() => new Date().toISOString().split("T")[0], []);

    useEffect(() => {
        let live = true;
        setLoading(true);
        setErr("");

        fetch(`${baseUrl}/packages/${id}`, { credentials: "include" })
        .then(async (r) => {
            const data = await r.json();
            if (!r.ok) throw new Error(data?.error || "Failed to load package");
            return data;
        })
        .then((data) => {
            if (!live) return;
            setPkg(data);
            // prime form
            setForm({
            name: data.name || "",
            about: data.about || "",
            maxTourist: data.maxTourist ?? 10,
            startDate: data.startDate ? data.startDate.slice(0, 10) : "",
            endDate: data.endDate ? data.endDate.slice(0, 10) : "",
            contact: data.contact || "",
            email: data.email || "",
            price: data.price ?? 0,
            guide: data.guide || "",
            });
        })
        .catch((e) => {
            if (!live) return;
            console.error(e);
            setErr(e.message || "Something went wrong");
        })
        .finally(() => {
            if (live) setLoading(false);
        });

        return () => {
        live = false;
        };
    }, [baseUrl, id]);

    const fmt = (d) =>
        d
        ? new Date(d).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
            })
        : "—";

    const money = (n) =>
        typeof n === "number"
        ? n.toLocaleString(undefined, { style: "currency", currency: "USD" })
        : "—";

    const isOfferActive = (offer) => {
        if (!offer?.startDate || !offer?.endDate) return false;
        const now = Date.now();
        const s = new Date(offer.startDate).getTime();
        const e = new Date(offer.endDate).getTime();
        return s <= now && now <= e;
    };

    async function handleSave() {
        try {
        setSaving(true);
        setFormErrors({});
        const resp = await fetch(`${baseUrl}/packages/${id}`, {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
            name: form.name,
            about: form.about,
            maxTourist: Number(form.maxTourist),
            startDate: form.startDate || null,
            endDate: form.endDate || null,
            contact: form.contact,
            email: form.email,
            price: Number(form.price),
            guide: form.guide,
            }),
        });
        const data = await resp.json();
        if (!resp.ok) {
            if (data?.errors) setFormErrors(data.errors);
            throw new Error(data?.error || "Failed to update package");
        }
        setPkg(data);
        setIsEditing(false);
        } catch (e) {
        console.error(e);
        alert(e.message || "Update failed");
        } finally {
        setSaving(false);
        }
    }

    async function handleDelete() {
        const yes = window.confirm("Delete this package permanently?");
        if (!yes) return;
        const confirmWord = window.prompt('Type "DELETE" to confirm:');
        if (confirmWord !== "DELETE") return;

        try {
        setDeleting(true);
        const resp = await fetch(`${baseUrl}/packages/${id}`, {
            method: "DELETE",
            credentials: "include",
        });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) throw new Error(data?.error || "Failed to delete package");
        // navigate away after delete
        navigate("/admin");
        } catch (e) {
        console.error(e);
        alert(e.message || "Delete failed");
        } finally {
        setDeleting(false);
        }
    }

    if (loading) {
        return (
        <div className="min-h-screen bg-white">
            <div className="mx-auto max-w-5xl px-6 md:px-10 py-10">
            <div className="h-8 w-48 bg-gray-200 animate-pulse rounded mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 h-72 bg-gray-200 animate-pulse rounded-2xl" />
                <div className="h-72 bg-gray-200 animate-pulse rounded-2xl" />
            </div>
            </div>
        </div>
        );
    }

    if (err) {
        return (
        <div className="min-h-screen bg-white">
            <div className="mx-auto max-w-3xl px-6 md:px-10 py-10">
            <div className="text-red-600 mb-6 print:hidden">Error: {err}</div>
            <button
                onClick={() => navigate(-1)}
                className="rounded-full border border-gray-900 px-5 py-2 text-sm hover:bg-gray-900 hover:text-white transition print:hidden"
            >
                ← Back
            </button>
            </div>
        </div>
        );
    }

    if (!pkg) {
        return (
        <div className="min-h-screen bg-white">
            <div className="mx-auto max-w-3xl px-6 md:px-10 py-10">
            <div className="text-gray-700 mb-6">Package not found.</div>
            <button
                onClick={() => navigate(-1)}
                className="rounded-full border border-gray-900 px-5 py-2 text-sm hover:bg-gray-900 hover:text-white transition print:hidden"
            >
                ← Back
            </button>
            </div>
        </div>
        );
    }

    const images = Array.isArray(pkg.imageUrls) ? pkg.imageUrls : [];
    const imageSrc = (u) =>
        u?.startsWith("http") ? u : u ? `${fileBase}${u}` : "";

    // ------ NEW: pricing with offer ------
    const promo = pkg.promotion && typeof pkg.promotion === "object" ? pkg.promotion : null;
    const hasDiscount = !!promo?.discountPercent;
    const discountedPrice = hasDiscount
        ? Number(pkg.price) * (1 - Number(promo.discountPercent) / 100)
        : Number(pkg.price);
    const offerActive = isOfferActive(promo);
    // -------------------------------------

    return (
        <div className="min-h-screen bg-white text-gray-900">
        <div className="mx-auto max-w-6xl px-6 md:px-10 py-8">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
            <div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                {pkg.name || "Untitled package"}
                </h1>
                <div className="mt-1 text-sm text-gray-600">
                Created {new Date(pkg.createdAt).toLocaleString()} • Updated{" "}
                {new Date(pkg.updatedAt).toLocaleString()}
                </div>

                {/* Small badge if on offer */}
                {promo && (
                <div className="mt-2 inline-flex items-center gap-2">
                    <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        offerActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                    >
                    {offerActive ? "Offer active" : "Offer not active"}
                    </span>
                    <span className="text-xs text-gray-600">
                    {promo.name ? `• ${promo.name}` : null}
                    {promo.discountPercent
                        ? ` • ${promo.discountPercent}% OFF`
                        : null}
                    </span>
                </div>
                )}
            </div>
            <div className="flex gap-2">
                <button
                onClick={() => navigate(-1)}
                className="rounded-full border border-gray-300 px-4 py-2 text-sm hover:bg-blue-200 transition  print:hidden"
                >
                ← Back
                </button>

                {!isEditing ? (
                <>
                    <button
                    onClick={() => setIsEditing(true)}
                    className="rounded-full border border-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-600 hover:text-white transition print:hidden"
                    >
                    Edit
                    </button>
                    <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="rounded-full border border-red-600 text-red-600 px-4 py-2 text-sm font-medium hover:bg-red-600 hover:text-white transition disabled:opacity-60 print:hidden"
                    >
                    {deleting ? "Deleting..." : "Delete"}
                    </button>
                </>
                ) : (
                <>
                    <button
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-full border border-emerald-700 text-emerald-700 px-4 py-2 text-sm font-medium hover:bg-emerald-700 hover:text-white transition disabled:opacity-60"
                    >
                    {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                    onClick={() => {
                        // reset form to current pkg and exit edit mode
                        setForm({
                        name: pkg.name || "",
                        about: pkg.about || "",
                        maxTourist: pkg.maxTourist ?? 10,
                        startDate: pkg.startDate
                            ? pkg.startDate.slice(0, 10)
                            : "",
                        endDate: pkg.endDate ? pkg.endDate.slice(0, 10) : "",
                        contact: pkg.contact || "",
                        email: pkg.email || "",
                        price: pkg.price ?? 0,
                        guide: pkg.guide || "",
                        });
                        setFormErrors({});
                        setIsEditing(false);
                    }}
                    className="rounded-full border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100 transition"
                    >
                    Cancel
                    </button>
                </>
                )}
            </div>
            </div>

            {/* Content */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: gallery + about / form */}
            <div className="lg:col-span-2 space-y-6">
                {/* Gallery */}
                <div className="rounded-2xl overflow-hidden border border-gray-200">
                {images.length ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2">
                    <img
                        src={imageSrc(images[0])}
                        alt={pkg.name}
                        className="w-full h-72 object-cover rounded"
                        loading="lazy"
                    />
                    <div className="grid grid-cols-2 gap-2">
                        {images.slice(1, 5).map((u, i) => (
                        <img
                            key={i}
                            src={imageSrc(u)}
                            alt={`${pkg.name} ${i + 2}`}
                            className="w-full h-36 object-cover rounded"
                            loading="lazy"
                        />
                        ))}
                    </div>
                    </div>
                ) : (
                    <div className="h-72 grid place-items-center text-gray-500">
                    No images
                    </div>
                )}
                </div>

                {/* About / Edit form */}
                {!isEditing ? (
                <div className="rounded-2xl border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold mb-2">About</h2>
                    <p className="text-gray-700 whitespace-pre-wrap">
                    {pkg.about?.trim() ? pkg.about : "No description provided."}
                    </p>
                </div>
                ) : (
                <div className="rounded-2xl border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold mb-4">Edit Package</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm text-gray-600">Package Name</label>
                        <input
                        className="mt-1 w-full rounded-xl border px-3 py-2"
                        value={form.name}
                        onChange={(e) =>
                            setForm((f) => ({ ...f, name: e.target.value }))
                        }
                        />
                        {formErrors.name && (
                        <p className="text-sm text-red-600 mt-1">
                            {formErrors.name}
                        </p>
                        )}
                    </div>

                    <div>
                        <label className="text-sm text-gray-600">Guide</label>
                        <input
                        className="mt-1 w-full rounded-xl border px-3 py-2"
                        value={form.guide}
                        onChange={(e) =>
                            setForm((f) => ({ ...f, guide: e.target.value }))
                        }
                        />
                    </div>

                    <div>
                        <label className="text-sm text-gray-600">Max Tourists</label>
                        <input
                        type="number"
                        min={0}
                        className="mt-1 w-full rounded-xl border px-3 py-2"
                        value={form.maxTourist}
                        onChange={(e) =>
                            setForm((f) => ({ ...f, maxTourist: e.target.value }))
                        }
                        />
                        {formErrors.maxTourist && (
                        <p className="text-sm text-red-600 mt-1">
                            {formErrors.maxTourist}
                        </p>
                        )}
                    </div>

                    <div>
                        <label className="text-sm text-gray-600">Price</label>
                        <input
                        type="number"
                        min={0}
                        className="mt-1 w-full rounded-xl border px-3 py-2"
                        value={form.price}
                        onChange={(e) =>
                            setForm((f) => ({ ...f, price: e.target.value }))
                        }
                        />
                        {formErrors.price && (
                        <p className="text-sm text-red-600 mt-1">
                            {formErrors.price}
                        </p>
                        )}
                    </div>

                    <div>
                        <label className="text-sm text-gray-600">Start Date</label>
                        <input
                        type="date"
                        min={today}
                        className="mt-1 w-full rounded-xl border px-3 py-2"
                        value={form.startDate}
                        onChange={(e) =>
                            setForm((f) => ({ ...f, startDate: e.target.value }))
                        }
                        />
                        {formErrors.startDate && (
                        <p className="text-sm text-red-600 mt-1">
                            {formErrors.startDate}
                        </p>
                        )}
                    </div>

                    <div>
                        <label className="text-sm text-gray-600">End Date</label>
                        <input
                        type="date"
                        min={form.startDate ? new Date(new Date(form.startDate).getTime() + 86400000).toISOString().split('T')[0] : today}
                        className="mt-1 w-full rounded-xl border px-3 py-2"
                        value={form.endDate}
                        onChange={(e) =>
                            setForm((f) => ({ ...f, endDate: e.target.value }))
                        }
                        />
                        {formErrors.endDate && (
                        <p className="text-sm text-red-600 mt-1">
                            {formErrors.endDate}
                        </p>
                        )}
                    </div>

                    <div>
                        <label className="text-sm text-gray-600">Contact (10 digits)</label>
                        <input
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        className="mt-1 w-full rounded-xl border px-3 py-2"
                        value={form.contact}
                        onChange={(e) => {
                            // Only allow digits, max 10
                            const onlyDigits = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setForm((f) => ({ ...f, contact: onlyDigits }));
                        }}
                        placeholder="0712345678"
                        />
                        {formErrors.contact && (
                        <p className="text-sm text-red-600 mt-1">
                            {formErrors.contact}
                        </p>
                        )}
                    </div>

                    <div>
                        <label className="text-sm text-gray-600">Email</label>
                        <input
                        type="email"
                        className="mt-1 w-full rounded-xl border px-3 py-2"
                        value={form.email}
                        onChange={(e) =>
                            setForm((f) => ({ ...f, email: e.target.value }))
                        }
                        />
                        {formErrors.email && (
                        <p className="text-sm text-red-600 mt-1">
                            {formErrors.email}
                        </p>
                        )}
                    </div>

                    <div className="md:col-span-2">
                        <label className="text-sm text-gray-600">About</label>
                        <textarea
                        rows={4}
                        className="mt-1 w-full rounded-xl border px-3 py-2"
                        value={form.about}
                        onChange={(e) =>
                            setForm((f) => ({ ...f, about: e.target.value }))
                        }
                        />
                    </div>
                    </div>
                </div>
                )}
            </div>

            {/* Right: facts */}
            <aside className="space-y-6">
                <div className="rounded-2xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold mb-4">Details</h2>

                {/* ---- Price with offer display ---- */}
                <div className="mb-4">
                    <div className="flex justify-between items-baseline">
                    <dt className="text-gray-500">Price (Per Person)</dt>
                    <dd className="font-medium">
                        {hasDiscount ? (
                        <>
                            <span className="line-through text-gray-500 mr-2">
                            {money(Number(pkg.price))}
                            </span>
                            <span className="text-green-600 font-bold">
                            {money(discountedPrice)}
                            </span>
                            <span className="ml-1 text-sm text-green-600">
                            (-{promo.discountPercent}%)
                            </span>
                        </>
                        ) : (
                        money(Number(pkg.price))
                        )}
                    </dd>
                    </div>

                    {promo && (
                    <div className="mt-2 text-xs text-gray-600">
                        <div>
                        <span className="font-semibold">Offer:</span>{" "}
                        {promo.name || "Untitled offer"}
                        </div>
                        <div>
                        <span className="font-semibold">Valid:</span>{" "}
                        {fmt(promo.startDate)} – {fmt(promo.endDate)}{" "}
                        {offerActive ? (
                            <span className="ml-2 px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                            Active
                            </span>
                        ) : (
                            <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                            Not active
                            </span>
                        )}
                        </div>
                    </div>
                    )}
                </div>
                {/* ----------------------------------- */}

                <dl className="space-y-3 text-sm">
                    <div className="flex justify-between">
                    <dt className="text-gray-500">Guide</dt>
                    <dd className="font-medium">{pkg.guide || "—"}</dd>
                    </div>
                    <div className="flex justify-between">
                    <dt className="text-gray-500">Max Tourists</dt>
                    <dd className="font-medium">{pkg.maxTourist ?? "—"}</dd>
                    </div>
                    <div className="flex justify-between">
                    <dt className="text-gray-500">Start Date</dt>
                    <dd className="font-medium">{fmt(pkg.startDate)}</dd>
                    </div>
                    <div className="flex justify-between">
                    <dt className="text-gray-500">End Date</dt>
                    <dd className="font-medium">{fmt(pkg.endDate)}</dd>
                    </div>
                    <div className="flex justify-between">
                    <dt className="text-gray-500">Contact</dt>
                    <dd className="font-medium">{pkg.contact || "—"}</dd>
                    </div>
                    <div className="flex justify-between">
                    <dt className="text-gray-500">Email</dt>
                    <dd className="font-medium">{pkg.email || "—"}</dd>
                    </div>
                </dl>
                </div>
            </aside>
            </div>

            <button
            onClick={() => window.print()}
            className="rounded-full border border-gray-300 px-4 py-2 text-sm hover:bg-blue-300 transition print:hidden mt-5"
            >
            Print Page
            </button>
        </div>
        </div>
    );
}
