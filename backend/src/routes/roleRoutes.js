const express = require("express");

const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const { assignRole } = require("../controllers/roleController");
const { ROLES } = require("../utils/constants");

const router = express.Router();

// POST /rest/roles/assign
// only CFO can assign roles
router.post(
    "/assign",
    authMiddleware,
    roleMiddleware(ROLES.CFO),
    assignRole
);

module.exports = router;