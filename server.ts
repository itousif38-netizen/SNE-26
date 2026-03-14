import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Database from "better-sqlite3";

console.log("--- SERVER.TS LOADING ---");
console.log("NODE_ENV:", process.env.NODE_ENV);

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("UNHANDLED REJECTION at:", promise, "reason:", reason);
});

let db: any;
try {
  const dbPath = path.resolve("construct_erp.db");
  console.log(`Attempting to open database at: ${dbPath}`);
  db = new Database(dbPath, { verbose: console.log });
  console.log("Database opened successfully");
} catch (e) {
  console.error("CRITICAL: Failed to open database:", e);
  // We'll try to continue but routes will fail
}

// Initialize Database
if (db) {
  db.exec("PRAGMA foreign_keys = ON;");
  try {
    db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      start_date TEXT,
      address TEXT,
      budget REAL
    );

    CREATE TABLE IF NOT EXISTS workers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worker_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      project_id INTEGER,
      designation TEXT,
      joining_date TEXT,
      serial_no TEXT,
      FOREIGN KEY(project_id) REFERENCES projects(id)
    );

    CREATE TABLE IF NOT EXISTS billing (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sr_no TEXT,
      project_id INTEGER,
      bill_no TEXT,
      work_nature TEXT,
      amount REAL,
      month TEXT,
      certify_date TEXT,
      FOREIGN KEY(project_id) REFERENCES projects(id)
    );

    CREATE TABLE IF NOT EXISTS client_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      bill_value REAL,
      amount_received REAL,
      balance REAL,
      FOREIGN KEY(project_id) REFERENCES projects(id)
    );

    CREATE TABLE IF NOT EXISTS kharchi (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worker_id TEXT,
      project_id INTEGER,
      amount REAL,
      date TEXT,
      FOREIGN KEY(worker_id) REFERENCES workers(worker_id),
      FOREIGN KEY(project_id) REFERENCES projects(id)
    );

    CREATE TABLE IF NOT EXISTS advances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worker_id TEXT,
      project_id INTEGER,
      amount REAL,
      paid_by TEXT,
      remarks TEXT,
      date TEXT,
      FOREIGN KEY(worker_id) REFERENCES workers(worker_id),
      FOREIGN KEY(project_id) REFERENCES projects(id)
    );

    CREATE TABLE IF NOT EXISTS worker_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worker_id TEXT,
      project_id INTEGER,
      work_amount REAL,
      mess_deduction REAL,
      month TEXT,
      year INTEGER,
      UNIQUE(worker_id, project_id, month, year),
      FOREIGN KEY(worker_id) REFERENCES workers(worker_id),
      FOREIGN KEY(project_id) REFERENCES projects(id)
    );
  `);
    console.log("Database tables initialized");
  } catch (e) {
    console.error("Database initialization error:", e);
  }
}

async function startServer() {
  console.log("Starting server function called...");
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Direct health check on app (bypassing router)
  app.get("/healthz", (req, res) => {
    res.json({ status: "ok", source: "app_direct" });
  });

  // Request Logger - Moved to top
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  const apiRouter = express.Router();

  // Database-free health check
  apiRouter.get("/health", (req, res) => {
    res.json({ status: "ok", message: "Server is running", timestamp: new Date().toISOString() });
  });

  apiRouter.get("/test", (req, res) => {
    console.log("Test route hit");
    try {
      if (!db) throw new Error("Database not initialized");
      const dbCheck = db.prepare("SELECT count(*) as count FROM projects").get() as any;
      res.json({ 
        message: "Server is alive", 
        database: "Connected", 
        projectCount: dbCheck.count,
        time: new Date().toISOString() 
      });
    } catch (e: any) {
      res.status(500).json({ 
        message: "Server is alive but database error", 
        error: e.message,
        time: new Date().toISOString() 
      });
    }
  });

  // Projects
  apiRouter.get("/projects", (req, res) => {
    console.log("GET /api/projects request received");
    try {
      if (!db) {
        console.error("Database not initialized");
        return res.status(500).json({ error: "Database not initialized" });
      }
      const projects = db.prepare("SELECT * FROM projects").all();
      console.log(`Fetched ${projects.length} projects`);
      res.json(projects);
    } catch (e: any) {
      console.error("Error in GET /api/projects:", e);
      res.status(500).json({ error: e.message });
    }
  });

  apiRouter.post("/projects", (req, res) => {
    console.log("POST /api/projects received:", req.body);
    try {
      const { name, start_date, address, budget } = req.body;
      if (!name) throw new Error("Project name is required");
      
      const info = db.prepare("INSERT INTO projects (name, start_date, address, budget) VALUES (?, ?, ?, ?)").run(name, start_date, address, budget);
      console.log("Project inserted successfully:", info);
      res.json({ id: info.lastInsertRowid });
    } catch (e: any) {
      console.error("CRITICAL ERROR in POST /api/projects:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // Workers
  apiRouter.get("/workers", (req, res) => {
    try {
      const workers = db.prepare(`
        SELECT w.*, p.name as project_name 
        FROM workers w 
        LEFT JOIN projects p ON w.project_id = p.id
      `).all();
      res.json(workers);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  apiRouter.post("/workers", (req, res) => {
    console.log("POST /api/workers", req.body);
    const { worker_id, name, project_id, designation, joining_date, serial_no } = req.body;
    try {
      const info = db.prepare("INSERT INTO workers (worker_id, name, project_id, designation, joining_date, serial_no) VALUES (?, ?, ?, ?, ?, ?)").run(worker_id, name, project_id, designation, joining_date, serial_no);
      res.json({ id: info.lastInsertRowid });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Billing
  apiRouter.get("/billing", (req, res) => {
    try {
      const billing = db.prepare(`
        SELECT b.*, p.name as project_name 
        FROM billing b 
        LEFT JOIN projects p ON b.project_id = p.id
      `).all();
      res.json(billing);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  apiRouter.post("/billing", (req, res) => {
    try {
      const { sr_no, project_id, bill_no, work_nature, amount, month, certify_date } = req.body;
      const info = db.prepare("INSERT INTO billing (sr_no, project_id, bill_no, work_nature, amount, month, certify_date) VALUES (?, ?, ?, ?, ?, ?, ?)").run(sr_no, project_id, bill_no, work_nature, amount, month, certify_date);
      res.json({ id: info.lastInsertRowid });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Client Payments
  apiRouter.get("/client-payments", (req, res) => {
    try {
      const payments = db.prepare(`
        SELECT cp.*, p.name as project_name 
        FROM client_payments cp 
        LEFT JOIN projects p ON cp.project_id = p.id
      `).all();
      res.json(payments);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  apiRouter.post("/client-payments", (req, res) => {
    try {
      const { project_id, bill_value, amount_received, balance } = req.body;
      const info = db.prepare("INSERT INTO client_payments (project_id, bill_value, amount_received, balance) VALUES (?, ?, ?, ?)").run(project_id, bill_value, amount_received, balance);
      res.json({ id: info.lastInsertRowid });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Kharchi
  apiRouter.get("/kharchi", (req, res) => {
    try {
      const kharchi = db.prepare(`
        SELECT k.*, w.name as worker_name, p.name as project_name 
        FROM kharchi k 
        JOIN workers w ON k.worker_id = w.worker_id
        JOIN projects p ON k.project_id = p.id
      `).all();
      res.json(kharchi);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  apiRouter.post("/kharchi", (req, res) => {
    try {
      const { worker_id, project_id, amount, date } = req.body;
      const info = db.prepare("INSERT INTO kharchi (worker_id, project_id, amount, date) VALUES (?, ?, ?, ?)").run(worker_id, project_id, amount, date);
      res.json({ id: info.lastInsertRowid });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Advances
  apiRouter.get("/advances", (req, res) => {
    try {
      const advances = db.prepare(`
        SELECT a.*, w.name as worker_name, p.name as project_name 
        FROM advances a 
        JOIN workers w ON a.worker_id = w.worker_id
        JOIN projects p ON a.project_id = p.id
      `).all();
      res.json(advances);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  apiRouter.post("/advances", (req, res) => {
    try {
      const { worker_id, project_id, amount, paid_by, remarks, date } = req.body;
      const info = db.prepare("INSERT INTO advances (worker_id, project_id, amount, paid_by, remarks, date) VALUES (?, ?, ?, ?, ?, ?)").run(worker_id, project_id, amount, paid_by, remarks, date);
      res.json({ id: info.lastInsertRowid });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Worker Payments Summary
  apiRouter.get("/worker-payments-summary", (req, res) => {
    try {
      const { project_id, month, year } = req.query;
      const workers = db.prepare(`
        SELECT w.worker_id, w.name, w.serial_no
        FROM workers w
        WHERE w.project_id = ?
      `).all(project_id);

      const summaries = workers.map((worker: any) => {
        const kharchi = db.prepare(`
          SELECT SUM(amount) as total 
          FROM kharchi 
          WHERE worker_id = ? AND strftime('%m', date) = ? AND strftime('%Y', date) = ?
        `).get(worker.worker_id, month, year) as any;

        const advances = db.prepare(`
          SELECT SUM(amount) as total 
          FROM advances 
          WHERE worker_id = ? AND project_id = ?
        `).get(worker.worker_id, project_id) as any;

        const paymentRecord = db.prepare(`
          SELECT work_amount, mess_deduction 
          FROM worker_payments 
          WHERE worker_id = ? AND project_id = ? AND month = ? AND year = ?
        `).get(worker.worker_id, project_id, month, year) as any;

        return {
          ...worker,
          work_amount: paymentRecord?.work_amount || 0,
          mess_deduction: paymentRecord?.mess_deduction || 0,
          kharchi_deduction: kharchi?.total || 0,
          advance_deduction: advances?.total || 0,
          final_payment: (paymentRecord?.work_amount || 0) - (paymentRecord?.mess_deduction || 0) - (kharchi?.total || 0) - (advances?.total || 0)
        };
      });
      res.json(summaries);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  apiRouter.post("/worker-payments", (req, res) => {
    try {
      const { worker_id, project_id, work_amount, mess_deduction, month, year } = req.body;
      const info = db.prepare(`
        INSERT INTO worker_payments (worker_id, project_id, work_amount, mess_deduction, month, year) 
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(worker_id, project_id, month, year) DO UPDATE SET
        work_amount = excluded.work_amount,
        mess_deduction = excluded.mess_deduction
      `).run(worker_id, project_id, work_amount, mess_deduction, month, year);
      res.json({ id: info.lastInsertRowid });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Mount API Router
  app.use("/api", apiRouter);

  // Catch-all for unmatched API routes
  apiRouter.all("*", (req, res) => {
    console.warn(`404 - Unmatched API Request: ${req.method} ${req.url}`);
    res.status(404).json({ 
      error: "API route not found", 
      method: req.method, 
      url: req.url,
      suggestion: "Check if the route is defined in server.ts"
    });
  });

  console.log("API routes mounted. Initializing Vite...");

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  console.log(`Attempting to start server on port ${PORT}...`);
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SUCCESS: Server is listening on 0.0.0.0:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`Local URL: http://localhost:${PORT}`);
  });

  // Global Error Handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("GLOBAL ERROR:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  });
}

startServer().catch((err) => {
  console.error("FATAL ERROR DURING SERVER STARTUP:", err);
  process.exit(1);
});
