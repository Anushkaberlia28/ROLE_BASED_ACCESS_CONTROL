const {
    createReimbursement,
    updateReimbursementStatus,
    getReimbursementsForUser,
    getReimbursementsByEmployeeIdForRM,
} = require("../services/reimbursementService");

const createReimbursementController = async (req, res) => {
    try {
        const { title, description, amount } = req.body;

        const reimbursement = await createReimbursement({
            title,
            description,
            amount,
            user: req.user,
        });

        return res.status(201).json({
            status: "success",
            data: {
                reimbursement,
            },
        });
    } catch (error) {
        const statusCode =
            error.message === "Only EMP can create reimbursement" ? 403 : 400;

        return res.status(statusCode).json({
            status: "error",
            message: error.message,
        });
    }
};

const updateReimbursementController = async (req, res) => {
    try {
        const { reimbursementId, action, remarks } = req.body;

        const reimbursement = await updateReimbursementStatus({
            reimbursementId,
            action,
            remarks,
            user: req.user,
        });

        return res.status(200).json({
            status: "success",
            data: {
                reimbursement,
            },
        });
    } catch (error) {
        const forbiddenMessages = [
            "EMP cannot update reimbursement status",
            "RM can only act on reimbursements of assigned employees",
            "APE can only act after RM approval",
            "CFO can only act after RM approval",
            "CFO can only act after APE approval",
            "Only RM can access this route",
        ];

        const statusCode = forbiddenMessages.includes(error.message) ? 403 : 400;

        return res.status(statusCode).json({
            status: "error",
            message: error.message,
        });
    }
};

const getReimbursementsController = async (req, res) => {
    try {
        const reimbursementList = await getReimbursementsForUser(req.user);

        return res.status(200).json({
            status: "success",
            data: {
                reimbursements: reimbursementList,
            },
        });
    } catch (error) {
        return res.status(400).json({
            status: "error",
            message: error.message,
        });
    }
};

const getReimbursementsByUserIdController = async (req, res) => {
    try {
        const { userId } = req.params;

        const reimbursementList = await getReimbursementsByEmployeeIdForRM({
            employeeId: Number(userId),
            user: req.user,
        });

        return res.status(200).json({
            status: "success",
            data: {
                reimbursements: reimbursementList,
            },
        });
    } catch (error) {
        const statusCode =
            error.message === "Only RM can access this route" ||
                error.message === "This employee is not assigned to the logged-in RM"
                ? 403
                : 400;

        return res.status(statusCode).json({
            status: "error",
            message: error.message,
        });
    }
};

module.exports = {
    createReimbursementController,
    updateReimbursementController,
    getReimbursementsController,
    getReimbursementsByUserIdController,
};