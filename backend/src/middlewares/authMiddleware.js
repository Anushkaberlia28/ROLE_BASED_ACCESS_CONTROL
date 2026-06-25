const jwt = require("jsonwebtoken");
const { eq } = require("drizzle-orm");

const db = require("../db");
const { users } = require("../db/schema");
const { COOKIE_NAME } = require("../utils/constants");

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.cookies[COOKIE_NAME];

        if (!token) {
            return res.status(401).json({
                status: "error",
                message: "Authentication required",
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const foundUsers = await db
            .select({
                id: users.id,
                name: users.name,
                email: users.email,
                role: users.role,
            })
            .from(users)
            .where(eq(users.id, decoded.id));

        if (foundUsers.length === 0) {
            return res.status(401).json({
                status: "error",
                message: "Invalid token user",
            });
        }

        req.user = foundUsers[0];
        next();
    } catch (error) {
        return res.status(401).json({
            status: "error",
            message: "Invalid or expired token",
        });
    }
};

module.exports = authMiddleware;