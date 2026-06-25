const pool = require("../config/db");

const migrate = async () => {
    try {
        console.log("Starting migrations...");

        // 1. USERS TABLE
        await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role VARCHAR(10) NOT NULL DEFAULT 'EMP',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT chk_user_role CHECK (role IN ('EMP', 'RM', 'APE', 'CFO'))
      );
    `);

        console.log("users table created");

        // 2. EMPLOYEE-MANAGER ASSIGNMENT TABLE
        await pool.query(`
      CREATE TABLE IF NOT EXISTS employee_manager_assignments (
        id SERIAL PRIMARY KEY,
        employee_id INT NOT NULL UNIQUE,
        manager_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_employee
          FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_manager
          FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

        console.log("employee_manager_assignments table created");

        // 3. REIMBURSEMENTS TABLE
        await pool.query(`
      CREATE TABLE IF NOT EXISTS reimbursements (
        id SERIAL PRIMARY KEY,
        employee_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),

        status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        rm_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        ape_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        cfo_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT fk_reimbursement_employee
          FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE,

        CONSTRAINT chk_reimbursement_status
          CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),

        CONSTRAINT chk_rm_status
          CHECK (rm_status IN ('PENDING', 'APPROVED', 'REJECTED')),

        CONSTRAINT chk_ape_status
          CHECK (ape_status IN ('PENDING', 'APPROVED', 'REJECTED')),

        CONSTRAINT chk_cfo_status
          CHECK (cfo_status IN ('PENDING', 'APPROVED', 'REJECTED'))
      );
    `);

        console.log("reimbursements table created");

        // 4. REIMBURSEMENT APPROVALS TABLE
        await pool.query(`
      CREATE TABLE IF NOT EXISTS reimbursement_approvals (
        id SERIAL PRIMARY KEY,
        reimbursement_id INT NOT NULL,
        approver_id INT NOT NULL,
        approver_role VARCHAR(10) NOT NULL,
        decision VARCHAR(20) NOT NULL,
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT fk_reimbursement
          FOREIGN KEY (reimbursement_id) REFERENCES reimbursements(id) ON DELETE CASCADE,

        CONSTRAINT fk_approver
          FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE CASCADE,

        CONSTRAINT chk_approver_role
          CHECK (approver_role IN ('RM', 'APE', 'CFO')),

        CONSTRAINT chk_decision
          CHECK (decision IN ('APPROVED', 'REJECTED'))
      );
    `);

        console.log("reimbursement_approvals table created");

        console.log("All migrations completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error.message);
        process.exit(1);
    }
};

migrate();