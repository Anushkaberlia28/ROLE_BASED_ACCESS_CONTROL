const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/authRoutes");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 7002;

app.use(express.json());
app.use(cookieParser());

// health route
app.get("/", (req, res) => {
    return res.json({
        status: "success",
        message: "Server is running",
    });
});

// onboarding routes
app.use("/rest/onboardings", authRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});