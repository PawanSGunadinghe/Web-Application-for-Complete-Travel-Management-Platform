import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function RequireAuth({ roles = [] }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) return <div className="p-6">Loading…</div>;
    if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

    const hasRole = roles.length === 0 || roles.some(r => user.roles?.includes(r));
    if (!hasRole) return <Navigate to="/unauthorized" replace />;

    return <Outlet />;
}
