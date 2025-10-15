// src/Pages/public/Login.js
import React, { useState } from "react";
import IMG1 from "../../Assets/TripLOGO.png";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
import heroImg from "../../Assets/bgsl.jpg";

function GoogleIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#EA4335" d="M24 9.5c3.66 0 6.95 1.26 9.55 3.72l7.16-7.16C36.57 2.08 30.78 0 24 0 14.62 0 6.51 5.38 2.56 13.22l8.83 6.86C13.3 13.89 18.16 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.5 24c0-1.64-.15-3.2-.44-4.71H24v9.02h12.7c-.55 2.97-2.19 5.49-4.66 7.18l7.12 5.53C44.1 37.12 46.5 31.06 46.5 24z"/>
        <path fill="#FBBC05" d="M11.39 31.68A14.5 14.5 0 0 1 9.5 24c0-2.67.72-5.18 1.98-7.34l-8.92-6.9C.86 12.77 0 18.23 0 24c0 5.69.84 11.07 2.45 15.99l8.94-8.31z"/>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.8l-7.12-5.53c-2 1.35-4.57 2.13-8.78 2.13-5.84 0-10.7-4.38-12.61-10.58l-8.94 8.31C6.3 44.67 14.41 48 24 48z"/>
        </svg>
    );
    }

    const landingByRole = {
    admin: "/admin",
    guide: "/guide/dashboard",
    vehicle_owner: "/owner/dashboard",
    customer: "/home",
    };
    const pickLandingPath = (roles = []) => {
    const order = ["admin", "guide", "vehicle_owner", "customer"];
    const top = order.find((r) => roles.includes(r)) || "customer";
    return landingByRole[top];
    };

    export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [remember, setRemember] = useState(false);
    const [showPwd, setShowPwd] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    const onSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
        const user = await login({ email, password });
        const from = location.state?.from?.pathname;
        navigate(from || pickLandingPath(user?.roles || []), { replace: true });
        } catch (err) {
        setError(err?.response?.data?.message || "Login failed");
        } finally {
        setLoading(false);
        }
    };

    return (
        <div
        className="relative min-h-screen bg-center bg-cover"
        style={{ backgroundImage: `url(${heroImg})` }}
        >
        {/* stronger dark overlay for contrast */}
        <div className="absolute inset-0 bg-black/60" />

        {/* centered glass card */}
        <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
            <div className="w-full max-w-md rounded-[32px] border border-white/30 bg-white/20 backdrop-blur-2xl ring-1 ring-white/40 shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
            {/* brand */}
            <div className="flex items-center justify-center gap-3 pt-7">
                <img src={IMG1} alt="TripNest Logo" className="h-10" />
            </div>

            <div className="px-7 pb-7 pt-3">
                <h1 className="text-center text-2xl font-semibold tracking-tight text-white">
                Sign In
                </h1>

                {/* form */}
                <form onSubmit={onSubmit} className="mt-6 space-y-4">
                {/* Email (rounded glass input) */}
                <div>
                    <label htmlFor="email" className="sr-only">Email address</label>
                    <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Email"
                    className="w-full rounded-2xl border border-white/60 bg-white/70 px-4 py-3 text-black placeholder-gray-600 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-black/80 focus:border-transparent"
                    />
                </div>

                {/* Password (rounded glass input) */}
                <div className="relative">
                    <label htmlFor="password" className="sr-only">Password</label>
                    <input
                    id="password"
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Password"
                    className="w-full rounded-2xl border border-white/60 bg-white/70 px-4 py-3 pr-16 text-black placeholder-gray-600 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-black/80 focus:border-transparent"
                    />
                    <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-3 py-1 text-xs text-black/70 hover:text-black bg-white/60 backdrop-blur-sm border border-white/60"
                    aria-label="Toggle password visibility"
                    >
                    {showPwd ? "Hide" : "Show"}
                    </button>
                </div>

                {/* remember + forgot */}
                <div className="flex items-center justify-between text-xs text-white">
                    <label className="inline-flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                        className="rounded border-gray-400 text-white focus:ring-black"
                    />
                    <span>Remember for 30 days</span>
                    </label>
                    <Link to="/signup" className="hover:underline">
                    Forgot password
                    </Link>
                </div>

                {/* error */}
                {error && <p className="text-sm text-red-600">{error}</p>}

                {/* primary button → pill & glassy shadow */}
                <button
                    type="submit"
                    disabled={loading}
                    className="mt-1 w-full rounded-full bg-black py-3 font-medium text-white shadow-lg shadow-black/25 hover:bg-black/90 active:scale-[0.98] transition"
                >
                    {loading ? "Signing in..." : "Sign In"}
                </button>

                {/* divider "or" */}
                <div className="my-1 flex items-center gap-3">
                    <div className="h-px flex-1 bg-gray-400/60" />
                    <span className="text-xs text-gray-800">or</span>
                    <div className="h-px flex-1 bg-gray-400/60" />
                </div>

                {/* round Google icon button (glass) */}
                <button
                    type="button"
                    onClick={() => alert("Hook up Google OAuth")}
                    className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/60 bg-white/80 backdrop-blur-sm hover:bg-white"
                    aria-label="Sign in with Google"
                >
                    <GoogleIcon />
                </button>

                {/* bottom link */}
                <p className="mt-4 text-center text-sm text-white">
                    Don’t have an account?{" "}
                    <Link to="/signup" className="font-medium hover:underline">
                    Sign up
                    </Link>
                </p>
                </form>
            </div>
            </div>
        </div>
        </div>
    );
}
