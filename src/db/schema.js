const {
    pgTable,
    serial,
    varchar,
    text,
    timestamp,
    integer,
    decimal,
    unique,
    pgEnum,
} = require("drizzle-orm/pg-core");

// enums
const roleEnum = pgEnum("role", ["EMP", "RM", "APE", "CFO"]);
const reimbursementStatusEnum = pgEnum("reimbursement_status", [
    "PENDING",
    "APPROVED",
    "REJECTED",
]);
const decisionEnum = pgEnum("decision", ["APPROVED", "REJECTED"]);

// users table
const users = pgTable("users", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    role: roleEnum("role").default("EMP").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

// employee-manager assignments
const employeeManagerAssignments = pgTable(
    "employee_manager_assignments",
    {
        id: serial("id").primaryKey(),
        employeeId: integer("employee_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        managerId: integer("manager_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        createdAt: timestamp("created_at").defaultNow(),
    },
    (table) => ({
        employeeUnique: unique().on(table.employeeId),
    })
);

// reimbursements
const reimbursements = pgTable("reimbursements", {
    id: serial("id").primaryKey(),
    employeeId: integer("employee_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),

    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),

    status: reimbursementStatusEnum("status").default("PENDING").notNull(),
    rmStatus: reimbursementStatusEnum("rm_status").default("PENDING").notNull(),
    apeStatus: reimbursementStatusEnum("ape_status").default("PENDING").notNull(),
    cfoStatus: reimbursementStatusEnum("cfo_status").default("PENDING").notNull(),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

// reimbursement approvals
const reimbursementApprovals = pgTable("reimbursement_approvals", {
    id: serial("id").primaryKey(),
    reimbursementId: integer("reimbursement_id")
        .notNull()
        .references(() => reimbursements.id, { onDelete: "cascade" }),

    approverId: integer("approver_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),

    approverRole: roleEnum("approver_role").notNull(),
    decision: decisionEnum("decision").notNull(),
    remarks: text("remarks"),
    createdAt: timestamp("created_at").defaultNow(),
});

module.exports = {
    users,
    employeeManagerAssignments,
    reimbursements,
    reimbursementApprovals,
    roleEnum,
    reimbursementStatusEnum,
    decisionEnum,
};