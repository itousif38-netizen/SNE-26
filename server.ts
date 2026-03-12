import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Database from "better-sqlite3";

const db = new Database("construct_erp.db", { verbose: console.log });

// Initialize Database
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

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  
  // Projects
  app.get("/api/projects", (req, res) => {
    const projects = db.prepare("SELECT * FROM projects").all();
    res.json(projects);
  });

  app.post("/api/projects", (req, res) => {
    console.log("POST /api/projects", req.body);
    try {
      const { name, start_date, address, budget } = req.body;
      const info = db.prepare("INSERT INTO projects (name, start_date, address, budget) VALUES (?, ?, ?, ?)").run(name, start_date, address, budget);
      console.log("Project inserted:", info);
      res.json({ id: info.lastInsertRowid });
    } catch (e: any) {
      console.error("Error in POST /api/projects:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // Workers
  app.get("/api/workers", (req, res) => {
    const workers = db.prepare(`
      SELECT w.*, p.name as project_name 
      FROM workers w 
      LEFT JOIN projects p ON w.project_id = p.id
    `).all();
    res.json(workers);
  });

  app.post("/api/workers", (req, res) => {
    console.log("POST /api/workers", req.body);
    const { worker_id, name, project_id, designation, joining_date, serial_no } = req.body;
    try {
      const info = db.prepare("INSERT INTO workers (worker_id, name, project_id, designation, joining_date, serial_no) VALUES (?, ?, ?, ?, ?, ?)").run(worker_id, name, project_id, designation, joining_date, serial_no);
      console.log("Worker inserted:", info);
      res.json({ id: info.lastInsertRowid });
    } catch (e: any) {
      console.error("Error in POST /api/workers:", e);
      res.status(400).json({ error: e.message });
    }
  });

  // Billing
  app.get("/api/billing", (req, res) => {
    const billing = db.prepare(`
      SELECT b.*, p.name as project_name 
      FROM billing b 
      LEFT JOIN projects p ON b.project_id = p.id
    `).all();
    res.json(billing);
  });

  app.post("/api/billing", (req, res) => {
    console.log("POST /api/billing", req.body);
    try {
      const { sr_no, project_id, bill_no, work_nature, amount, month, certify_date } = req.body;
      const info = db.prepare("INSERT INTO billing (sr_no, project_id, bill_no, work_nature, amount, month, certify_date) VALUES (?, ?, ?, ?, ?, ?, ?)").run(sr_no, project_id, bill_no, work_nature, amount, month, certify_date);
      res.json({ id: info.lastInsertRowid });
    } catch (e: any) {
      console.error("Error in POST /api/billing:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // Client Payments
  app.get("/api/client-payments", (req, res) => {
    const payments = db.prepare(`
      SELECT cp.*, p.name as project_name 
      FROM client_payments cp 
      LEFT JOIN projects p ON cp.project_id = p.id
    `).all();
    res.json(payments);
  });

  app.post("/api/client-payments", (req, res) => {
    console.log("POST /api/client-payments", req.body);
    try {
      const { project_id, bill_value, amount_received, balance } = req.body;
      const info = db.prepare("INSERT INTO client_payments (project_id, bill_value, amount_received, balance) VALUES (?, ?, ?, ?)").run(project_id, bill_value, amount_received, balance);
      res.json({ id: info.lastInsertRowid });
    } catch (e: any) {
      console.error("Error in POST /api/client-payments:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // Kharchi
  app.get("/api/kharchi", (req, res) => {
    const kharchi = db.prepare(`
      SELECT k.*, w.name as worker_name, p.name as project_name 
      FROM kharchi k 
      JOIN workers w ON k.worker_id = w.worker_id
      JOIN projects p ON k.project_id = p.id
    `).all();
    res.json(kharchi);
  });

  app.post("/api/kharchi", (req, res) => {
    console.log("POST /api/kharchi", req.body);
    try {
      const { worker_id, project_id, amount, date } = req.body;
      const info = db.prepare("INSERT INTO kharchi (worker_id, project_id, amount, date) VALUES (?, ?, ?, ?)").run(worker_id, project_id, amount, date);
      res.json({ id: info.lastInsertRowid });
    } catch (e: any) {
      console.error("Error in POST /api/kharchi:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // Advances
  app.get("/api/advances", (req, res) => {
    const advances = db.prepare(`
      SELECT a.*, w.name as worker_name, p.name as project_name 
      FROM advances a 
      JOIN workers w ON a.worker_id = w.worker_id
      JOIN projects p ON a.project_id = p.id
    `).all();
    res.json(advances);
  });

  app.post("/api/advances", (req, res) => {
    console.log("POST /api/advances", req.body);
    try {
      const { worker_id, project_id, amount, paid_by, remarks, date } = req.body;
      const info = db.prepare("INSERT INTO advances (worker_id, project_id, amount, paid_by, remarks, date) VALUES (?, ?, ?, ?, ?, ?)").run(worker_id, project_id, amount, paid_by, remarks, date);
      res.json({ id: info.lastInsertRowid });
    } catch (e: any) {
      console.error("Error in POST /api/advances:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // Worker Payments (Calculated)
  app.get("/api/worker-payments-summary", (req, res) => {
    const { project_id, month, year } = req.query;
    
    // This is a complex query that joins everything
    const workers = db.prepare(`
      SELECT w.worker_id, w.name, w.serial_no
      FROM workers w
      WHERE w.project_id = ?
    `).all(project_id);

    const summaries = workers.map((worker: any) => {
      // Get Kharchi for this worker in this month
      // Note: date format is YYYY-MM-DD
      const kharchi = db.prepare(`
        SELECT SUM(amount) as total 
        FROM kharchi 
        WHERE worker_id = ? AND strftime('%m', date) = ? AND strftime('%Y', date) = ?
      `).get(worker.worker_id, month, year) as any;

      // Get Advances for this worker
      const advances = db.prepare(`
        SELECT SUM(amount) as total 
        FROM advances 
        WHERE worker_id = ? AND project_id = ?
      `).get(worker.worker_id, project_id) as any;

      // Get Work Amount and Mess Deduction from worker_payments table
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
  });

  app.post("/api/worker-payments", (req, res) => {
    console.log("POST /api/worker-payments", req.body);
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
      console.error("Error in POST /api/worker-payments:", e);
      res.status(500).json({ error: e.message });
    }
  });

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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
