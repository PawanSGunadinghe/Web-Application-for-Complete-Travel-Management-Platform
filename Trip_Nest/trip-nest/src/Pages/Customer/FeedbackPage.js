// src/Pages/Customer/FeedbackPage.js
import React, { useEffect, useMemo, useState } from "react";
import StarRating from "../../components/StarRating";
import FormField from "../../components/FormField";
import PopupMessage from "../../components/PopupMessage";
import heroImg from "../../Assets/fe.jpg"; // put in public/ if you prefer

// Inline date formatter
const formatDate = (d) =>
    d ? new Date(d).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "";

// Category options for feedback
const CATEGORY_OPTIONS = [
  { value: "general", label: "System" },
  { value: "vehicle", label: "Vehicle" },
  { value: "tour_guide", label: "Tour Guide" },
  { value: "package", label: "Package" },
  { value: "driver", label: "Driver" },
];

// Would book again options
const WOULD_BOOK_AGAIN_OPTIONS = [
  { value: "", label: "Select an option..." },
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "maybe", label: "Maybe" },
];

// Safety experience options
const SAFETY_EXPERIENCE_OPTIONS = [
  { value: "", label: "Select safety level..." },
  { value: "very_safe", label: "Very Safe" },
  { value: "safe", label: "Safe" },
  { value: "neutral", label: "Neutral" },
  { value: "unsafe", label: "Unsafe" },
];

    export default function FeedbackPage() {
    const [items, setItems] = useState([]);
    const [user, setUser] = useState(null);
    const [avg, setAvg] = useState(0);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState("");
    const [sort, setSort] = useState("new"); // new | top
    const [error, setError] = useState("");

    // create/edit form state
    const [rating, setRating] = useState(0);
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [editingId, setEditingId] = useState(null);

    // Add category state
    const [category, setCategory] = useState("");
    
    // New fields state
    const [wouldBookAgain, setWouldBookAgain] = useState("");
    const [safetyExperience, setSafetyExperience] = useState("");
    const [suggestions, setSuggestions] = useState("");
    
    // Form validation state
    const [formErrors, setFormErrors] = useState({});
    
    // Popup message state
    const [popupMessage, setPopupMessage] = useState({
        isVisible: false,
        type: 'success',
        title: '',
        message: ''
    });

    const API_BASE = useMemo(
        () => `${process.env.REACT_APP_API_URL || "http://localhost:4000/api"}`,
        []
    );

    // Helper function to show popup messages
    const showPopup = (type, title, message) => {
        setPopupMessage({
            isVisible: true,
            type,
            title,
            message
        });
    };

    const hidePopup = () => {
        setPopupMessage(prev => ({ ...prev, isVisible: false }));
    };

    // load current user so we can show their name & enable edit/delete
    useEffect(() => {
        (async () => {
        try {
            // Expect backend to mount at /api/auth/me
            const r = await fetch(`${API_BASE}/auth/me`, { credentials: "include" });
            const j = await r.json();
            if (r.ok && j?.user) setUser(j.user); // { id/_id, name, ...}
        } catch {
            /* ignore */
        }
        })();
    }, [API_BASE]);

    const load = async () => {
        setLoading(true);
        setError("");
        try {
        const resp = await fetch(
            `${API_BASE}/feedbacks?sort=${sort}&q=${encodeURIComponent(q)}`,
            { credentials: "include" }
        );
        const json = await resp.json();
        if (!resp.ok) throw new Error(json?.error || "Failed to load feedback");
        setItems(json.items || []);
        setAvg(json.avgRating || 0);
        } catch (e) {
        setError(e.message || "Error");
        } finally {
        setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line
    }, [sort]);

    // ------- Create / Update -------
    const submit = async (e) => {
        e.preventDefault();
        
        // Clear previous errors
        setFormErrors({});
        
        // Validate form
        const errors = {};
        if (!title.trim()) errors.title = "Title is required";
        if (!rating) errors.rating = "Please rate 1–5 stars";
        if (!body.trim()) errors.body = "Please write your feedback";
        if (!wouldBookAgain) errors.wouldBookAgain = "Please select an option";
        if (!safetyExperience) errors.safetyExperience = "Please select a safety experience";
        // Category is optional but will default to 'general'
        
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        // Server will attach user + name; no need to send userName from client
        const payload = { title, body, rating, category, wouldBookAgain, safetyExperience, suggestions };

        try {
        if (editingId) {
            const r = await fetch(`${API_BASE}/feedbacks/${editingId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload),
            });
            const j = await r.json();
            if (!r.ok) throw new Error(j?.error || "Update failed");
            
            // Show success popup for update
            showPopup('success', 'Success!', 'Your feedback has been updated successfully.');
        } else {
            const r = await fetch(`${API_BASE}/feedbacks`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload),
            });
            const j = await r.json();
            if (!r.ok) throw new Error(j?.error || "Create failed");
            
            // Show success popup for create
            showPopup('success', 'Thank you!', 'Your feedback has been submitted successfully.');
        }
        resetForm();
        load();
        } catch (e) {
        showPopup('error', 'Error', e.message);
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setRating(0);
        setTitle("");
        setBody("");
        setCategory("");
        setWouldBookAgain("");
        setSafetyExperience("");
        setSuggestions("");
        setFormErrors({});
    };

    const onEdit = (fb) => {
        setEditingId(fb._id);
        setRating(fb.rating);
        setTitle(fb.title || "");
        setBody(fb.body || "");
        setCategory(fb.category || "general");
        setWouldBookAgain(fb.wouldBookAgain ?? "");
        setSafetyExperience(fb.safetyExperience ?? "");
        setSuggestions(fb.suggestions ?? "");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const onDelete = async (id) => {
        if (!window.confirm("Delete this feedback?")) return;
        try {
        const r = await fetch(`${API_BASE}/feedbacks/${id}`, {
            method: "DELETE",
            credentials: "include",
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || "Delete failed");
        
        // Show success popup for delete
        showPopup('success', 'Deleted!', 'Your feedback has been deleted successfully.');
        load();
        } catch (e) {
        showPopup('error', 'Error', e.message);
        }
    };

    const filtered = items.filter((i) => {
        const term = q.trim().toLowerCase();
        if (!term) return true;
        return (
        (i.title || "").toLowerCase().includes(term) ||
        (i.body || "").toLowerCase().includes(term) ||
        (i.userName || i.user?.name || "").toLowerCase().includes(term)
        );
    });

    return (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
    {/* Modern Header */}
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">F</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Feedback Center</h1>
              <p className="text-sm text-gray-500">Share your experience with us</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-2">
              <StarRating value={Math.round(avg)} readOnly size={16} />
              <span className="text-sm font-medium text-gray-700">{avg.toFixed(1)} avg rating</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Search and Filter Bar */}
    <div className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="w-96">
            <div className="relative">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
                placeholder="Search feedback, users, or content..."
                className="w-full pl-10 pr-4 py-3 border border-blue-500 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
          >
            <option value="new">Newest First</option>
            <option value="top">Highest Rated</option>
          </select>
        </div>
      </div>
    </div>
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Feedback Form - Left Side */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 sticky top-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {editingId ? "Edit Feedback" : "Share Your Experience"}
              </h2>
            </div>
            <form onSubmit={submit} className="space-y-6">
              {/* Rating Section */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Your Rating <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center space-x-2">
                  <StarRating value={rating} onChange={setRating} size={28} />
                  <span className="text-sm text-gray-500">({rating}/5)</span>
                </div>
                {formErrors.rating && (
                  <p className="text-sm text-red-600 mt-1">{formErrors.rating}</p>
                )}
              </div>
              {/* Feedback Category */}
              <FormField
                label="Feedback Category"
                id="category"
                as="select"
                value={category}
                onChange={e => setCategory(e.target.value)}
                error={formErrors.category}
                options={CATEGORY_OPTIONS}
                className="rounded-lg border-gray-200 focus:ring-blue-500 focus:border-blue-500"
              />
              {/* Title */}
              <FormField
                label="Title"
                id="title"
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value.replace(/[^A-Za-z\s]/g, ""))}
                placeholder="Brief title"
                className="rounded-lg border-gray-200 focus:ring-blue-500 focus:border-blue-500"
                required
                error={formErrors.title}
              />
              {/* Feedback Body */}
              <FormField
                label="Your Feedback"
                id="body"
                as="textarea"
                value={body}
                onChange={e => setBody(e.target.value.slice(0, 150))}
                error={formErrors.body}
                required
                placeholder="Tell us about your experience..."
                rows={4}
                className="resize-none rounded-lg border-gray-200 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="text-right text-xs text-gray-500 mt-1">{body.length}/150</div>
              {/* Would Book Again */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Would you book with us again?
                </label>
                <div className="flex gap-2">
                  {[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }, { value: "maybe", label: "Maybe" }].map(opt => (
                    <label key={opt.value} className={`flex-1 flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-colors font-medium text-sm ${wouldBookAgain === opt.value ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'}`}>
                      <input
                        type="radio"
                        name="wouldBookAgain"
                        value={opt.value}
                        checked={wouldBookAgain === opt.value}
                        onChange={() => setWouldBookAgain(opt.value)}
                        className="sr-only"
                        required
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
                {formErrors.wouldBookAgain && (
                  <p className="text-sm text-red-600 mt-1">{formErrors.wouldBookAgain}</p>
                )}
              </div>
              {/* Safety Experience */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Safety Experience
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[{ value: "very_safe", label: "Very Safe" }, { value: "safe", label: "Safe" }, { value: "neutral", label: "Neutral" }, { value: "unsafe", label: "Unsafe" }].map(opt => (
                    <label key={opt.value} className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-colors font-medium text-sm ${safetyExperience === opt.value ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'}`}>
                      <input
                        type="radio"
                        name="safetyExperience"
                        value={opt.value}
                        checked={safetyExperience === opt.value}
                        onChange={() => setSafetyExperience(opt.value)}
                        className="sr-only"
                        required
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
                {formErrors.safetyExperience && (
                  <p className="text-sm text-red-600 mt-1">{formErrors.safetyExperience}</p>
                )}
              </div>
              {/* Suggestions for Improvement */}
              <FormField
                label="Suggestions for Improvement"
                id="suggestions"
                as="textarea"
                value={suggestions}
                onChange={e => setSuggestions(e.target.value.slice(0, 250))}
                placeholder="How can we improve? (optional)"
                rows={3}
                className="resize-none rounded-lg border-gray-200 focus:ring-blue-500 focus:border-blue-500"
                error={formErrors.suggestions}
              />
              <div className="text-right text-xs text-gray-500 mt-1">{suggestions.length}/250</div>
              {/* Submit Buttons */}
              <div className="flex flex-col space-y-3 pt-4">
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] shadow"
                >
                  {editingId ? "Update Feedback" : "Submit Feedback"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
        
        {/* Feedback List - Right Side */}
        <div className="lg:col-span-2">
      {/* Errors */}
      {!loading && error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            </div>
          )}
          
          {/* Feedback List */}
          <div className="space-y-6">
        {loading ? (
              <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border animate-pulse">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                      <div className="flex-1 space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
        ) : filtered.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center shadow-sm border">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No feedback yet</h3>
                <p className="text-gray-500">Be the first to share your experience!</p>
          </div>
        ) : (
              <div className="space-y-4">
            {filtered.map((f) => {
              const ownerId = f.user?._id || f.user;
              return (
                    <div key={f._id} className="bg-white rounded-2xl p-6 shadow-sm border-2 border-gray-200 hover:border-blue-500 hover:shadow-md transition-all duration-200">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                      {(f.userName || f.user?.name || "A").slice(0, 1).toUpperCase()}
                    </div>
                        <div className="flex-1 min-w-0">
                          {/* Top row: Name, rating, date, category */}
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="font-bold text-lg text-gray-900 mr-2 truncate">{f.userName || f.user?.name || "Anonymous"}</span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-xs font-semibold">
                              <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.38-2.454a1 1 0 00-1.175 0l-3.38 2.454c-.784.57-1.838-.196-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.05 9.394c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.967z"/></svg>
                              {f.rating}/5
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                              {f.category === 'general' ? 'System' : f.category ? f.category.replace('_', ' ') : 'System'}
                            </span>
                            <span className="text-xs text-gray-400 ml-auto">
  {(() => {
    const created = new Date(f.createdAt);
    const updated = new Date(f.lastModified || f.updatedAt || f.createdAt);
    return formatDate(updated);
  })()}
</span>
                          </div>
                          {/* Title */}
                          {f.title && (
                            <div className="text-base font-semibold text-gray-800 mb-1">{f.title}</div>
                          )}
                          {/* Feedback body */}
                          {f.body && (
                            <div className="text-gray-700 leading-relaxed mb-4 whitespace-pre-line">{f.body}</div>
                          )}
                          {/* Additional Details */}
                          <div className="flex flex-wrap gap-3 mb-2">
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-500">Would book again:</span>
                              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${f.wouldBookAgain === 'yes' ? 'bg-green-100 text-green-700' : f.wouldBookAgain === 'no' ? 'bg-red-100 text-red-700' : f.wouldBookAgain === 'maybe' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>{f.wouldBookAgain ? f.wouldBookAgain : '—'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-500">Safety:</span>
                              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${f.safetyExperience === 'very_safe' ? 'bg-green-100 text-green-700' : f.safetyExperience === 'safe' ? 'bg-blue-100 text-blue-700' : f.safetyExperience === 'neutral' ? 'bg-yellow-100 text-yellow-700' : f.safetyExperience === 'unsafe' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>{f.safetyExperience ? f.safetyExperience.replace('_', ' ') : '—'}</span>
                            </div>
                          </div>
                          {f.suggestions && (
                            <div className="mt-2 border-l-4 border-blue-100 pl-3 italic text-gray-600 text-sm">
                              <span className="text-gray-400 mr-1">“</span>{f.suggestions}<span className="text-gray-400 ml-1">”</span>
                            </div>
                        )}
                      </div>
                        {/* Action buttons (unchanged) */}
                    {Boolean(user) && String(ownerId || "") === String(user?.id || user?._id) && (
                          <div className="flex space-x-2 ml-4">
                        <button
                          type="button"
                          onClick={() => onEdit(f)}
                              className="p-2 text-blue-800 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit feedback"
                        >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(f._id)}
                              className="p-2 text-blue-800 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete feedback"
                        >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                        </button>
                      </div>
                    )}
                  </div>
                    </div>
              );
            })}
              </div>
        )}
          </div>
        </div>
      </div>
    </main>
    
    {/* Popup Message */}
    <PopupMessage
      isVisible={popupMessage.isVisible}
      onClose={hidePopup}
      type={popupMessage.type}
      title={popupMessage.title}
      message={popupMessage.message}
      duration={4000}
    />
  </div>
);
}
