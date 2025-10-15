import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import IMG1 from "../../Assets/TripLOGO.png";
import SiteFooter from "../../components/SiteFooter";

// src/layouts/CustomerLayout.js
export default function CustomerLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const [q, setQ] = useState("");

    useEffect(() => {
        const urlQ = new URLSearchParams(location.search).get("q") || "";
        setQ(urlQ);
    }, [location.search]);

    // submit -> push ?q= to URL (keeps UX consistent with header/global search)
    function onSubmit(e) {
        e.preventDefault();
        const term = q.trim();
        if (term) {
        navigate(`/booking?q=${encodeURIComponent(term)}`);
        } else {
        navigate(`/booking`); // clear query
        }
    }

    // Hide header on auth pages (optional – keep if you want this behavior)
    if (location.pathname === "/login" || location.pathname === "/signup") {
        return <Outlet />;
    }

    return (
        <div className="min-h-screen flex flex-col">
        <Header q={q} setQ={setQ} onSubmit={onSubmit} />
        <main className="flex-1">
            {/* your page content */}
            <Outlet />
        </main>
        <SiteFooter />
        </div>
    );
    }

    function Header({ q, setQ, onSubmit }) {
    const navigate = useNavigate();

    const navItems = [
        { to: "/guide-jobs", label: "Careers" },
        { to: "/user-profile", label: "Profile" },
    ];

    const baseLink =
        "relative px-1 py-1 text-black transition-colors outline-none " +
        // animated underline
        "after:content-[''] after:absolute after:left-0 after:right-0 after:-bottom-1 after:h-0.5 " +
        "after:bg-blue-600 after:scale-x-0 after:origin-left after:transition-transform " +
        "hover:text-blue-600 hover:after:scale-x-100 focus-visible:text-blue-600 focus-visible:after:scale-x-100";

    return (
        <header
        className="
            sticky top-0 z-50
            bg-white/70 backdrop-blur-md
            border-b border-black/5 shadow-lg
        "
        >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* 3-column grid: left logo, centered nav, right search */}
            <div className="grid grid-cols-[auto,1fr,auto] items-center gap-4 h-16">
            {/* Left: Logo */}
            <button
                onClick={() => navigate("/home")}
                className="flex items-center gap-2 group"
                aria-label="Go to home"
            >
                <img src={IMG1} alt="TripTrap Logo" className="h-8 w-auto" />
            </button>

            {/* Middle: Navigation (centered) */}
            <nav className="justify-self-center hidden md:flex items-center gap-8">
                {navItems.map((item) => (
                <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                    isActive
                        ? `${baseLink} text-blue-600 after:scale-x-100`
                        : baseLink
                    }
                >
                    {item.label}
                </NavLink>
                ))}
            </nav>

            {/* Right: SEARCH BAR */}
            <form
                onSubmit={onSubmit}
                className="justify-self-end flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 w-full max-w-md print:hidden"
                role="search"
            >
                <span className="inline-block text-gray-500" aria-hidden="true">
                🔎
                </span>
                <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search"
                className="w-full bg-transparent focus:outline-none"
                aria-label="Search packages"
                />
                {q ? (
                <button
                    type="button"
                    onClick={() => {
                    setQ("");
                    navigate("/booking");
                    }}
                    className="text-gray-500 hover:text-gray-700"
                    aria-label="Clear search"
                    title="Clear"
                >
                    ×
                </button>
                ) : null}
                <button type="submit" className="sr-only">
                Search
                </button>
            </form>
            </div>
        </div>
        </header>
    );
}