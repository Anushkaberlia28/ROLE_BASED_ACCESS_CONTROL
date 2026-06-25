const bcrypt = require("bcrypt");
const { eq } = require("drizzle-orm");
const db = require("../db");
const { users } = require("../db/schema");

async function seedCfo() {
    try {
        const existingCfo = await db
            .select()
            .from(users)
            .where(eq(users.email, "cfo@org.com"));

        if (existingCfo.length > 0) {
            console.log("CFO already exists");
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash("CFO#ORG@April2026", 10);

        await db.insert(users).values({
            name: "Chief Financial Officer",
            email: "cfo@org.com",
            passwordHash: hashedPassword,
            role: "CFO",
        });

        console.log("CFO seeded successfully");
        console.log("Email: cfo@org.com");
        console.log("Password: CFO#ORG@April2026");

        process.exit(0);
    } catch (error) {
        console.error("Error seeding CFO:", error);
        process.exit(1);
    }
}

seedCfo();