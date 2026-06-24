const express = require("express");
const dotenv = require("dotenv");
const pool = require("./config/db");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 7002;

app.use(express.json());

app.get("/", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");
        res.json({
            status: "success",
            message: "Server and DB are working",
            time: result.rows[0].now,
        });
    } catch (error) {
        console.error("DB connection error:", error.message);
        res.status(500).json({
            status: "error",
            message: "Database connection failed",
            error: error.message,
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
