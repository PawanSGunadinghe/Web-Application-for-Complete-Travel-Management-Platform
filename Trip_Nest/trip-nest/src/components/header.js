import IMG1 from "../Assets/TripLOGO.png";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";

function Header() {
  const { user, logout } = useAuth(); // make sure your AuthContext exposes these
    const location = useLocation();
    const navigate = useNavigate();

    if (location.pathname === "/login" || location.pathname === "/signup") return null;

    return (
        <header className="flex items-center justify-between px-8 py-4 shadow sticky top-0 z-50 bg-white bg-opacity-60 backdrop-blur-md">
        <div className="text-xl font-bold">
            <img src={IMG1} alt="TripTrap Logo" className="h-8" />
        </div>

        <nav className="hidden md:flex space-x-6">
            <NavLink to="/" className="hover:text-blue-500">Home</NavLink>
            <NavLink to="/booking" className="hover:text-blue-500">Bookings</NavLink>
            <NavLink to="/" className="hover:text-blue-500">Careers</NavLink>
            <NavLink to="/" className="hover:text-blue-500">FeedBacks</NavLink>
            <NavLink to="/user-profile" className="hover:text-blue-500">Profile</NavLink>
        </nav>

        <div className="flex items-center space-x-4">
            {user ? (
            <button
                onClick={async () => {
                try {
                    await logout();                // clears cookie + context
                    navigate("/login", { replace: true });
                } catch {}
                }}
                className="w-24 px-3 py-1.5 border rounded-2xl border-black text-black hover:bg-black hover:text-white text-sm"
            >
                Logout
            </button>
            ) : (
            <>
                <button
                onClick={() => navigate("/login")}
                className="w-24 px-3 py-1.5 border rounded-2xl border-black text-black hover:bg-black hover:text-white text-sm"
                >
                Login
                </button>
                <button
                onClick={() => navigate("/signup")}
                className="w-24 px-3 py-1.5 bg-black text-white rounded-2xl hover:bg-white hover:border-2 hover:border-black hover:text-black text-sm"
                >
                Register
                </button>
            </>
            )}
        </div>
        </header>
    );
}

export default Header;
