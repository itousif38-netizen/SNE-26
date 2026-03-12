import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Receipt, 
  CreditCard, 
  Wallet, 
  HandCoins, 
  Banknote,
  Plus,
  Search,
  ChevronRight,
  Calendar,
  MapPin,
  DollarSign,
  Briefcase,
  User,
  Hash,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---

interface Project {
  id: number;
  name: string;
  start_date: string;
  address: string;
  budget: number;
}

interface Worker {
  id: number;
  worker_id: string;
  name: string;
  project_id: number;
  project_name?: string;
  designation: string;
  joining_date: string;
  serial_no: string;
}

interface Billing {
  id: number;
  sr_no: string;
  project_id: number;
  project_name?: string;
  bill_no: string;
  work_nature: string;
  amount: number;
  month: string;
  certify_date: string;
}

interface ClientPayment {
  id: number;
  project_id: number;
  project_name?: string;
  bill_value: number;
  amount_received: number;
  balance: number;
}

interface Kharchi {
  id: number;
  worker_id: string;
  worker_name?: string;
  project_id: number;
  project_name?: string;
  amount: number;
  date: string;
}

interface Advance {
  id: number;
  worker_id: string;
  worker_name?: string;
  project_id: number;
  project_name?: string;
  amount: number;
  paid_by: string;
  remarks: string;
  date: string;
}

