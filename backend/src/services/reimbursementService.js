const { eq, and, inArray } = require("drizzle-orm");

const db = require("../db");
const {
    users,
    reimbursements,
    reimbursementApprovals,
    employeeManagerAssignments,
} = require("../db/schema");
const { ROLES } = require("../utils/constants");

const REIMBURSEMENT_STATUS = {
    PENDING: "PENDING",
    APPROVED: "APPROVED",
    REJECTED: "REJECTED",
};

const APPROVAL_STAGE = {
    RM: "RM",
    APE: "APE",
    CFO: "CFO",
};

// --------------------
// POST /rest/reimbursements
// only EMP
// --------------------
const createReimbursement = async ({ title, description, amount, user }) => {
    if (!user) {
        throw new Error("Unauthorized");
    }

    if (user.role !== ROLES.EMP) {
        throw new Error("Only EMP can create reimbursement");
    }

    if (!title || !description || amount === undefined || amount === null) {
        throw new Error("title, description and amount are required");
    }

    if (Number(amount) <= 0) {
        throw new Error("amount must be greater than 0");
    }

    const insertedRows = await db
        .insert(reimbursements)
        .values({
            employeeId: user.id,
            title,
            description,
            amount: String(amount),
            status: REIMBURSEMENT_STATUS.PENDING,
            rmStatus: REIMBURSEMENT_STATUS.PENDING,
            apeStatus: REIMBURSEMENT_STATUS.PENDING,
            cfoStatus: REIMBURSEMENT_STATUS.PENDING,
        })
        .returning();

    return insertedRows[0];
};

// helper: check if EMP belongs to RM
const isEmployeeAssignedToRM = async (employeeId, managerId) => {
    const rows = await db
        .select()
        .from(employeeManagerAssignments)
        .where(
            and(
                eq(employeeManagerAssignments.employeeId, employeeId),
                eq(employeeManagerAssignments.managerId, managerId)
            )
        );

    return rows.length > 0;
};

// --------------------
// PATCH /rest/reimbursements
// RM / APE / CFO approval flow
// --------------------
const updateReimbursementStatus = async ({
    reimbursementId,
    action,
    remarks,
    user,
}) => {
    if (!user) {
        throw new Error("Unauthorized");
    }

    if (!reimbursementId || !action) {
        throw new Error("reimbursementId and action are required");
    }

    const normalizedAction = action.toUpperCase();

    if (
        normalizedAction !== REIMBURSEMENT_STATUS.APPROVED &&
        normalizedAction !== REIMBURSEMENT_STATUS.REJECTED
    ) {
        throw new Error("action must be APPROVED or REJECTED");
    }

    const reimbursementRows = await db
        .select()
        .from(reimbursements)
        .where(eq(reimbursements.id, reimbursementId));

    if (reimbursementRows.length === 0) {
        throw new Error("Reimbursement not found");
    }

    const reimbursement = reimbursementRows[0];

    // EMP cannot approve/reject
    if (user.role === ROLES.EMP) {
        throw new Error("EMP cannot update reimbursement status");
    }

    // ---------- RM FLOW ----------
    if (user.role === ROLES.RM) {
        const isAssigned = await isEmployeeAssignedToRM(
            reimbursement.employeeId,
            user.id
        );

        if (!isAssigned) {
            throw new Error("RM can only act on reimbursements of assigned employees");
        }

        if (reimbursement.rmStatus !== REIMBURSEMENT_STATUS.PENDING) {
            throw new Error("RM action already taken on this reimbursement");
        }

        await db
            .update(reimbursements)
            .set({
                rmStatus: normalizedAction,
                status:
                    normalizedAction === REIMBURSEMENT_STATUS.REJECTED
                        ? REIMBURSEMENT_STATUS.REJECTED
                        : REIMBURSEMENT_STATUS.PENDING,
                updatedAt: new Date(),
            })
            .where(eq(reimbursements.id, reimbursementId));

        await db.insert(reimbursementApprovals).values({
            reimbursementId,
            approverId: user.id,
            stage: APPROVAL_STAGE.RM,
            action: normalizedAction,
            remarks: remarks || null,
        });

        const updatedRows = await db
            .select()
            .from(reimbursements)
            .where(eq(reimbursements.id, reimbursementId));

        return updatedRows[0];
    }

    // ---------- APE FLOW ----------
    if (user.role === ROLES.APE) {
        if (reimbursement.rmStatus !== REIMBURSEMENT_STATUS.APPROVED) {
            throw new Error("APE can only act after RM approval");
        }

        if (reimbursement.apeStatus !== REIMBURSEMENT_STATUS.PENDING) {
            throw new Error("APE action already taken on this reimbursement");
        }

        await db
            .update(reimbursements)
            .set({
                apeStatus: normalizedAction,
                status:
                    normalizedAction === REIMBURSEMENT_STATUS.REJECTED
                        ? REIMBURSEMENT_STATUS.REJECTED
                        : REIMBURSEMENT_STATUS.PENDING,
                updatedAt: new Date(),
            })
            .where(eq(reimbursements.id, reimbursementId));

        await db.insert(reimbursementApprovals).values({
            reimbursementId,
            approverId: user.id,
            stage: APPROVAL_STAGE.APE,
            action: normalizedAction,
            remarks: remarks || null,
        });

        const updatedRows = await db
            .select()
            .from(reimbursements)
            .where(eq(reimbursements.id, reimbursementId));

        return updatedRows[0];
    }

    // ---------- CFO FLOW ----------
    if (user.role === ROLES.CFO) {
        if (reimbursement.rmStatus !== REIMBURSEMENT_STATUS.APPROVED) {
            throw new Error("CFO can only act after RM approval");
        }

        if (reimbursement.apeStatus !== REIMBURSEMENT_STATUS.APPROVED) {
            throw new Error("CFO can only act after APE approval");
        }

        if (reimbursement.cfoStatus !== REIMBURSEMENT_STATUS.PENDING) {
            throw new Error("CFO action already taken on this reimbursement");
        }

        await db
            .update(reimbursements)
            .set({
                cfoStatus: normalizedAction,
                status: normalizedAction,
                updatedAt: new Date(),
            })
            .where(eq(reimbursements.id, reimbursementId));

        await db.insert(reimbursementApprovals).values({
            reimbursementId,
            approverId: user.id,
            stage: APPROVAL_STAGE.CFO,
            action: normalizedAction,
            remarks: remarks || null,
        });

        const updatedRows = await db
            .select()
            .from(reimbursements)
            .where(eq(reimbursements.id, reimbursementId));

        return updatedRows[0];
    }

    throw new Error("Invalid role for reimbursement update");
};

