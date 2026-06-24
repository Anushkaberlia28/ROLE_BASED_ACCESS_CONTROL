const { registerUser, loginUser } = require("../services/authService");
const { generateToken } = require("../utils/jwt");
const { COOKIE_NAME } = require("../utils/constants");

const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const createdUser = await registerUser({ name, email, password });

        return res.status(201).json({
            status: "success",
            data: {
                user: createdUser,
            },
        });
    } catch (error) {
        return res.status(400).json({
            status: "error",
            message: error.message,
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await loginUser({ email, password });

        // create jwt token
        const token = generateToken({
            id: user.id,
            email: user.email,
            role: user.role,
        });

        // set cookie-based auth
        res.cookie(COOKIE_NAME, token, {
            httpOnly: true,
            secure: false, // keep false for local dev
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
            status: "success",
            data: {
                user,
            },
        });
    } catch (error) {
        return res.status(400).json({
            status: "error",
            message: error.message,
        });
    }
};

const logout = async (req, res) => {
    try {
        res.clearCookie(COOKIE_NAME);

        return res.status(200).json({
            status: "success",
            message: "Logged out successfully",
        });
    } catch (error) {
        return res.status(400).json({
            status: "error",
            message: error.message,
        });
    }
};

module.exports = {
    register,
    login,
    logout,
};