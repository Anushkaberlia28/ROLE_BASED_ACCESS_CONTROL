const {
    assignEmployeeToManager,
    removeEmployeeManagerAssignment,
    getEmployeesByRole,
} = require("../services/employeeService");

const assignEmployee = async (req, res) => {
    try {
        const { employeeId, managerId } = req.body;

        const assignment = await assignEmployeeToManager({ employeeId, managerId });

        return res.status(201).json({
            status: "success",
            data: {
                assignment,
            },
        });
    } catch (error) {
        return res.status(400).json({
            status: "error",
            message: error.message,
        });
    }
};

const removeAssignment = async (req, res) => {
    try {
        const { employeeId } = req.body;

        const result = await removeEmployeeManagerAssignment({ employeeId });

        return res.status(200).json({
            status: "success",
            data: result,
        });
    } catch (error) {
        return res.status(400).json({
            status: "error",
            message: error.message,
        });
    }
};

const getEmployees = async (req, res) => {
    try {
        const employees = await getEmployeesByRole(req.user);

        return res.status(200).json({
            status: "success",
            data: {
                employees,
            },
        });
    } catch (error) {
        const statusCode =
            error.message === "EMP is not allowed to access employees list" ? 403 : 400;

        return res.status(statusCode).json({
            status: "error",
            message: error.message,
        });
    }
};

module.exports = {
    assignEmployee,
    removeAssignment,
    getEmployees,
};