// --------------------
// GET /rest/reimbursements
// role-based fetch
// --------------------
const getReimbursementsForUser = async (user) => {
    if (!user) {
        throw new Error("Unauthorized");
    }

    // EMP -> own reimbursements
    if (user.role === ROLES.EMP) {
        return await db
            .select()
            .from(reimbursements)
            .where(eq(reimbursements.employeeId, user.id));
    }

    // RM -> reimbursements of employees assigned to this RM
    if (user.role === ROLES.RM) {
        const assignmentRows = await db
            .select({
                employeeId: employeeManagerAssignments.employeeId,
            })
            .from(employeeManagerAssignments)
            .where(eq(employeeManagerAssignments.managerId, user.id));

        const employeeIds = assignmentRows.map((row) => row.employeeId);

        if (employeeIds.length === 0) {
            return [];
        }

        return await db
            .select()
            .from(reimbursements)
            .where(inArray(reimbursements.employeeId, employeeIds));
    }

    // APE -> reimbursements approved by RM and pending at APE
    if (user.role === ROLES.APE) {
        return await db
            .select()
            .from(reimbursements)
            .where(
                and(
                    eq(reimbursements.rmStatus, REIMBURSEMENT_STATUS.APPROVED),
                    eq(reimbursements.apeStatus, REIMBURSEMENT_STATUS.PENDING),
                    eq(reimbursements.status, REIMBURSEMENT_STATUS.PENDING)
                )
            );
    }

    // CFO -> reimbursements approved by RM and APE, pending at CFO
    if (user.role === ROLES.CFO) {
        return await db
            .select()
            .from(reimbursements)
            .where(
                and(
                    eq(reimbursements.rmStatus, REIMBURSEMENT_STATUS.APPROVED),
                    eq(reimbursements.apeStatus, REIMBURSEMENT_STATUS.APPROVED),
                    eq(reimbursements.cfoStatus, REIMBURSEMENT_STATUS.PENDING),
                    eq(reimbursements.status, REIMBURSEMENT_STATUS.PENDING)
                )
            );
    }

    return [];
};

// --------------------
// GET /rest/reimbursements/:userId
// RM can see subordinate EMP reimbursements only
// --------------------
const getReimbursementsByEmployeeIdForRM = async ({ employeeId, user }) => {
    if (!user) {
        throw new Error("Unauthorized");
    }

    if (user.role !== ROLES.RM) {
        throw new Error("Only RM can access this route");
    }

    if (!employeeId) {
        throw new Error("employeeId is required");
    }

    // employee must exist and be EMP
    const employeeRows = await db
        .select()
        .from(users)
        .where(eq(users.id, employeeId));

    if (employeeRows.length === 0) {
        throw new Error("Employee not found");
    }

    const employee = employeeRows[0];

    if (employee.role !== ROLES.EMP) {
        throw new Error("userId must belong to an EMP");
    }

    // employee must be subordinate of this RM
    const isAssigned = await isEmployeeAssignedToRM(employeeId, user.id);

    if (!isAssigned) {
        throw new Error("This employee is not assigned to the logged-in RM");
    }

    return await db
        .select()
        .from(reimbursements)
        .where(eq(reimbursements.employeeId, employeeId));
};

module.exports = {
    createReimbursement,
    updateReimbursementStatus,
    getReimbursementsForUser,
    getReimbursementsByEmployeeIdForRM,
};