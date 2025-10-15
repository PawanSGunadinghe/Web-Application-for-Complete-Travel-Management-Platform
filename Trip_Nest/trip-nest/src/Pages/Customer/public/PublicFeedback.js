import React, { useEffect, useMemo, useState } from "react";
import StarRating from "../../../components/StarRating";
import heroImg from "../../../Assets/fe.jpg";

const formatDate = (d) =>
    d ? new Date(d).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "";

export default function PublicFeedback() {
  const [items, setItems] = useState([]);
  const [avg, setAvg] = useState(0);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("new"); // new | top
  const [error, setError] = useState("");

  const API_BASE = useMemo(
    () => `${process.env.REACT_APP_API_URL || "http://localhost:4000/api"}`,
    []
  );

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
      {/* Modern Header (matches logged-in page) */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">F</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Feedback Center</h1>
                <p className="text-sm text-gray-500">What travelers are saying about us</p>
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

      {/* List (no form, no actions) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!loading && error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
        )}

        <div className="space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border animate-pulse">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filtered.map((f) => (
                <div key={f._id} className="bg-white rounded-2xl p-5 shadow-sm border-2 border-gray-200 hover:border-blue-500 hover:shadow-md transition-all duration-200">
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
                          {formatDate(new Date(f.lastModified || f.updatedAt || f.createdAt))}
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
