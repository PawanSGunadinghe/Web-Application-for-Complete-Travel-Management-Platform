import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { api } from "./Api";

const AuthCtx = createContext(null);

// src/features/auth/AuthContext.js
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get("/auth/me")
        .then(({ data }) => setUser(data.user))
        .catch(() => {})
        .finally(() => setLoading(false));
    }, []);

    const login = async (payload) => {
        await api.post("/auth/login", payload);
        const { data } = await api.get("/auth/me");
        setUser(data.user);          // <-- critical
        return data.user;
    };

    const signup = async (payload) => {
        await api.post("/auth/signup", payload);
        const { data } = await api.get("/auth/me");
        setUser(data.user);
        return data.user;
    };

    const logout = async () => {
        await api.post("/auth/logout");
        setUser(null);
    };

    return (
        <AuthCtx.Provider value={{ user, loading, login, signup, logout }}>
        {children}
        </AuthCtx.Provider>
    );
}


export const useAuth = () => useContext(AuthCtx);
