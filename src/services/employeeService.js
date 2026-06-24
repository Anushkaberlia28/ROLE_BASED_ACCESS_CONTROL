const { eq, and, inArray } = require("drizzle-orm");

const db = require("../db");
const { users, employeeManagerAssignments } = require("../db/schema");
const { ROLES } = require("../utils/constants");

// POST /rest/employees/assign
const assignEmployeeToManager = async ({ employeeId, managerId }) => {
    if (!employeeId || !managerId) {
        throw new Error("employeeId and managerId are required");
    }

    // 1. employee must exist
    const employeeRows = await db
        .select()
        .from(users)
        .where(eq(users.id, employeeId));

    if (employeeRows.length === 0) {
        throw new Error("Employee not found");
    }

    const employee = employeeRows[0];

    if (employee.role !== ROLES.EMP) {
        throw new Error("Only EMP can be assigned to a manager");
    }

    // 2. manager must exist
    const managerRows = await db
        .select()
        .from(users)
        .where(eq(users.id, managerId));

    if (managerRows.length === 0) {
        throw new Error("Manager not found");
    }

    const manager = managerRows[0];

    if (manager.role !== ROLES.RM) {
        throw new Error("managerId must belong to an RM user");
    }

    // 3. check if employee is already assigned
    const existingAssignment = await db
        .select()
        .from(employeeManagerAssignments)
        .where(eq(employeeManagerAssignments.employeeId, employeeId));

    if (existingAssignment.length > 0) {
        throw new Error("Employee is already assigned to a manager");
    }

    // 4. create assignment
    const insertedAssignment = await db
        .insert(employeeManagerAssignments)
        .values({
            employeeId,
            managerId,
        })
        .returning();

    return insertedAssignment[0];
};

// DELETE /rest/employees/assign
const removeEmployeeManagerAssignment = async ({ employeeId }) => {
    if (!employeeId) {
        throw new Error("employeeId is required");
    }

    const existingAssignment = await db
        .select()
        .from(employeeManagerAssignments)
        .where(eq(employeeManagerAssignments.employeeId, employeeId));

    if (existingAssignment.length === 0) {
        throw new Error("Assignment not found");
    }

    await db
        .delete(employeeManagerAssignments)
        .where(eq(employeeManagerAssignments.employeeId, employeeId));

    return { employeeId };
};

// GET /rest/employees
const getEmployeesByRole = async (loggedInUser) => {
    if (!loggedInUser) {
        throw new Error("Unauthorized");
    }

    // EMP -> not allowed
    if (loggedInUser.role === ROLES.EMP) {
        throw new Error("EMP is not allowed to access employees list");
    }

    // CFO -> all users
    if (loggedInUser.role === ROLES.CFO) {
        const allUsers = await db
            .select({
                id: users.id,
                name: users.name,
                email: users.email,
                role: users.role,
            })
            .from(users);

        return allUsers;
    }

    // APE -> all EMP + RM
    if (loggedInUser.role === ROLES.APE) {
        const apeVisibleUsers = await db
            .select({
                id: users.id,
                name: users.name,
                email: users.email,
                role: users.role,
            })
            .from(users)
            .where(inArray(users.role, [ROLES.EMP, ROLES.RM]));

        return apeVisibleUsers;
    }

    // RM -> only employees assigned to that RM
    if (loggedInUser.role === ROLES.RM) {
        const assignedEmployees = await db
            .select({
                id: users.id,
                name: users.name,
                email: users.email,
                role: users.role,
            })
            .from(employeeManagerAssignments)
            .innerJoin(
                users,
                eq(employeeManagerAssignments.employeeId, users.id)
            )
            .where(
                and(
                    eq(employeeManagerAssignments.managerId, loggedInUser.id),
                    eq(users.role, ROLES.EMP)
                )
            );

        // because innerJoin returns nested objects, map only user fields
        return assignedEmployees.map((row) => ({
            id: row.id,
            name: row.name,
            email: row.email,
            role: row.role,
        }));
    }

    return [];
};

module.exports = {
    assignEmployeeToManager,
    removeEmployeeManagerAssignment,
    getEmployeesByRole,
};