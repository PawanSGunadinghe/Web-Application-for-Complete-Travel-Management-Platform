import { Outlet, NavLink, useLocation } from "react-router-dom";
import SiteFooter from "../../components/SiteFooter";
import IMG1 from "../../Assets/TripLOGO.png";
export default function PublicLayout() {
    const { pathname } = useLocation();
    const hideHeader = pathname === "/login" || pathname === "/signup";
    const hideFooter = hideHeader; // Hide footer on login/signup

    return (
        <div className="min-h-screen flex flex-col bg-white text-gray-800">
            {!hideHeader && (
                <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-black/5 shadow-lg">
                    <div className="max-w-7xl mx-auto h-16 px-4 grid grid-cols-3 items-center">
                        {/* Left: logo */}
                        <div className="justify-self-start">
                            <img src={IMG1} alt="TripNest Logo" className="h-10" />
                        </div>

                        {/* Center: nav links */}
                        <nav className="hidden sm:flex items-center gap-6 justify-self-center text-center">
                            <NavLink
                                to="/"
                                className={({ isActive }) =>
                                    `relative px-1 py-1 transition-colors
                                    after:absolute after:left-0 after:right-0 after:-bottom-1 after:h-0.5 after:bg-blue-600 after:scale-x-0 after:origin-left after:transition-transform
                                    hover:text-blue-600 hover:after:scale-x-100
                                    ${isActive ? "text-blue-600 after:scale-x-100" : "text-black"}`
                                }
                            >
                                Home
                            </NavLink>

                            <NavLink
                                to="/public-booking"
                                className={({ isActive }) =>
                                    `relative px-1 py-1 transition-colors
                                    after:absolute after:left-0 after:right-0 after:-bottom-1 after:h-0.5 after:bg-blue-600 after:scale-x-0 after:origin-left after:transition-transform
                                    hover:text-blue-600 hover:after:scale-x-100
                                    ${isActive ? "text-blue-600 after:scale-x-100" : "text-black"}`
                                }
                            >
                                Packages
                            </NavLink>
                            <NavLink
                                to="/public-guide-jobs"
                                className={({ isActive }) =>
                                    `relative px-1 py-1 transition-colors
                                    after:absolute after:left-0 after:right-0 after:-bottom-1 after:h-0.5 after:bg-blue-600 after:scale-x-0 after:origin-left after:transition-transform
                                    hover:text-blue-600 hover:after:scale-x-100
                                    ${isActive ? "text-blue-600 after:scale-x-100" : "text-black"}`
                                }
                            >
                                Careers
                            </NavLink>

                            <NavLink
                                to="/public-feedback"
                                className={({ isActive }) =>
                                    `relative px-1 py-1 transition-colors
                                    after:absolute after:left-0 after:right-0 after:-bottom-1 after:h-0.5 after:bg-blue-600 after:scale-x-0 after:origin-left after:transition-transform
                                    hover:text-blue-600 hover:after:scale-x-100
                                    ${isActive ? "text-blue-600 after:scale-x-100" : "text-black"}`
                                }
                            >
                                Feedback
                            </NavLink>
                        </nav>

                        {/* Right: auth buttons */}
                        <div className="hidden sm:flex items-center gap-4 justify-self-end">
                            <NavLink
                                to="/login"
                                className="rounded-full border border-blue-600 px-7 py-1 text-sm font-medium hover:bg-blue-600 hover:text-white active:scale-95 transition"
                            >
                                Login
                            </NavLink>
                            <NavLink
                                to="/signup"
                                className="rounded-full border text-white bg-blue-600 px-7 py-1 text-sm font-medium hover:bg-white hover:text-black active:scale-95 transition hover:border-blue-600"
                            >
                                Signup
                            </NavLink>
                        </div>
                    </div>
                </header>
            )}

            <main className="flex-1">
                <Outlet />
            </main>

            {!hideFooter && <SiteFooter />}
        </div>
    );
}
