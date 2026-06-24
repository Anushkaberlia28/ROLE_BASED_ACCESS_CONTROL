const { eq } = require("drizzle-orm");

const db = require("../db");
const { users } = require("../db/schema");
const { ROLES } = require("../utils/constants");

const VALID_ASSIGNABLE_ROLES = [ROLES.EMP, ROLES.RM, ROLES.APE, ROLES.CFO];

const assignRoleToUser = async ({ userId, role }) => {
    // 1. validation
    if (!userId || !role) {
        throw new Error("userId and role are required");
    }

    if (!VALID_ASSIGNABLE_ROLES.includes(role)) {
        throw new Error("Invalid role");
    }

    // 2. check user exists
    const foundUsers = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));

    if (foundUsers.length === 0) {
        throw new Error("User not found");
    }

    // 3. update role
    const updatedUsers = await db
        .update(users)
        .set({
            role,
            updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning({
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role,
        });

    return updatedUsers[0];
};

module.exports = {
    assignRoleToUser,
};