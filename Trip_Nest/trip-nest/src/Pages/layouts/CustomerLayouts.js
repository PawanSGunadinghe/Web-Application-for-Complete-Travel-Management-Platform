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
    { to: "/home", label: "Home" },
    { to: "/booking", label: "Packages" },
    { to: "/guide-jobs", label: "Careers" },
    { to: "/feedback", label: "Feedback" },
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
        {/* 2-column grid: left logo, centered nav */}
        <div className="grid grid-cols-[auto,1fr] items-center gap-4 h-16">
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

        </div>
      </div>
    </header>
  );
}