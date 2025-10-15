const User = require("../models/User");

exports.listPendingProviders = async (req, res) => {
    const users = await User.find({
        $or: [
            { "profiles.guide.status": "pending" },
            { "profiles.vehicleOwner.status": "pending" }
        ]
    }).select("name email roles profiles");
    res.json({ users });
};

exports.approveProvider = async (req, res) => {
    const { userId } = req.params;
    const { type } = req.body; // "guide" | "vehicleOwner"
    if (!["guide", "vehicleOwner"].includes(type)) {
        return res.status(400).json({ message: "Invalid type" });
    }
    const field = type === "guide" ? "profiles.guide.status" : "profiles.vehicleOwner.status";
    const user = await User.findByIdAndUpdate(
        userId,
        { $set: { [field]: "approved" } },
        { new: true }
    ).select("profiles");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ ok: true });
};

exports.rejectProvider = async (req, res) => {
    const { userId } = req.params;
    const { type } = req.body; // "guide" | "vehicleOwner"
    if (!["guide", "vehicleOwner"].includes(type)) {
        return res.status(400).json({ message: "Invalid type" });
    }
    const field = type === "guide" ? "profiles.guide.status" : "profiles.vehicleOwner.status";
    const user = await User.findByIdAndUpdate(
        userId,
        { $set: { [field]: "rejected" } },
        { new: true }
    ).select("profiles");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ ok: true });
};
