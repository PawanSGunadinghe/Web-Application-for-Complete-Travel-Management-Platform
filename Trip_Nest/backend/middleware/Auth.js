const jwt = require("jsonwebtoken");
const User = require("../models/User");

function signAccessToken(user) {
    return jwt.sign(
        {
        sub: user._id.toString(),
        email: user.email,
        roles: user.roles // array
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES || "1h" }
    );
    }

    function sendAuthCookie(res, token) {
    res.cookie("access_token", token, {
        httpOnly: true,
        secure: process.env.COOKIE_SECURE === "true",
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 // 1h
    });
    }

    function requireAuth(req, res, next) {
    const token =
        req.cookies?.access_token ||
        (req.headers.authorization || "").replace("Bearer ", "");

    if (!token) return res.status(401).json({ message: "Unauthorized" });

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = payload; // { sub, email, roles: [] }
        next();
    } catch {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
    }

    function requireRole(...roles) {
    return (req, res, next) => {
        const userRoles = req.user?.roles || [];
        const ok = roles.some((r) => userRoles.includes(r));
        if (!ok) return res.status(403).json({ message: "Forbidden" });
        next();
    };
    }

    // Optional: ensure provider profile is approved
    function requireApprovedProfile(type /* 'guide' | 'vehicleOwner' */) {
    return async (req, res, next) => {
        try {
        const u = await User.findById(req.user.sub).select("profiles");
        const status =
            type === "guide" ? u?.profiles?.guide?.status : u?.profiles?.vehicleOwner?.status;
        if (status !== "approved") {
            return res.status(403).json({ message: `${type} profile not approved` });
        }
        next();
        } catch (e) {
        return res.status(500).json({ message: "Server error" });
        }
    };
    }

     function isAdmin(user) {
    try {
        const roles = Array.isArray(user?.roles) ? user.roles : [];
        return roles.includes("admin");
    } catch {
        return false;
    }
    }

    module.exports = {
    signAccessToken,
    sendAuthCookie,
    requireAuth,
    requireRole,
    requireApprovedProfile,
    requireApprovedProfile,
    isAdmin
};
