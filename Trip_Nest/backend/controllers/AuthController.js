const bcrypt = require("bcrypt");
const User = require("../models/User");
const { signAccessToken, sendAuthCookie } = require("../middleware/auth");

const sanitize = (u) => ({
    id: u._id,
    name: u.name,
    username: u.username,
    email: u.email,
    roles: u.roles,
    profiles: {
        guide: u.profiles?.guide ? { status: u.profiles.guide.status } : undefined,
        vehicleOwner: u.profiles?.vehicleOwner ? { status: u.profiles.vehicleOwner.status } : undefined
    },
    createdAt: u.createdAt
    });

    exports.signup = async (req, res) => {
    try {
        const {
        name,
        username,
        email,
        password,
        roles = ["customer"],
        guideProfile,
        vehicleOwnerProfile
        } = req.body;

        if (!name || !username || !email || !password) {
        return res.status(400).json({ message: "Missing required fields" });
        }

        // disallow self-assigning admin role
        const requested = Array.isArray(roles) ? roles : ["customer"];
        const safeRoles = requested.filter((r) => r !== "admin");
        if (safeRoles.length === 0) safeRoles.push("customer");

        const exists = await User.findOne({ $or: [{ email }, { username }] });
        if (exists) return res.status(409).json({ message: "Email or username already in use" });

        const hash = await bcrypt.hash(password, 10);

        const doc = {
        name,
        username,
        email,
        password: hash,
        roles: Array.from(new Set(safeRoles)),
        profiles: {}
        };

        if (doc.roles.includes("guide")) {
        doc.profiles.guide = {
            licenseNo: guideProfile?.licenseNo || "",
            yearsExperience: guideProfile?.yearsExperience ?? 0,
            languages: guideProfile?.languages || [],
            areas: guideProfile?.areas || [],
            status: "pending"
        };
        }

        if (doc.roles.includes("vehicle_owner")) {
        doc.profiles.vehicleOwner = {
            driverLicenseNo: vehicleOwnerProfile?.driverLicenseNo || "",
            vehicles: vehicleOwnerProfile?.vehicles || [],
            status: "pending"
        };
        }

        const user = await User.create(doc);

        const token = signAccessToken(user);
        sendAuthCookie(res, token);

        return res.status(201).json({ user: sanitize(user) });
    } catch (err) {
        console.error("signup error:", err);
        return res.status(500).json({ message: "Server error" });
    }
    };

    exports.login = async (req, res) => {
    try {
        const { email, username, password } = req.body;
        if ((!email && !username) || !password) {
        return res.status(400).json({ message: "Email/username and password required" });
        }

        const user = await User.findOne(email ? { email } : { username });
        if (!user) return res.status(400).json({ message: "Invalid credentials" });

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return res.status(400).json({ message: "Invalid credentials" });

        const token = signAccessToken(user);
        sendAuthCookie(res, token);

        return res.json({ user: sanitize(user) });
    } catch (err) {
        console.error("login error:", err);
        return res.status(500).json({ message: "Server error" });
    }
    };

    exports.me = async (req, res) => {
    try {
        const user = await User.findById(req.user.sub);
        if (!user) return res.status(404).json({ message: "Not found" });
        return res.json({ user: sanitize(user) });
    } catch (err) {
        console.error("me error:", err);
        return res.status(500).json({ message: "Server error" });
    }
    };

    exports.logout = async (_req, res) => {
    res.clearCookie("access_token", {
        httpOnly: true,
        secure: process.env.COOKIE_SECURE === "true",
        sameSite: "lax"
    });
    return res.json({ ok: true });
};
