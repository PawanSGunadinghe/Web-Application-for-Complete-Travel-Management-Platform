// AdminLayouts.jsx
import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "../../features/auth/AuthContext";
import IMG1 from "../../Assets/TripLOGO.png";
import SiteFooter from "../../components/AdminFooter";

export default function AdminLayout() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // detect if path starts with /admin/guide-job/
    const isReportPage = location.pathname.startsWith("/admin/guide-job/");

    const handleLogout = async () => {
        try {
        await logout(); // calls POST /auth/logout, clears user
        } finally {
        navigate("/login", { replace: true });
        }
    };

    return (
        <div className="font-gugi">
        {/* only show header when NOT on report page */}
        {!isReportPage && (
            <header className="flex items-center justify-between px-8 py-4 shadow sticky top-0 z-50 bg-white bg-opacity-60 backdrop-blur-md">
            <div className="text-xl font-bold">
                <img src={IMG1} alt="TripTrap Logo" className="h-8" />
            </div>

            {/* navigation links */}
            <nav className="hidden md:flex space-x-6">
                <Link to="/admin">Packages</Link>
                <Link to="/admin/custom-bookings">Bookings</Link>
                <Link to="/admin/guide-admin">Guide</Link>
                <Link to="/admin/transport-admin">Transport</Link>
                <Link to="/admin/payroll/salaries">Finance</Link>
            </nav>

            <div className="flex items-center space-x-4 print:hidden">
                <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-full border bg-white hover:bg-black hover:text-white px-4 py-2 text-sm shadow-sm hover:shadow-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-1 transition-all duration-150"
                >
                <LogOut className="h-4 w-4 print:hidden" /> Logout
                </button>
            </div>
            </header>
        )}

        <Outlet />
        <SiteFooter />
        </div>
    );
}
