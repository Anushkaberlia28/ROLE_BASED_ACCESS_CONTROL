const express = require("express");

const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const {
    assignEmployee,
    removeAssignment,
    getEmployees,
} = require("../controllers/employeeController");
const { ROLES } = require("../utils/constants");

const router = express.Router();

// GET /rest/employees
// allowed for RM, APE, CFO
router.get(
    "/",
    authMiddleware,
    roleMiddleware(ROLES.RM, ROLES.APE, ROLES.CFO),
    getEmployees
);

// POST /rest/employees/assign
// only CFO
router.post(
    "/assign",
    authMiddleware,
    roleMiddleware(ROLES.CFO),
    assignEmployee
);

// DELETE /rest/employees/assign
// only CFO
router.delete(
    "/assign",
    authMiddleware,
    roleMiddleware(ROLES.CFO),
    removeAssignment
);

module.exports = router;