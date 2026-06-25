const bcrypt = require("bcrypt");
const { eq } = require("drizzle-orm");

const db = require("../db");
const { users } = require("../db/schema");
const { ROLES } = require("../utils/constants");

const isOrgEmail = (email) => {
    return typeof email === "string" && email.endsWith("@org.com");
};

const registerUser = async ({ name, email, password }) => {
    // 1. basic validation
    if (!name || !email || !password) {
        throw new Error("name, email and password are required");
    }

    // 2. org.com email check
    if (!isOrgEmail(email)) {
        throw new Error("Only org.com email is allowed");
    }

    // 3. check if user already exists
    const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

    if (existingUser.length > 0) {
        throw new Error("User already exists");
    }

    // 4. hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. create user with default EMP role
    const insertedUser = await db
        .insert(users)
        .values({
            name,
            email,
            passwordHash: hashedPassword,
            role: ROLES.EMP,
        })
        .returning({
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role,
        });

    return insertedUser[0];
};

const loginUser = async ({ email, password }) => {
    // 1. basic validation
    if (!email || !password) {
        throw new Error("email and password are required");
    }

    // 2. org.com email check
    if (!isOrgEmail(email)) {
        throw new Error("Only org.com email is allowed");
    }

    // 3. find user
    const foundUsers = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

    if (foundUsers.length === 0) {
        throw new Error("Invalid email or password");
    }

    const user = foundUsers[0];

    // 4. compare password
    const isPasswordCorrect = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordCorrect) {
        throw new Error("Invalid email or password");
    }

    // 5. return safe user object only
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
    };
};

module.exports = {
    registerUser,
    loginUser,
};