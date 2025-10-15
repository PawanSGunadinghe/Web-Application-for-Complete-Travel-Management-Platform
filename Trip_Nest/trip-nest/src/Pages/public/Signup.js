// src/Pages/public/Signup.js
import React, { useState } from "react";
import IMG1 from "../../Assets/TripLOGO.png";
import { api } from "../../features/auth/Api";
import { useNavigate, Link } from "react-router-dom";
import heroImg from "../../Assets/bgsl.jpg"; // background image

function Brand() {
    return (
        <div className="flex items-center justify-center gap-3">
        <img src={IMG1} alt="TripNest Logo" className="h-10" />
        </div>
    );
    }

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

    export default function SignupPage() {
    const [form, setForm] = useState({
        name: "",
        username: "",
        email: "",
        password: "",
        confirm: "",
    });
    const [role, setRole] = useState("customer"); // system actor
    const [showPwd, setShowPwd] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [serverError, setServerError] = useState("");

    const navigate = useNavigate();
    const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    // Input filtering functions
    const handleNameChange = (e) => {
        const value = e.target.value.replace(/[^A-Za-z\s]/g, ''); // Only letters and spaces
        setField("name", value);
    };

    const handleUsernameChange = (e) => {
        const value = e.target.value.replace(/[^a-zA-Z0-9._]/g, ''); // Only letters, numbers, underscore, dot
        if (value.length <= 20) { // Limit to 20 characters
            setField("username", value);
        }
    };

    const handleEmailChange = (e) => {
        const value = e.target.value.replace(/[^a-zA-Z0-9@._-]/g, ''); // Only simple email characters
        setField("email", value);
    };
    const usernameHint = "3–20 chars, letters, numbers, _ or .";

    const validate = () => {
        const e = {};
        
        // Full name validation - only letters and spaces
        if (!form.name.trim()) e.name = "Name is required";
        else if (!/^[A-Za-z\s]+$/.test(form.name)) e.name = "Only letters and spaces allowed";
        
        // Username validation - 3-20 chars, letters, numbers, underscore, dot
        if (!form.username.trim()) e.username = "Username is required";
        else if (form.username.length < 3) e.username = "Username must be at least 3 characters";
        else if (!/^[a-zA-Z0-9._]{3,20}$/.test(form.username)) e.username = usernameHint;
        
        // Email validation - simple format
        if (!form.email.trim()) e.email = "Email is required";
        else if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(form.email)) e.email = "Enter a valid email";
        
        // Password validation
        if (!form.password) e.password = "Password is required";
        else if (form.password.length < 8) e.password = "Use at least 8 characters";
        
        // Confirm password validation
        if (!form.confirm) e.confirm = "Confirm your password";
        else if (form.password !== form.confirm) e.confirm = "Passwords do not match";
        
        // Role validation
        if (!role) e.role = "Please select your role";
        
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setServerError("");
        if (!validate()) return;
        try {
        setSubmitting(true);
        await api.post("/auth/signup", {
            name: form.name,
            username: form.username,
            email: form.email,
            password: form.password,
            roles: [role],
        });
        const { data } = await api.get("/auth/me");
        const user = data.user;
        localStorage.setItem("user", JSON.stringify(user));
        navigate("/");
        } catch (err) {
        setServerError(err?.response?.data?.message || "Signup failed");
        } finally {
        setSubmitting(false);
        }
    };

    return (
        <div
        className="relative min-h-screen bg-center bg-cover"
        style={{ backgroundImage: `url(${heroImg})` }}
        >
        {/* dark overlay for contrast */}
        <div className="absolute inset-0 bg-black/60" />

        {/* centered glass card */}
        <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
            <div className="w-full max-w-md rounded-[32px] border border-white/30 bg-white/20 backdrop-blur-2xl ring-1 ring-white/40 shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
            {/* brand */}
            <div className="pt-7">
                <Brand />
            </div>

            <div className="px-7 pb-7 pt-3">
                <h1 className="text-center text-2xl font-semibold tracking-tight text-white">
                Create your account
                </h1>
                <p className="mt-1 text-center text-white text-sm">It takes less than a minute.</p>

                <form onSubmit={onSubmit} className="mt-6 space-y-4">
                {/* Name */}
                <div>
                    <label htmlFor="name" className="sr-only">Name</label>
                    <input
                    id="name"
                    type="text"
                    value={form.name}
                    onChange={handleNameChange}
                    className={`w-full rounded-2xl border border-white/60 bg-white/70 px-4 py-3 text-black placeholder-gray-600 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-black/80 focus:border-transparent ${errors.name ? "ring-2 ring-red-500" : ""}`}
                    placeholder="Full name"
                    autoComplete="name"
                    />
                    {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                </div>

                {/* Username */}
                <div>
                    <label htmlFor="username" className="sr-only">Username</label>
                    <input
                    id="username"
                    type="text"
                    value={form.username}
                    onChange={handleUsernameChange}
                    className={`w-full rounded-2xl border border-white/60 bg-white/70 px-4 py-3 text-black placeholder-gray-600 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-black/80 focus:border-transparent ${errors.username ? "ring-2 ring-red-500" : ""}`}
                    placeholder="Username"
                    autoComplete="username"
                    maxLength={20}
                    />
                    <p className={`mt-1 text-xs ${errors.username ? "text-red-600" : "text-white"}`}>
                    {errors.username || usernameHint}
                    </p>
                </div>

                {/* Email */}
                <div>
                    <label htmlFor="email" className="sr-only">Email address</label>
                    <input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={handleEmailChange}
                    className={`w-full rounded-2xl border border-white/60 bg-white/70 px-4 py-3 text-black placeholder-gray-600 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-black/80 focus:border-transparent ${errors.email ? "ring-2 ring-red-500" : ""}`}
                    placeholder="name@example.com"
                    autoComplete="email"
                    />
                    {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                </div>

                {/* Password */}
                <div className="relative">
                    <label htmlFor="password" className="sr-only">Password</label>
                    <input
                    id="password"
                    type={showPwd ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setField("password", e.target.value)}
                    className={`w-full rounded-2xl border border-white/60 bg-white/70 px-4 py-3 pr-16 text-black placeholder-gray-600 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-black/80 focus:border-transparent ${errors.password ? "ring-2 ring-red-500" : ""}`}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    />
                    <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-3 py-1 text-xs text-black/70 hover:text-black bg-white/60 backdrop-blur-sm border border-white/60"
                    >
                    {showPwd ? "Hide" : "Show"}
                    </button>
                    {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
                </div>

                {/* Confirm Password */}
                <div className="relative">
                    <label htmlFor="confirm" className="sr-only">Confirm password</label>
                    <input
                    id="confirm"
                    type={showConfirm ? "text" : "password"}
                    value={form.confirm}
                    onChange={(e) => setField("confirm", e.target.value)}
                    className={`w-full rounded-2xl border border-white/60 bg-white/70 px-4 py-3 pr-16 text-black placeholder-gray-600 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-black/80 focus:border-transparent ${errors.confirm ? "ring-2 ring-red-500" : ""}`}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    />
                    <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-3 py-1 text-xs text-black/70 hover:text-black bg-white/60 backdrop-blur-sm border border-white/60"
                    >
                    {showConfirm ? "Hide" : "Show"}
                    </button>
                    {errors.confirm && <p className="mt-1 text-xs text-red-600">{errors.confirm}</p>}
                </div>

                {/* Role */}
                <div>
                    <label htmlFor="role" className="sr-only">Role</label>
                    <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className={`w-full rounded-2xl border border-white/60 bg-white/70 px-4 py-3 text-black backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-black/80 focus:border-transparent ${errors.role ? "ring-2 ring-red-500" : ""}`}
                    >
                    <option value="customer">Customer</option>
                    <option value="guide">Tour Guide</option>
                    <option value="vehicle_owner">Vehicle Owner</option>
                    </select>
                    {errors.role && <p className="mt-1 text-xs text-red-600">{errors.role}</p>}
                </div>

                {/* Server error */}
                {serverError && <p className="text-sm text-red-600">{serverError}</p>}

                {/* Submit (pill button) */}
                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-full bg-black py-3 font-medium text-white shadow-lg shadow-black/25 hover:bg-black/90 disabled:opacity-60 active:scale-[0.98] transition"
                >
                    {submitting ? "Creating..." : "Create account"}
                </button>

                {/* Divider */}
                <div className="my-1 flex items-center gap-3">
                    <div className="h-px flex-1 bg-gray-400/60" />
                    <span className="text-xs text-white">or</span>
                    <div className="h-px flex-1 bg-gray-400/60" />
                </div>

                {/* Google button (round) */}
                <button
                    type="button"
                    className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/60 bg-white/80 backdrop-blur-sm hover:bg-white"
                    onClick={() => alert("Hook up Google OAuth for signup")}
                    aria-label="Sign up with Google"
                >
                    <GoogleIcon />
                </button>

                {/* Bottom link */}
                <p className="mt-4 text-center text-sm text-white">
                    Already have an account?{" "}
                    <Link to="/login" className="font-medium hover:underline">Sign in</Link>
                </p>
                </form>
            </div>
            </div>
        </div>
        </div>
    );
}
