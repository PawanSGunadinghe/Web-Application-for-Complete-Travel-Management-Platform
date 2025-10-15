require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");
const http = require("http");
const socketIo = require("socket.io");

const authRoutes = require("./routes/auth");
const providerRoutes = require("./routes/providers");
const guideJobRoutes = require("./routes/guideJobs");
const guideApplicationRoutes = require("./routes/guideApplications");
const packageRoutes = require("./routes/packages");
const driverRoutes = require("./routes/drivers");
const payrollRoutes = require("./routes/payroll");
const vehiclePayrollRoutes = require("./routes/vehiclePayroll");
const financeRoutes = require("./routes/finance");
const expenseRoutes = require("./routes/expenses");


const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: process.env.CORS_ORIGIN || '*', credentials: true } });
app.set('io', io); // Make io available in routes/controllers

// middleware
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// routes
app.use("/api/auth", authRoutes);
app.use("/api/providers", providerRoutes);
app.use("/api/guide-jobs", guideJobRoutes);
app.use("/api/guide-applications", guideApplicationRoutes);
app.use("/api/packages", packageRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/vehicles", require("./routes/vehicles"));
app.use("/api/bookings", require("./routes/bookings"));
app.use("/api/feedbacks", require("./routes/feedback"));
app.use("/api/payroll", payrollRoutes);
app.use("/api/custom-packages", require("./routes/customPackages"));
app.use("/api/offers", require("./routes/offers"));
app.use("/api", vehiclePayrollRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/expenses", expenseRoutes);

// healthcheck
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// log connection state
mongoose.connection.on("connected", () => console.log("✅ Mongo connected"));
mongoose.connection.on("error", (err) => console.error("❌ Mongo error:", err.message));
mongoose.connection.on("disconnected", () => console.log("ℹ️ Mongo disconnected"));
// Catch-all for unknown API routes


async function start() {
    try {
        console.log("⏳ Connecting to Mongo...");
        await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 10000
        // If you prefer MONGODB_URI without /tripnest, also set:
        // dbName: "tripnest",
        });
        const port = process.env.PORT || 4000;
        app.listen(port, () => console.log(`🚀 API on http://localhost:${port}`));
    } catch (err) {
        console.error("💥 Mongo connection failed:", err.message);
        process.exit(1);
    }
}

start();
