const { assignRoleToUser } = require("../services/roleService");

const assignRole = async (req, res) => {
    try {
        const { userId, role } = req.body;

        const updatedUser = await assignRoleToUser({ userId, role });

        return res.status(200).json({
            status: "success",
            data: {
                user: updatedUser,
            },
        });
    } catch (error) {
        return res.status(400).json({
            status: "error",
            message: error.message,
        });
    }
};

module.exports = {
    assignRole,
};