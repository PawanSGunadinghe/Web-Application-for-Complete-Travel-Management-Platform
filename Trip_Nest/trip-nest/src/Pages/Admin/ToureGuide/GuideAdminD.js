// src/Pages/Admin/ToureGuide/GuideAdminD.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import IMG1 from "../../../Assets/tguide.jpg";

export default function GuideAdminD() {
    const [jobs, setJobs] = useState([]);
    const [apps, setApps] = useState([]);
    const [loadingJobs, setLoadingJobs] = useState(true);
    const [loadingApps, setLoadingApps] = useState(true);
    const [q, setQ] = useState("");

    const navigate = useNavigate();

    // Base API URL (e.g. http://localhost:4000/api)
    const baseUrl = useMemo(
        () => `${process.env.REACT_APP_API_URL || "http://localhost:4000/api"}`,
        []
    );
    // Origin for absolute image URLs (e.g. http://localhost:4000)
    const API_ORIGIN =
        process.env.REACT_APP_API_ORIGIN || new URL(baseUrl).origin;

    // ---------- helpers ----------
    function toAbsUrl(u) {
        if (!u) return "";
        if (/^https?:/i.test(u)) return u; // already absolute
        return `${API_ORIGIN}${u.startsWith("/") ? "" : "/"}${u}`;
    }
    function formatPhone(p) {
        const s = String(p || "").replace(/\D/g, "");
        if (s.length === 10) return s.replace(/^(\d{3})(\d{3})(\d{4})$/, "$1 $2 $3");
        if (s.length > 4) return `${s.slice(0, -4).replace(/\D/g, "•")}${s.slice(-4)}`;
        return s || "—";
    }
    function getInitials(name) {
        if (!name) return "?";
        const parts = String(name).trim().split(/\s+/).slice(0, 2);
        return parts.map((p) => p[0]?.toUpperCase() || "").join("") || "?";
    }

    // LOAD JOB POSTS
    useEffect(() => {
        let live = true;
        setLoadingJobs(true);
        fetch(`${baseUrl}/guide-jobs`, { credentials: "include" })
        .then(async (r) => {
            const data = await r.json();
            if (!r.ok) throw new Error(data?.error || "Failed to load jobs");
            return data;
        })
        .then((data) => {
            if (!live) return;
            const arr = Array.isArray(data)
            ? data
            : Array.isArray(data.items)
            ? data.items
            : [];
            setJobs(arr);
        })
        .catch((err) => {
            console.error(err);
            if (live) setJobs([]);
        })
        .finally(() => live && setLoadingJobs(false));
        return () => {
        live = false;
        };
    }, [baseUrl]);

    // LOAD GUIDE APPLICATIONS - FIXED: Request pending applications only
    useEffect(() => {
        let live = true;
        setLoadingApps(true);
        const url = new URL(`${baseUrl}/guide-applications`);
        url.searchParams.set("page", "1");
        url.searchParams.set("limit", "50");
        url.searchParams.set("status", "pending"); // Only get pending applications

        fetch(url, { credentials: "include" })
        .then(async (r) => {
            const data = await r.json();
            if (!r.ok) throw new Error(data?.error || "Failed to load applications");
            return data;
        })
        .then((data) => {
            if (!live) return;
            const arr = Array.isArray(data)
            ? data
            : Array.isArray(data.items)
            ? data.items
            : [];
            
            // No need to filter here since backend already returns only pending apps
            const sorted = [...arr].sort(
                (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
            );
            setApps(sorted);
        })
        .catch((err) => {
            console.error(err);
            if (live) setApps([]);
        })
        .finally(() => live && setLoadingApps(false));

        return () => {
        live = false;
        };
    }, [baseUrl]);

    // SEARCH
    const term = q.trim().toLowerCase();
    const filteredJobs = jobs.filter((j) => {
        if (!term) return true;
        return (
        (j.title || "").toLowerCase().includes(term) ||
        (j.position || "").toLowerCase().includes(term) ||
        (j.deadline || "").toLowerCase().includes(term)
        );
    });
    const filteredApps = apps.filter((a) => {
        if (!term) return true;
        return (
        (a.fullName || "").toLowerCase().includes(term) ||
        (a.email || "").toLowerCase().includes(term) ||
        (a.phone || "").toLowerCase().includes(term) ||
        (Array.isArray(a.languages) ? a.languages.join(",") : a.languages || "")
            .toLowerCase()
            .includes(term)
        );
    });

    // Handle approve button click with API call
    const handleApprove = async (appId, appName) => {
        if (window.confirm(`Are you sure you want to approve ${appName}?`)) {
            try {
                const response = await fetch(`${baseUrl}/guide-applications/${appId}/approve`, {
                    method: 'PATCH',
                    credentials: "include",
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (response.ok) {
                    // Remove the approved application from local state
                    setApps(prevApps => prevApps.filter(app => app._id !== appId));
                    alert(`Successfully approved ${appName}`);
                } else {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to approve application');
                }
            } catch (err) {
                console.error('Error approving application:', err);
                alert('Failed to approve application. Please try again.');
            }
        }
    };

    // Handle reject button click with API call
    const handleReject = async (appId, appName) => {
        if (window.confirm(`Are you sure you want to reject ${appName}?`)) {
            try {
                const response = await fetch(`${baseUrl}/guide-applications/${appId}/reject`, {
                    method: 'PATCH',
                    credentials: "include",
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (response.ok) {
                    // Remove the rejected application from local state
                    setApps(prevApps => prevApps.filter(app => app._id !== appId));
                    alert(`Successfully rejected ${appName}`);
                } else {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to reject application');
                }
            } catch (err) {
                console.error('Error rejecting application:', err);
                alert('Failed to reject application. Please try again.');
            }
        }
    };

    // Avatar Component to fix the hook issue
    const Avatar = ({ app }) => {
        const photo = toAbsUrl(app.profilePhotoUrl || app.profilePhoto || "");
        const initials = getInitials(app.fullName);
        const [imgOk, setImgOk] = useState(Boolean(photo));

        return imgOk ? (
            <img
                src={photo}
                alt={app.fullName || "Applicant"}
                className="h-8 w-8 rounded-full object-cover border mr-3"
                onError={() => setImgOk(false)}
            />
        ) : (
            <div className="h-8 w-8 rounded-full bg-gray-200 grid place-items-center text-gray-700 font-semibold text-xs mr-3">
                {initials}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#F4F8FB] text-gray-900">
            {/* HERO HEADER (image + overlay + controls) - UNCHANGED */}
            <header className="relative">
                <div
                className="h-44 md:h-56 w-full bg-center bg-cover"
                style={{ backgroundImage: `url(${IMG1})` }}
                />
                <div className="absolute inset-0 bg-black/30" />
                <div className="absolute inset-0 flex items-center">
                <div className="mx-auto max-w-6xl w-full px-6 md:px-10 flex items-center justify-between">
                    {/* Controls inside header (top-right) */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <Link to="/admin/tour-jobs-post-form">
                        <button className="rounded-full bg-white/90 text-blue-700 px-4 py-2 text-sm font-semibold border border-white hover:bg-white">
                        Add New Job Post
                        </button>
                    </Link>
                    <Link to="/admin/guide-applications">
                        <button className="rounded-full bg-white/90 text-blue-700 px-4 py-2 text-sm font-semibold border border-white hover:bg-white">
                        See Tour Guides List
                        </button>
                    </Link>
                    <Link to="/admin/guide-application">
                        <button className="rounded-full bg-white/90 text-blue-700 px-4 py-2 text-sm font-semibold border border-white hover:bg-white">
                        Add New Guide
                        </button>
                    </Link>

                    {/* Search */}
                    <div className="flex ml-40 items-center gap-2 rounded-full bg-white/90 border border-white/60 px-4 py-2 w-full sm:w-[280px]">
                        <span className="inline-block text-gray-500">🔎</span>
                        <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search jobs & applications"
                        className="w-full bg-transparent focus:outline-none text-gray-800 placeholder:text-gray-500"
                        />
                    </div>
                    </div>
                </div>
                </div>
            </header>

            <hr className="mt-5 border-gray-300"/>

            {/* BODY - UPDATED TO MATCH UI IMAGE */}
            <div className="mx-auto max-w-6xl px-6 md:px-10 py-8">
                {/* Job posts section */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Available Tour Guide Job Posts</h2>
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Job Title</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Job position</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Deadlines</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingJobs ? (
                                    <tr>
                                        <td colSpan="4" className="py-4 px-4 text-center text-gray-500">
                                            Loading job posts...
                                        </td>
                                    </tr>
                                ) : filteredJobs.length > 0 ? (
                                    filteredJobs.map((job) => (
                                        <tr key={job._id} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="py-3 px-4 text-gray-800">{job.title || "—"}</td>
                                            <td className="py-3 px-4 text-gray-600">{job.position || "—"}</td>
                                            <td className="py-3 px-4 text-red-600 font-medium">{job.deadline || "09/10"}</td>
                                            <td className="py-3 px-4">
                                                <button
                                                    onClick={() => navigate(`/admin/guide-job/${job._id}`)}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition"
                                                >
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="py-4 px-4 text-center text-gray-500">
                                            No job posts found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <hr className="mt-5 border-gray-300"/>

                {/* Applications section */}
                <div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2  mt-3">Tour Guide Job Applications</h2>
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Applicant Name</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Contact No.</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingApps ? (
                                    <tr>
                                        <td colSpan="4" className="py-4 px-4 text-center text-gray-500">
                                            Loading applications...
                                        </td>
                                    </tr>
                                ) : filteredApps.length > 0 ? (
                                    filteredApps
                                        .slice(0, 6)
                                        .map((app) => (
                                        <tr key={app._id} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center">
                                                    <Avatar app={app} />
                                                    <span className="font-medium text-gray-800">{app.fullName || "—"}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-gray-600">{formatPhone(app.phone)}</td>
                                            <td className="py-3 px-4">
                                                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center w-fit">
                                                    <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                                                    Available ✓
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex space-x-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleApprove(app._id, app.fullName)}
                                                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium transition"
                                                    >
                                                        Approve
                                                    </button>
                                                    
                                                    <button
                                                        type="button"
                                                        onClick={() => handleReject(app._id, app.fullName)}
                                                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm font-medium transition"
                                                    >
                                                        Reject
                                                    </button>
                                                    
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/admin/guide-application/${app._id}`)}
                                                        className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded text-sm font-medium transition"
                                                    >
                                                        View
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="py-4 px-4 text-center text-gray-500">
                                            No pending job applications found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}