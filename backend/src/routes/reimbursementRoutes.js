const express = require("express");

const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const {
    createReimbursementController,
    updateReimbursementController,
    getReimbursementsController,
    getReimbursementsByUserIdController,
} = require("../controllers/reimbursementController");
const { ROLES } = require("../utils/constants");

const router = express.Router();

// POST /rest/reimbursements
// only EMP
router.post(
    "/",
    authMiddleware,
    roleMiddleware(ROLES.EMP),
    createReimbursementController
);

// PATCH /rest/reimbursements
// RM / APE / CFO can approve or reject
router.patch(
    "/",
    authMiddleware,
    roleMiddleware(ROLES.RM, ROLES.APE, ROLES.CFO),
    updateReimbursementController
);

// GET /rest/reimbursements
// EMP / RM / APE / CFO
router.get(
    "/",
    authMiddleware,
    roleMiddleware(ROLES.EMP, ROLES.RM, ROLES.APE, ROLES.CFO),
    getReimbursementsController
);

// GET /rest/reimbursements/:userId
// only RM
router.get(
    "/:userId",
    authMiddleware,
    roleMiddleware(ROLES.RM),
    getReimbursementsByUserIdController
);

module.exports = router;