interface WorkerPaymentSummary {
  worker_id: string;
  name: string;
  serial_no: string;
  work_amount: number;
  mess_deduction: number;
  kharchi_deduction: number;
  advance_deduction: number;
  final_payment: number;
}

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-2 px-2 py-1 text-[11px] transition-colors text-left ${
      active 
        ? 'bg-sap-light-blue text-sap-blue font-semibold' 
        : 'text-gray-700 hover:bg-gray-200'
    }`}
  >
    <Icon size={14} className="text-gray-500" />
    <span>{label}</span>
  </button>
);

const SectionHeader = ({ title, onAdd }: { title: string, onAdd?: () => void }) => (
  <div className="sap-toolbar justify-between">
    <div className="flex items-center gap-2">
      <ChevronRight size={14} className="text-gray-400" />
      <span className="font-bold text-gray-700 uppercase text-[10px] tracking-wider">{title}</span>
    </div>
    {onAdd && (
      <button onClick={onAdd} className="sap-btn-secondary flex items-center gap-1">
        <Plus size={12} />
        <span>New</span>
      </button>
    )}
  </div>
);

export default function App() {
  const [activeTab, setActiveTab] = useState('projects');
  const [projects, setProjects] = useState<Project[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [billing, setBilling] = useState<Billing[]>([]);
  const [clientPayments, setClientPayments] = useState<ClientPayment[]>([]);
  const [kharchi, setKharchi] = useState<Kharchi[]>([]);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    console.log("Fetching data from server...");
    setLoading(true);
    try {
      const [pRes, wRes, bRes, cpRes, kRes, aRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/workers'),
        fetch('/api/billing'),
        fetch('/api/client-payments'),
        fetch('/api/kharchi'),
        fetch('/api/advances')
      ]);
      
      if (!pRes.ok || !wRes.ok || !bRes.ok || !cpRes.ok || !kRes.ok || !aRes.ok) {
        throw new Error("One or more API calls failed");
      }

      const p = await pRes.json();
      const w = await wRes.json();
      const b = await bRes.json();
      const cp = await cpRes.json();
      const k = await kRes.json();
      const a = await aRes.json();

      console.log("Data fetched successfully:", { projects: p.length, workers: w.length });
      
      setProjects(p);
      setWorkers(w);
      setBilling(b);
      setClientPayments(cp);
      setKharchi(k);
      setAdvances(a);
    } catch (error) {
      console.error("Error fetching data:", error);
      showNotification("Failed to fetch data from server", "error");
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'projects': return <ProjectsSection projects={projects} onRefresh={fetchData} notify={showNotification} />;
      case 'workers': return <WorkersSection workers={workers} projects={projects} onRefresh={fetchData} notify={showNotification} />;
      case 'billing': return <BillingSection billing={billing} projects={projects} onRefresh={fetchData} notify={showNotification} />;
      case 'client-payments': return <ClientPaymentsSection payments={clientPayments} projects={projects} onRefresh={fetchData} notify={showNotification} />;
      case 'kharchi': return <KharchiSection kharchi={kharchi} projects={projects} workers={workers} onRefresh={fetchData} notify={showNotification} />;
      case 'advances': return <AdvancesSection advances={advances} projects={projects} workers={workers} onRefresh={fetchData} notify={showNotification} />;
      case 'worker-payments': return <WorkerPaymentsSection projects={projects} onRefresh={fetchData} notify={showNotification} />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-sap-gray overflow-hidden">
      {/* Top Menu Bar */}
      <header className="bg-sap-header-bg border-b border-sap-border px-2 py-1 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-bold text-sap-blue text-[11px]">ConstructERP - SAP HANA Studio</span>
          <nav className="flex gap-3 text-[10px] text-gray-600">
            <span className="cursor-pointer hover:text-black">File</span>
            <span className="cursor-pointer hover:text-black">Edit</span>
            <span className="cursor-pointer hover:text-black">Navigate</span>
            <span className="cursor-pointer hover:text-black">Project</span>
            <span className="cursor-pointer hover:text-black">Window</span>
            <span className="cursor-pointer hover:text-black">Help</span>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={async () => {
              try {
                const res = await fetch('/api/test');
                const data = await res.json();
                showNotification(`Connection OK: ${data.message}`);
              } catch (e) {
                showNotification("Connection Failed", "error");
              }
            }}
            className="text-[10px] bg-sap-blue text-white px-2 py-0.5 rounded hover:bg-opacity-80"
          >
            Test Connection
          </button>
          <div className="bg-white border border-sap-border px-2 py-0.5 flex items-center gap-2">
            <Search size={12} className="text-gray-400" />
            <input placeholder="Quick Access" className="outline-none text-[10px] w-32" />
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="sap-toolbar">
        <button className="p-1 hover:bg-gray-200 rounded"><Plus size={14} /></button>
        <button className="p-1 hover:bg-gray-200 rounded text-sap-blue"><LayoutDashboard size={14} /></button>
        <div className="w-px h-4 bg-sap-border mx-1"></div>
        <button className="p-1 hover:bg-gray-200 rounded"><Search size={14} /></button>
        <button onClick={fetchData} className="p-1 hover:bg-gray-200 rounded"><ChevronRight size={14} className="rotate-90" /></button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Systems View (Sidebar) */}
        <aside className="w-60 bg-white border-r border-sap-border flex flex-col">
          <div className="bg-sap-toolbar-bg border-b border-sap-border px-2 py-1 flex items-center justify-between">
            <span className="font-bold text-[10px] text-gray-600">Systems</span>
            <div className="flex gap-1">
              <button className="p-0.5 hover:bg-gray-200"><Plus size={10} /></button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto py-1">
            <div className="px-2 py-1 flex items-center gap-1 text-[11px] font-bold text-gray-700">
              <ChevronRight size={12} className="rotate-90" />
              <span>ConstructERP (SYSTEM)</span>
            </div>
            <div className="pl-4">
              <SidebarItem icon={Briefcase} label="Projects" active={activeTab === 'projects'} onClick={() => setActiveTab('projects')} />
              <SidebarItem icon={Users} label="Workers Management" active={activeTab === 'workers'} onClick={() => setActiveTab('workers')} />
              <SidebarItem icon={Receipt} label="Billing Management" active={activeTab === 'billing'} onClick={() => setActiveTab('billing')} />
              <SidebarItem icon={CreditCard} label="Client Payment" active={activeTab === 'client-payments'} onClick={() => setActiveTab('client-payments')} />
              <SidebarItem icon={Wallet} label="Kharchi" active={activeTab === 'kharchi'} onClick={() => setActiveTab('kharchi')} />
              <SidebarItem icon={HandCoins} label="Advance" active={activeTab === 'advances'} onClick={() => setActiveTab('advances')} />
              <SidebarItem icon={Banknote} label="Workers Payment" active={activeTab === 'worker-payments'} onClick={() => setActiveTab('worker-payments')} />
            </div>
          </div>
        </aside>

        {/* Editor Area (Main Content) */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="bg-sap-header-bg border-b border-sap-border flex">
            <div className={`sap-tab ${activeTab === 'projects' ? 'sap-tab-active' : ''}`} onClick={() => setActiveTab('projects')}>Overview</div>
            <div className="sap-tab">Landscape</div>
            <div className="sap-tab">Alerts</div>
            <div className="sap-tab">Performance</div>
            <div className="sap-tab">Configuration</div>
          </div>
          
      <main className="flex-1 overflow-y-auto p-4 bg-white relative">
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className={`fixed top-10 left-1/2 -translate-x-1/2 z-[9999] p-4 rounded-lg shadow-2xl border-2 ${
                notification.type === 'success' ? 'bg-green-100 border-green-500 text-green-900' : 'bg-red-100 border-red-500 text-red-900'
              } text-[13px] font-bold flex items-center gap-3 min-w-[300px] justify-center`}
            >
              <Info size={18} />
              {notification.message}
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </main>

          {/* Bottom Panel (Other Views) */}
          <div className="h-40 bg-white border-t border-sap-border flex flex-col">
            <div className="bg-sap-toolbar-bg border-b border-sap-border px-2 py-1 flex items-center gap-4">
              <span className="text-[10px] font-bold border-b-2 border-sap-blue pb-1">Properties</span>
              <span className="text-[10px] font-bold text-gray-500 pb-1">Error Log</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              <table className="sap-table">
                <thead>
                  <tr>
                    <th>Message</th>
                    <th>Plug-in</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="flex items-center gap-1"><Info size={10} className="text-blue-500" /> System connected successfully</td>
                    <td>org.construct.erp</td>
                    <td>{new Date().toLocaleString()}</td>
                  </tr>
                  {activeTab === 'projects' && (
                    <tr>
                      <td className="flex items-center gap-1"><Info size={10} className="text-blue-500" /> Loaded {projects.length} projects</td>
                      <td>org.construct.erp.projects</td>
                      <td>{new Date().toLocaleString()}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Sub-sections ---

function ProjectsSection({ projects, onRefresh, notify }: { projects: Project[], onRefresh: () => void, notify: (m: string, t?: 'success' | 'error') => void }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', start_date: '', address: '', budget: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting project:", formData);
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          budget: Number(formData.budget)
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save project');
      }

      notify('Project saved successfully!');
      setShowForm(false);
      onRefresh();
    } catch (error: any) {
      console.error("Project save error:", error);
      notify(`Error: ${error.message}`, 'error');
    }
  };

  return (
    <div className="sap-panel p-4">
      <SectionHeader title="General Information" onAdd={() => setShowForm(true)} />
      
      {showForm && (
        <div className="mb-4 p-3 bg-sap-toolbar-bg border border-sap-border">
          <h3 className="font-bold mb-2 text-sap-blue text-[11px]">Add New Project</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-600 mb-1 block">Project Name</label>
              <input className="sap-input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-600 mb-1 block">Start Date</label>
              <input type="date" className="sap-input" required value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] font-bold text-gray-600 mb-1 block">Address</label>
              <input className="sap-input" required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-600 mb-1 block">Budget</label>
              <input type="number" className="sap-input" required value={formData.budget} onChange={e => setFormData({...formData, budget: e.target.value})} />
            </div>
            <div className="flex items-end">
              <button type="submit" className="sap-btn-primary w-full">Save Project</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-2 gap-8 mb-6">
        <div className="space-y-4">
          <h4 className="text-[10px] font-bold text-gray-500 border-b border-sap-border pb-1">Operational Status</h4>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-[11px]">All projects active</span>
          </div>
          <div className="text-[11px] text-gray-600">
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span>Total Projects:</span>
              <span className="font-bold">{projects.length}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span>Total Budget:</span>
              <span className="font-bold">₹{projects.reduce((sum, p) => sum + p.budget, 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <h4 className="text-[10px] font-bold text-gray-500 border-b border-sap-border pb-1">Budget Allocation</h4>
          {projects.slice(0, 3).map(p => (
            <div key={p.id} className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span>{p.name}</span>
                <span>₹{p.budget.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 h-2">
                <div className="bg-sap-blue h-full" style={{ width: `${Math.min(100, (p.budget / 1000000) * 100)}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <table className="sap-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Project Name</th>
            <th>Start Date</th>
            <th>Address</th>
            <th>Budget</th>
          </tr>
        </thead>
        <tbody>
          {projects.map(p => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td className="font-semibold text-sap-blue">{p.name}</td>
              <td>{p.start_date}</td>
              <td>{p.address}</td>
              <td className="font-mono">₹{p.budget?.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WorkersSection({ workers, projects, onRefresh, notify }: { workers: Worker[], projects: Project[], onRefresh: () => void, notify: (m: string, t?: 'success' | 'error') => void }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ worker_id: '', name: '', project_id: '', designation: '', joining_date: '', serial_no: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to register worker');
      }

      notify('Worker registered successfully!');
      setShowForm(false);
      onRefresh();
    } catch (error: any) {
      notify(`Error: ${error.message}`, 'error');
    }
  };

  const getWorkerCountByProject = (projectId: number) => {
    return workers.filter(w => w.project_id === projectId).length;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2">
        {projects.map(p => (
          <div key={p.id} className="sap-panel p-2 flex items-center justify-between">
            <div>
              <p className="text-[9px] font-bold uppercase text-gray-500">{p.name}</p>
              <p className="text-lg font-black text-sap-blue">{getWorkerCountByProject(p.id)}</p>
            </div>
            <Users className="text-sap-light-blue opacity-50" size={24} />
          </div>
        ))}
      </div>

      <div className="sap-panel p-4">
        <SectionHeader title="Worker Administration" onAdd={() => setShowForm(true)} />

        {showForm && (
          <div className="mb-4 p-3 bg-sap-toolbar-bg border border-sap-border">
            <h3 className="font-bold mb-2 text-sap-blue text-[11px]">Register New Worker</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-bold text-gray-600 mb-1 block">Worker ID</label>
                <input className="sap-input" required value={formData.worker_id} onChange={e => setFormData({...formData, worker_id: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-600 mb-1 block">Name</label>
                <input className="sap-input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-600 mb-1 block">Project</label>
                <select className="sap-input" required value={formData.project_id} onChange={e => setFormData({...formData, project_id: e.target.value})}>
                  <option value="">Select Project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-600 mb-1 block">Designation</label>
                <input className="sap-input" required value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-600 mb-1 block">Joining Date</label>
                <input type="date" className="sap-input" required value={formData.joining_date} onChange={e => setFormData({...formData, joining_date: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-600 mb-1 block">Serial No</label>
                <input className="sap-input" required value={formData.serial_no} onChange={e => setFormData({...formData, serial_no: e.target.value})} />
              </div>
              <div className="col-span-3">
                <button type="submit" className="sap-btn-primary w-full">Register Worker</button>
              </div>
            </form>
          </div>
        )}

        <table className="sap-table">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Worker ID</th>
              <th>Name</th>
              <th>Project</th>
              <th>Designation</th>
              <th>Joining Date</th>
            </tr>
          </thead>
          <tbody>
            {workers.map(w => (
              <tr key={w.id}>
                <td>{w.serial_no}</td>
                <td className="font-mono text-sap-blue">{w.worker_id}</td>
                <td className="font-semibold">{w.name}</td>
                <td>{w.project_name}</td>
                <td>{w.designation}</td>
                <td>{w.joining_date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BillingSection({ billing, projects, onRefresh, notify }: { billing: Billing[], projects: Project[], onRefresh: () => void, notify: (m: string, t?: 'success' | 'error') => void }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ sr_no: '', project_id: '', bill_no: '', work_nature: '', amount: '', month: '', certify_date: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: Number(formData.amount)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save bill');
      }

      notify('Bill saved successfully!');
      setShowForm(false);
      onRefresh();
    } catch (error: any) {
      notify(`Error: ${error.message}`, 'error');
    }
  };

  const totalBilling = billing.reduce((sum, b) => sum + b.amount, 0);

  const monthlySummary = billing.reduce((acc: any, b) => {
    const month = b.month;
    if (!acc[month]) acc[month] = 0;
    acc[month] += b.amount;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="sap-panel p-4 bg-sap-blue text-white flex justify-between items-center">
          <div>
            <p className="text-[10px] font-bold uppercase opacity-70">Total Billing Value (All Sites)</p>
            <p className="text-2xl font-black">₹{totalBilling.toLocaleString()}</p>
          </div>
          <Receipt size={32} className="opacity-20" />
        </div>

        <div className="sap-panel p-4 overflow-y-auto max-h-24">
          <h4 className="text-[9px] font-bold uppercase text-gray-500 mb-1">Monthly Summary</h4>
          <div className="space-y-1">
            {Object.entries(monthlySummary).sort().map(([m, val]: [any, any]) => (
              <div key={m} className="flex justify-between text-[10px] border-b border-gray-100 pb-0.5">
                <span className="font-semibold">{m}</span>
                <span className="font-mono">₹{val.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="sap-panel p-4">
        <SectionHeader title="Billing Administration" onAdd={() => setShowForm(true)} />

        {showForm && (
          <div className="mb-4 p-3 bg-sap-toolbar-bg border border-sap-border">
            <h3 className="font-bold mb-2 text-sap-blue text-[11px]">Enter New Bill</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] font-bold text-gray-600 mb-1 block">SR No</label>
                <input className="sap-input" required value={formData.sr_no} onChange={e => setFormData({...formData, sr_no: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-600 mb-1 block">Project</label>
                <select className="sap-input" required value={formData.project_id} onChange={e => setFormData({...formData, project_id: e.target.value})}>
                  <option value="">Select Project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-600 mb-1 block">Bill No</label>
                <input className="sap-input" required value={formData.bill_no} onChange={e => setFormData({...formData, bill_no: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-600 mb-1 block">Work Nature</label>
                <input className="sap-input" required value={formData.work_nature} onChange={e => setFormData({...formData, work_nature: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-600 mb-1 block">Amount</label>
                <input type="number" className="sap-input" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-600 mb-1 block">Billing Month</label>
                <input type="month" className="sap-input" required value={formData.month} onChange={e => setFormData({...formData, month: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-600 mb-1 block">Certify Date</label>
                <input type="date" className="sap-input" required value={formData.certify_date} onChange={e => setFormData({...formData, certify_date: e.target.value})} />
              </div>
              <div className="flex items-end">
                <button type="submit" className="sap-btn-primary w-full">Save Bill</button>
              </div>
            </form>
          </div>
        )}

        <table className="sap-table">
          <thead>
            <tr>
              <th>SR No</th>
              <th>Project</th>
              <th>Bill No</th>
              <th>Nature</th>
              <th>Amount</th>
              <th>Month</th>
              <th>Certify Date</th>
            </tr>
          </thead>
          <tbody>
            {billing.map(b => (
              <tr key={b.id}>
                <td>{b.sr_no}</td>
                <td className="font-semibold">{b.project_name}</td>
                <td>{b.bill_no}</td>
                <td>{b.work_nature}</td>
                <td className="font-mono">₹{b.amount.toLocaleString()}</td>
                <td>{b.month}</td>
                <td>{b.certify_date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ClientPaymentsSection({ payments, projects, onRefresh, notify }: { payments: ClientPayment[], projects: Project[], onRefresh: () => void, notify: (m: string, t?: 'success' | 'error') => void }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ project_id: '', bill_value: '', amount_received: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const balance = Number(formData.bill_value) - Number(formData.amount_received);
      const response = await fetch('/api/client-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...formData, 
          bill_value: Number(formData.bill_value),
          amount_received: Number(formData.amount_received),
          balance 
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to record payment');
      }

      notify('Payment recorded successfully!');
      setShowForm(false);
      onRefresh();
    } catch (error: any) {
      notify(`Error: ${error.message}`, 'error');
    }
  };

  return (
    <div className="sap-panel p-4">
      <SectionHeader title="Financial Settlement" onAdd={() => setShowForm(true)} />

      {showForm && (
        <div className="mb-4 p-3 bg-sap-toolbar-bg border border-sap-border">
          <h3 className="font-bold mb-2 text-sap-blue text-[11px]">Record Client Payment</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-600 mb-1 block">Project</label>
              <select className="sap-input" required value={formData.project_id} onChange={e => setFormData({...formData, project_id: e.target.value})}>
                <option value="">Select Project</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-600 mb-1 block">Total Bill Value</label>
              <input type="number" className="sap-input" required value={formData.bill_value} onChange={e => setFormData({...formData, bill_value: e.target.value})} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-600 mb-1 block">Amount Received</label>
              <input type="number" className="sap-input" required value={formData.amount_received} onChange={e => setFormData({...formData, amount_received: e.target.value})} />
            </div>
            <div className="col-span-3">
              <button type="submit" className="sap-btn-primary w-full">Record Payment</button>
            </div>
          </form>
        </div>
      )}

      <table className="sap-table">
        <thead>
          <tr>
            <th>Project</th>
            <th>Total Bill Value</th>
            <th>Amount Received</th>
            <th>Balance Outstanding</th>
          </tr>
        </thead>
        <tbody>
          {payments.map(p => (
            <tr key={p.id}>
              <td className="font-semibold">{p.project_name}</td>
              <td className="font-mono">₹{p.bill_value.toLocaleString()}</td>
              <td className="font-mono text-green-700">₹{p.amount_received.toLocaleString()}</td>
              <td className="font-mono text-red-700 font-bold">₹{p.balance.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function KharchiSection({ kharchi, projects, workers, onRefresh, notify }: { kharchi: Kharchi[], projects: Project[], workers: Worker[], onRefresh: () => void, notify: (m: string, t?: 'success' | 'error') => void }) {
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ worker_id: '', amount: '', date: '' });

  const filteredWorkers = workers.filter(w => !selectedProject || w.project_id === Number(selectedProject));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/kharchi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...formData, 
          amount: Number(formData.amount),
          project_id: Number(selectedProject) 
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save entry');
      }

      notify('Kharchi entry saved!');
      setShowForm(false);
      onRefresh();
    } catch (error: any) {
      notify(`Error: ${error.message}`, 'error');
    }
  };

  return (
    <div className="sap-panel p-4">
      <SectionHeader title="Pocket Money Tracking" />
      
      <div className="mb-4 flex gap-3 items-end">
        <div className="w-48">
          <label className="text-[10px] font-bold text-gray-600 mb-1 block">Target Project</label>
          <select className="sap-input" value={selectedProject} onChange={e => setSelectedProject(e.target.value)}>
            <option value="">All Projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <button 
          disabled={!selectedProject}
          onClick={() => setShowForm(true)} 
          className="sap-btn-primary disabled:opacity-50"
        >
          Add Sunday Entry
        </button>
      </div>

      {showForm && (
        <div className="mb-4 p-3 bg-sap-toolbar-bg border border-sap-border">
          <h3 className="font-bold mb-2 text-sap-blue text-[11px]">New Kharchi Entry</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-600 mb-1 block">Worker</label>
              <select className="sap-input" required value={formData.worker_id} onChange={e => setFormData({...formData, worker_id: e.target.value})}>
                <option value="">Select Worker</option>
                {filteredWorkers.map(w => <option key={w.worker_id} value={w.worker_id}>{w.name} ({w.worker_id})</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-600 mb-1 block">Amount</label>
              <input type="number" className="sap-input" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-600 mb-1 block">Sunday Date</label>
              <input type="date" className="sap-input" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
            </div>
            <div className="col-span-3">
              <button type="submit" className="sap-btn-primary w-full">Save Entry</button>
            </div>
          </form>
        </div>
      )}

      <table className="sap-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>ID No</th>
            <th>Worker Name</th>
            <th>Project</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {kharchi.filter(k => !selectedProject || k.project_id === Number(selectedProject)).map(k => (
            <tr key={k.id}>
              <td>{k.date}</td>
              <td className="font-mono">{k.worker_id}</td>
              <td className="font-semibold">{k.worker_name}</td>
              <td>{k.project_name}</td>
              <td className="font-mono">₹{k.amount.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AdvancesSection({ advances, projects, workers, onRefresh, notify }: { advances: Advance[], projects: Project[], workers: Worker[], onRefresh: () => void, notify: (m: string, t?: 'success' | 'error') => void }) {
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ worker_id: '', amount: '', paid_by: '', remarks: '', date: '' });

  const filteredWorkers = workers.filter(w => !selectedProject || w.project_id === Number(selectedProject));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/advances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...formData, 
          amount: Number(formData.amount),
          project_id: Number(selectedProject) 
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save advance');
      }

      notify('Advance recorded successfully!');
      setShowForm(false);
      onRefresh();
    } catch (error: any) {
      notify(`Error: ${error.message}`, 'error');
    }
  };

  const totalAdvance = advances
    .filter(a => !selectedProject || a.project_id === Number(selectedProject))
    .reduce((sum, a) => sum + a.amount, 0);

  return (
    <div className="sap-panel p-4">
      <SectionHeader title="Advance Administration" />
      
      <div className="mb-4 flex justify-between items-end">
        <div className="w-48">
          <label className="text-[10px] font-bold text-gray-600 mb-1 block">Target Project</label>
          <select className="sap-input" value={selectedProject} onChange={e => setSelectedProject(e.target.value)}>
            <option value="">All Projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-bold uppercase text-gray-500">Project Advance Total</p>
          <p className="text-lg font-black text-sap-blue">₹{totalAdvance.toLocaleString()}</p>
        </div>
      </div>

      <button 
        disabled={!selectedProject}
        onClick={() => setShowForm(true)} 
        className="sap-btn-primary mb-4 disabled:opacity-50"
      >
        Record New Advance
      </button>

      {showForm && (
        <div className="mb-4 p-3 bg-sap-toolbar-bg border border-sap-border">
          <h3 className="font-bold mb-2 text-sap-blue text-[11px]">New Advance Entry</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-600 mb-1 block">Worker</label>
              <select className="sap-input" required value={formData.worker_id} onChange={e => setFormData({...formData, worker_id: e.target.value})}>
                <option value="">Select Worker</option>
                {filteredWorkers.map(w => <option key={w.worker_id} value={w.worker_id}>{w.name} ({w.worker_id})</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-600 mb-1 block">Amount</label>
              <input type="number" className="sap-input" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-600 mb-1 block">Date</label>
              <input type="date" className="sap-input" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-600 mb-1 block">Paid By</label>
              <input className="sap-input" required value={formData.paid_by} onChange={e => setFormData({...formData, paid_by: e.target.value})} />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] font-bold text-gray-600 mb-1 block">Remarks</label>
              <input className="sap-input" value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} />
            </div>
            <div className="col-span-3">
              <button type="submit" className="sap-btn-primary w-full">Save Advance</button>
            </div>
          </form>
        </div>
      )}

      <table className="sap-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>ID No</th>
            <th>Worker Name</th>
            <th>Amount</th>
            <th>Paid By</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody>
          {advances.filter(a => !selectedProject || a.project_id === Number(selectedProject)).map(a => (
            <tr key={a.id}>
              <td>{a.date}</td>
              <td className="font-mono">{a.worker_id}</td>
              <td className="font-semibold">{a.worker_name}</td>
              <td className="font-mono">₹{a.amount.toLocaleString()}</td>
              <td>{a.paid_by}</td>
              <td className="text-[10px] italic">{a.remarks}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WorkerPaymentsSection({ projects, onRefresh, notify }: { projects: Project[], onRefresh: () => void, notify: (m: string, t?: 'success' | 'error') => void }) {
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [month, setMonth] = useState<string>(new Date().toISOString().slice(5, 7));
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [summaries, setSummaries] = useState<WorkerPaymentSummary[]>([]);
  const [editingWorker, setEditingWorker] = useState<string | null>(null);
  const [editData, setEditData] = useState({ work_amount: '', mess_deduction: '' });

  const fetchSummaries = async () => {
    if (!selectedProject) return;
    const res = await fetch(`/api/worker-payments-summary?project_id=${selectedProject}&month=${month}&year=${year}`);
    setSummaries(await res.json());
  };

  useEffect(() => {
    fetchSummaries();
  }, [selectedProject, month, year]);

  const handleSavePayment = async (workerId: string) => {
    try {
      const response = await fetch('/api/worker-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          worker_id: workerId,
          project_id: Number(selectedProject),
          work_amount: Number(editData.work_amount),
          mess_deduction: Number(editData.mess_deduction),
          month,
          year: Number(year)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save payment');
      }

      notify('Payment settlement saved!');
      setEditingWorker(null);
      fetchSummaries();
    } catch (error: any) {
      notify(`Error: ${error.message}`, 'error');
    }
  };

  return (
    <div className="sap-panel p-4">
      <SectionHeader title="Payment Settlement Console" />
      
      <div className="mb-4 grid grid-cols-3 gap-3 items-end">
        <div>
          <label className="text-[10px] font-bold text-gray-600 mb-1 block">Project</label>
          <select className="sap-input" value={selectedProject} onChange={e => setSelectedProject(e.target.value)}>
            <option value="">Select Project</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-600 mb-1 block">Month</label>
          <select className="sap-input" value={month} onChange={e => setMonth(e.target.value)}>
            {['01','02','03','04','05','06','07','08','09','10','11','12'].map(m => (
              <option key={m} value={m}>{new Date(2000, Number(m)-1).toLocaleString('default', { month: 'long' })}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-600 mb-1 block">Year</label>
          <input type="number" className="sap-input" value={year} onChange={e => setYear(e.target.value)} />
        </div>
      </div>

      {!selectedProject ? (
        <div className="text-center py-10 text-gray-400">
          <Info size={32} className="mx-auto mb-2 opacity-20" />
          <p className="text-[11px]">Please select a project to view payment settlements</p>
        </div>
      ) : (
        <table className="sap-table">
          <thead>
            <tr>
              <th>SR NO</th>
              <th>ID NO</th>
              <th>Worker Name</th>
              <th>Work Amount</th>
              <th>Mess Ded.</th>
              <th>Kharchi Ded.</th>
              <th>Advance Ded.</th>
              <th>Final Payment</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {summaries.map(s => (
              <tr key={s.worker_id}>
                <td>{s.serial_no}</td>
                <td className="font-mono">{s.worker_id}</td>
                <td className="font-semibold">{s.name}</td>
                <td>
                  {editingWorker === s.worker_id ? (
                    <input 
                      type="number" 
                      className="sap-input w-20" 
                      value={editData.work_amount} 
                      onChange={e => setEditData({...editData, work_amount: e.target.value})} 
                    />
                  ) : (
                    <span className="font-mono">₹{s.work_amount.toLocaleString()}</span>
                  )}
                </td>
                <td>
                  {editingWorker === s.worker_id ? (
                    <input 
                      type="number" 
                      className="sap-input w-20" 
                      value={editData.mess_deduction} 
                      onChange={e => setEditData({...editData, mess_deduction: e.target.value})} 
                    />
                  ) : (
                    <span className="font-mono">₹{s.mess_deduction.toLocaleString()}</span>
                  )}
                </td>
                <td className="text-orange-700 font-mono">₹{s.kharchi_deduction.toLocaleString()}</td>
                <td className="text-red-700 font-mono">₹{s.advance_deduction.toLocaleString()}</td>
                <td className="font-bold text-sap-blue font-mono">₹{s.final_payment.toLocaleString()}</td>
                <td>
                  {editingWorker === s.worker_id ? (
                    <button onClick={() => handleSavePayment(s.worker_id)} className="text-green-700 font-bold hover:underline">Save</button>
                  ) : (
                    <button 
                      onClick={() => {
                        setEditingWorker(s.worker_id);
                        setEditData({ work_amount: s.work_amount.toString(), mess_deduction: s.mess_deduction.toString() });
                      }} 
                      className="text-sap-blue hover:underline"
                    >
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
