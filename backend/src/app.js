const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/authRoutes");
const roleRoutes = require("./routes/roleRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const reimbursementRoutes = require("./routes/reimbursementRoutes");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 7002;

app.use(express.json());
app.use(cookieParser());

app.use((req, res, next) => {
    const origin = req.headers.origin || "null";
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS");
    res.setHeader("Vary", "Origin");

    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }

    next();
});

app.get("/", (req, res) => {
    return res.json({
        status: "success",
        message: "Server is running",
    });
});

// onboarding routes
app.use("/rest/onboardings", authRoutes);

// role routes
app.use("/rest/roles", roleRoutes);

app.use("/rest/employees", employeeRoutes);
app.use("/rest/reimbursements", reimbursementRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});