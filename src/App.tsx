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
  Info,
  Upload,
  FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';
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
    className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all duration-200 text-left ${
      active 
        ? 'bg-sap-light-blue text-sap-blue font-bold border-r-4 border-sap-blue' 
        : 'text-sap-text-secondary hover:bg-gray-50'
    }`}
  >
    <Icon size={18} className={active ? 'text-sap-blue' : 'text-sap-text-secondary'} />
    <span>{label}</span>
  </button>
);

const SectionHeader = ({ title, onAdd, onImport }: { title: string, onAdd?: () => void, onImport?: () => void }) => (
  <div className="flex items-center justify-between mb-6">
    <h1 className="text-2xl font-bold text-sap-text">{title}</h1>
    <div className="flex gap-2">
      {onImport && (
        <button onClick={onImport} className="sap-btn-secondary">
          <Upload size={18} />
          <span>Import Excel</span>
        </button>
      )}
      {onAdd && (
        <button onClick={onAdd} className="sap-btn-primary">
          <Plus size={18} />
          <span>Create New</span>
        </button>
      )}
    </div>
  </div>
);

function GenericImportModal({ 
  isOpen, 
  onClose, 
  type, 
  onRefresh, 
  notify 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  type: 'workers' | 'projects' | 'billing' | 'client-payments' | 'kharchi' | 'advances' | 'worker-payments', 
  onRefresh: () => void, 
  notify: (m: string, t?: 'success' | 'error') => void 
}) {
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setPreviewData([]);
      setImporting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        setPreviewData(data);
        notify(`Loaded ${data.length} rows from ${file.name}`);
      } catch (err) {
        notify('Failed to parse Excel file', 'error');
      }
    };
    reader.readAsBinaryString(file);
  };

  const processImport = async () => {
    if (previewData.length === 0) return;
    setImporting(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const row of previewData) {
        const endpoint = `/api/${type}`;
        
        let payload: any = {};
        if (type === 'workers') {
          payload = {
            worker_id: row.worker_id || row['Worker ID'] || row.id || '',
            name: row.name || row['Name'] || row['Worker Name'] || '',
            project_id: Number(row.project_id || row['Project ID'] || 0),
            designation: row.designation || row['Designation'] || row['Role'] || '',
            joining_date: row.joining_date || row['Joining Date'] || new Date().toISOString().slice(0, 10),
            serial_no: row.serial_no || row['Serial No'] || row['S.No'] || ''
          };
        } else if (type === 'projects') {
          payload = {
            name: row.name || row['Project Name'] || '',
            start_date: row.start_date || row['Start Date'] || new Date().toISOString().slice(0, 10),
            address: row.address || row['Address'] || row['Site Address'] || '',
            budget: Number(row.budget || row['Budget'] || 0)
          };
        } else if (type === 'billing') {
          payload = {
            sr_no: row.sr_no || row['Sr No'] || '',
            project_id: Number(row.project_id || row['Project ID'] || 0),
            bill_no: row.bill_no || row['Bill No'] || '',
            work_nature: row.work_nature || row['Work Nature'] || '',
            amount: Number(row.amount || row['Amount'] || 0),
            month: row.month || row['Month'] || '',
            certify_date: row.certify_date || row['Certify Date'] || new Date().toISOString().slice(0, 10)
          };
        } else if (type === 'client-payments') {
          payload = {
            project_id: Number(row.project_id || row['Project ID'] || 0),
            bill_value: Number(row.bill_value || row['Bill Value'] || 0),
            amount_received: Number(row.amount_received || row['Amount Received'] || 0),
            balance: Number(row.balance || row['Balance'] || 0)
          };
        } else if (type === 'kharchi') {
          payload = {
            worker_id: row.worker_id || row['Worker ID'] || '',
            project_id: Number(row.project_id || row['Project ID'] || 0),
            amount: Number(row.amount || row['Amount'] || 0),
            date: row.date || row['Date'] || new Date().toISOString().slice(0, 10)
          };
        } else if (type === 'advances') {
          payload = {
            worker_id: row.worker_id || row['Worker ID'] || '',
            project_id: Number(row.project_id || row['Project ID'] || 0),
            amount: Number(row.amount || row['Amount'] || 0),
            paid_by: row.paid_by || row['Paid By'] || '',
            remarks: row.remarks || row['Remarks'] || '',
            date: row.date || row['Date'] || new Date().toISOString().slice(0, 10)
          };
        } else if (type === 'worker-payments') {
          payload = {
            worker_id: row.worker_id || row['Worker ID'] || '',
            project_id: Number(row.project_id || row['Project ID'] || 0),
            work_amount: Number(row.work_amount || row['Work Amount'] || 0),
            mess_deduction: Number(row.mess_deduction || row['Mess Deduction'] || 0),
            month: row.month || row['Month'] || new Date().toISOString().slice(5, 7),
            year: Number(row.year || row['Year'] || new Date().getFullYear())
          };
        }

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) successCount++;
        else errorCount++;
      }

      notify(`Import complete: ${successCount} succeeded, ${errorCount} failed`);
      onRefresh();
      onClose();
    } catch (err) {
      notify('Import process failed', 'error');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="sap-card w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="sap-card-header flex justify-between items-center">
          <h3 className="sap-card-title">Import {type.replace('-', ' ')} from Excel</h3>
          <button onClick={onClose} className="text-sap-text-secondary hover:text-sap-text">✕</button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="sap-label">Select Excel File</label>
              <div className="border-2 border-dashed border-sap-border rounded-lg p-8 text-center hover:bg-sap-light-blue/30 transition-colors cursor-pointer relative">
                <input 
                  type="file" 
                  accept=".xlsx, .xls" 
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <FileSpreadsheet className="mx-auto mb-2 text-sap-text-secondary" size={48} />
                <p className="text-sm text-sap-text-secondary font-medium">Click or drag file to upload</p>
                <p className="text-[10px] text-sap-text-secondary mt-1">Supports .xlsx, .xls files</p>
              </div>
            </div>
            
            <div className="bg-sap-light-blue/20 p-4 rounded-lg">
              <h4 className="text-xs font-bold text-sap-blue uppercase tracking-wider mb-2">Expected Columns</h4>
              <p className="text-[10px] text-sap-text-secondary mb-2">The system will try to match these headers:</p>
              <div className="flex flex-wrap gap-1">
                {type === 'workers' && ['worker_id', 'name', 'project_id', 'designation', 'joining_date', 'serial_no'].map(c => <span key={c} className="px-2 py-0.5 bg-white border border-sap-border rounded text-[10px] font-mono">{c}</span>)}
                {type === 'projects' && ['name', 'start_date', 'address', 'budget'].map(c => <span key={c} className="px-2 py-0.5 bg-white border border-sap-border rounded text-[10px] font-mono">{c}</span>)}
                {type === 'billing' && ['sr_no', 'project_id', 'bill_no', 'work_nature', 'amount', 'month', 'certify_date'].map(c => <span key={c} className="px-2 py-0.5 bg-white border border-sap-border rounded text-[10px] font-mono">{c}</span>)}
                {type === 'client-payments' && ['project_id', 'bill_value', 'amount_received', 'balance'].map(c => <span key={c} className="px-2 py-0.5 bg-white border border-sap-border rounded text-[10px] font-mono">{c}</span>)}
                {type === 'kharchi' && ['worker_id', 'project_id', 'amount', 'date'].map(c => <span key={c} className="px-2 py-0.5 bg-white border border-sap-border rounded text-[10px] font-mono">{c}</span>)}
                {type === 'advances' && ['worker_id', 'project_id', 'amount', 'paid_by', 'remarks', 'date'].map(c => <span key={c} className="px-2 py-0.5 bg-white border border-sap-border rounded text-[10px] font-mono">{c}</span>)}
                {type === 'worker-payments' && ['worker_id', 'project_id', 'work_amount', 'mess_deduction', 'month', 'year'].map(c => <span key={c} className="px-2 py-0.5 bg-white border border-sap-border rounded text-[10px] font-mono">{c}</span>)}
              </div>
            </div>
          </div>

          {previewData.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold">Data Preview ({previewData.length} records)</h4>
                <button onClick={() => setPreviewData([])} className="text-xs text-red-600 font-bold hover:underline">Clear</button>
              </div>
              <div className="sap-table-container max-h-[300px]">
                <table className="sap-table">
                  <thead>
                    <tr>
                      {Object.keys(previewData[0]).map(key => (
                        <th key={key}>{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.slice(0, 5).map((row, i) => (
                      <tr key={i}>
                        {Object.values(row).map((val: any, j) => (
                          <td key={j}>{val?.toString()}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {previewData.length > 5 && <p className="text-[10px] text-sap-text-secondary text-center italic">Showing first 5 records</p>}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-sap-border bg-gray-50 flex justify-end gap-3">
          <button onClick={onClose} className="sap-btn-secondary">Cancel</button>
          <button 
            onClick={processImport} 
            disabled={previewData.length === 0 || importing}
            className="sap-btn-primary disabled:opacity-50"
          >
            {importing ? 'Importing...' : `Confirm Import (${previewData.length})`}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

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
      const endpoints = [
        { name: 'projects', url: '/api/projects' },
        { name: 'workers', url: '/api/workers' },
        { name: 'billing', url: '/api/billing' },
        { name: 'client-payments', url: '/api/client-payments' },
        { name: 'kharchi', url: '/api/kharchi' },
        { name: 'advances', url: '/api/advances' }
      ];

      const responses = await Promise.all(endpoints.map(e => fetch(e.url)));
      
      for (let i = 0; i < responses.length; i++) {
        if (!responses[i].ok) {
          const errorText = await responses[i].text().catch(() => "No error body");
          throw new Error(`API ${endpoints[i].name} failed (${responses[i].status}): ${errorText.slice(0, 50)}`);
        }
      }

      const [p, w, b, cp, k, a] = await Promise.all(responses.map(r => r.json()));

      console.log("Data fetched successfully:", { projects: p.length, workers: w.length });
      
      setProjects(p);
      setWorkers(w);
      setBilling(b);
      setClientPayments(cp);
      setKharchi(k);
      setAdvances(a);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      showNotification(`Fetch Error: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardSection projects={projects} workers={workers} billing={billing} />;
      case 'projects': return <ProjectsSection projects={projects} onRefresh={fetchData} notify={showNotification} />;
      case 'workers': return <WorkersSection workers={workers} projects={projects} onRefresh={fetchData} notify={showNotification} />;
      case 'billing': return <BillingSection billing={billing} projects={projects} onRefresh={fetchData} notify={showNotification} />;
      case 'client-payments': return <ClientPaymentsSection payments={clientPayments} projects={projects} onRefresh={fetchData} notify={showNotification} />;
      case 'kharchi': return <KharchiSection kharchi={kharchi} projects={projects} workers={workers} onRefresh={fetchData} notify={showNotification} />;
      case 'advances': return <AdvancesSection advances={advances} projects={projects} workers={workers} onRefresh={fetchData} notify={showNotification} />;
      case 'worker-payments': return <WorkerPaymentsSection projects={projects} onRefresh={fetchData} notify={showNotification} />;
      default: return <DashboardSection projects={projects} workers={workers} billing={billing} />;
    }
  };

  return (
    <div className="min-h-screen bg-sap-bg">
      {/* Shell Header */}
      <header className="sap-shell-header">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-sap-blue rounded-md flex items-center justify-center font-bold text-white">C</div>
            <span className="font-bold text-lg tracking-tight">ConstructERP</span>
          </div>
          <div className="h-6 w-px bg-white/20 hidden md:block"></div>
          <span className="text-sm font-medium text-white/80 hidden md:block">Project Management Suite</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative hidden sm:block">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
            <input 
              placeholder="Search apps, projects..." 
              className="bg-white/10 border border-white/20 rounded-md pl-10 pr-4 py-1.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:bg-white/20 w-64 transition-all" 
            />
          </div>
          <button 
            onClick={async () => {
              try {
                const res = await fetch('/api/test');
                const data = await res.json();
                showNotification(`System Status: ${data.message}`);
              } catch (e) {
                showNotification("System Offline", "error");
              }
            }}
            className="sap-btn-secondary !bg-transparent !text-white !border-white/30 hover:!bg-white/10"
          >
            Check Status
          </button>
          <div className="w-8 h-8 bg-sap-accent rounded-full flex items-center justify-center font-bold text-white text-xs">IT</div>
        </div>
      </header>

      <div className="flex">
        {/* Navigation Sidebar */}
        <aside className="sap-sidebar">
          <div className="py-4">
            <div className="px-4 mb-2">
              <span className="text-[10px] font-bold text-sap-text-secondary uppercase tracking-widest">Main Navigation</span>
            </div>
            <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
            <SidebarItem icon={Briefcase} label="Projects" active={activeTab === 'projects'} onClick={() => setActiveTab('projects')} />
            <SidebarItem icon={Users} label="Workers" active={activeTab === 'workers'} onClick={() => setActiveTab('workers')} />
            <SidebarItem icon={Receipt} label="Billing" active={activeTab === 'billing'} onClick={() => setActiveTab('billing')} />
            
            <div className="px-4 mt-6 mb-2">
              <span className="text-[10px] font-bold text-sap-text-secondary uppercase tracking-widest">Financials</span>
            </div>
            <SidebarItem icon={CreditCard} label="Client Payments" active={activeTab === 'client-payments'} onClick={() => setActiveTab('client-payments')} />
            <SidebarItem icon={Wallet} label="Kharchi" active={activeTab === 'kharchi'} onClick={() => setActiveTab('kharchi')} />
            <SidebarItem icon={HandCoins} label="Advances" active={activeTab === 'advances'} onClick={() => setActiveTab('advances')} />
            <SidebarItem icon={Banknote} label="Worker Settlements" active={activeTab === 'worker-payments'} onClick={() => setActiveTab('worker-payments')} />
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="sap-content">
          <AnimatePresence>
            {notification && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`fixed top-16 right-6 z-[100] p-4 rounded-lg shadow-lg border-l-4 ${
                  notification.type === 'success' ? 'bg-white border-green-500 text-sap-text' : 'bg-white border-red-500 text-sap-text'
                } flex items-center gap-3 min-w-[300px]`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${notification.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  <Info size={18} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm">{notification.type === 'success' ? 'Success' : 'Error'}</p>
                  <p className="text-xs text-sap-text-secondary">{notification.message}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>

          {/* Footer Info */}
          <footer className="mt-12 pt-6 border-t border-sap-border flex justify-between items-center text-xs text-sap-text-secondary">
            <div className="flex gap-6">
              <span>System: ConstructERP Production</span>
              <span>Environment: SAP S/4HANA Cloud</span>
              <span>Last Sync: {new Date().toLocaleTimeString()}</span>
            </div>
            <div>
              <span>© 2026 ConstructERP Solutions</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

// --- Sub-sections ---

function DashboardSection({ projects, workers, billing }: { projects: Project[], workers: Worker[], billing: Billing[] }) {
  const totalBilling = billing.reduce((sum, b) => sum + (b.amount || 0), 0);
  
  return (
    <div className="space-y-6">
      <SectionHeader title="Executive Overview" />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="sap-card p-6 flex items-center gap-4 hover:shadow-md transition-shadow cursor-default">
          <div className="w-12 h-12 bg-blue-50 text-sap-blue rounded-lg flex items-center justify-center">
            <Briefcase size={24} />
          </div>
          <div>
            <p className="sap-label">Active Projects</p>
            <p className="text-3xl font-bold text-sap-text">{projects.length}</p>
          </div>
        </div>
        
        <div className="sap-card p-6 flex items-center gap-4 hover:shadow-md transition-shadow cursor-default">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <p className="sap-label">Total Workforce</p>
            <p className="text-3xl font-bold text-sap-text">{workers.length}</p>
          </div>
        </div>

        <div className="sap-card p-6 flex items-center gap-4 hover:shadow-md transition-shadow cursor-default">
          <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="sap-label">Total Billing</p>
            <p className="text-3xl font-bold text-sap-text">₹{totalBilling.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="sap-card">
          <div className="sap-card-header">
            <h3 className="sap-card-title">Recent Projects</h3>
            <button className="text-sap-blue text-xs font-bold hover:underline">View All</button>
          </div>
          <div className="sap-table-container">
            <table className="sap-table">
              <thead>
                <tr>
                  <th>Project Name</th>
                  <th>Budget</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {projects.slice(0, 5).map(p => (
                  <tr key={p.id}>
                    <td className="font-bold text-sap-blue">{p.name}</td>
                    <td className="font-mono">₹{p.budget.toLocaleString()}</td>
                    <td><span className="sap-badge sap-badge-green">Active</span></td>
                  </tr>
                ))}
                {projects.length === 0 && (
                  <tr>
                    <td colSpan={3} className="text-center py-8 text-sap-text-secondary italic">No projects found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="sap-card">
          <div className="sap-card-header">
            <h3 className="sap-card-title">System Health</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded border border-sap-border">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-sm font-medium">Database Connection</span>
              </div>
              <span className="sap-badge sap-badge-green">Stable</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded border border-sap-border">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-sm font-medium">API Gateway</span>
              </div>
              <span className="sap-badge sap-badge-green">Online</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded border border-sap-border">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-sm font-medium">Storage Service</span>
              </div>
              <span className="sap-badge sap-badge-blue">92% Free</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded border border-sap-border">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-sap-blue"></div>
                <span className="text-sm font-medium">Last Backup</span>
              </div>
              <span className="text-xs text-sap-text-secondary">Today, 04:00 AM</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProjectsSection({ projects, onRefresh, notify }: { projects: Project[], onRefresh: () => void, notify: (m: string, t?: 'success' | 'error') => void }) {
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [formData, setFormData] = useState({ name: '', start_date: '', address: '', budget: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        const text = await response.text();
        let errorMessage = 'Failed to save project';
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = text.slice(0, 100) || `Server error (${response.status})`;
        }
        throw new Error(errorMessage);
      }

      notify('Project saved successfully!');
      setShowForm(false);
      onRefresh();
    } catch (error: any) {
      notify(`Error: ${error.message}`, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader 
        title="Project Portfolio" 
        onAdd={() => setShowForm(true)} 
        onImport={() => setShowImport(true)}
      />
      
      <GenericImportModal 
        isOpen={showImport} 
        onClose={() => setShowImport(false)} 
        type="projects" 
        onRefresh={onRefresh} 
        notify={notify} 
      />
      
      {showForm && (
        <div className="sap-card p-6 bg-gray-50/30">
          <h3 className="text-lg font-bold mb-4 text-sap-blue">Create New Project</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="sap-label">Project Name</label>
              <input className="sap-input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Skyline Residency" />
            </div>
            <div>
              <label className="sap-label">Start Date</label>
              <input type="date" className="sap-input" required value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} />
            </div>
            <div className="md:col-span-2">
              <label className="sap-label">Site Address</label>
              <input className="sap-input" required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Full physical address" />
            </div>
            <div>
              <label className="sap-label">Total Budget (INR)</label>
              <input type="number" className="sap-input" required value={formData.budget} onChange={e => setFormData({...formData, budget: e.target.value})} placeholder="0.00" />
            </div>
            <div className="flex items-end gap-2">
              <button type="submit" className="sap-btn-primary flex-1">Save Project</button>
              <button type="button" onClick={() => setShowForm(false)} className="sap-btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 sap-card">
          <div className="sap-card-header">
            <h3 className="sap-card-title">Active Projects</h3>
          </div>
          <div className="sap-table-container">
            <table className="sap-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Project Name</th>
                  <th>Start Date</th>
                  <th>Budget</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {projects.map(p => (
                  <tr key={p.id}>
                    <td className="text-sap-text-secondary">#{p.id}</td>
                    <td className="font-bold text-sap-blue">{p.name}</td>
                    <td>{new Date(p.start_date).toLocaleDateString()}</td>
                    <td className="font-mono">₹{p.budget?.toLocaleString()}</td>
                    <td><span className="sap-badge sap-badge-green">On Track</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="sap-card p-6 bg-sap-blue text-white flex flex-col justify-between">
          <div>
            <h3 className="text-white/70 text-xs font-bold uppercase tracking-widest mb-4">Portfolio Summary</h3>
            <div className="space-y-6">
              <div>
                <p className="text-white/60 text-xs uppercase">Total Investment</p>
                <p className="text-3xl font-bold">₹{projects.reduce((sum, p) => sum + (p.budget || 0), 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-white/60 text-xs uppercase">Project Count</p>
                <p className="text-3xl font-bold">{projects.length}</p>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-xs text-white/50 italic">All financial data is synchronized with the central ledger.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function WorkersSection({ workers, projects, onRefresh, notify }: { workers: Worker[], projects: Project[], onRefresh: () => void, notify: (m: string, t?: 'success' | 'error') => void }) {
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
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
        const text = await response.text();
        let errorMessage = 'Failed to register worker';
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = text.slice(0, 100) || `Server error (${response.status})`;
        }
        throw new Error(errorMessage);
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
    <div className="space-y-6">
      <SectionHeader 
        title="Workforce Management" 
        onAdd={() => setShowForm(true)} 
        onImport={() => setShowImport(true)}
      />

      <GenericImportModal 
        isOpen={showImport} 
        onClose={() => setShowImport(false)} 
        type="workers" 
        onRefresh={onRefresh} 
        notify={notify} 
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {projects.map(p => (
          <div key={p.id} className="sap-card p-4 flex items-center justify-between">
            <div>
              <p className="sap-label">{p.name}</p>
              <p className="text-2xl font-bold text-sap-blue">{getWorkerCountByProject(p.id)}</p>
              <p className="text-[10px] text-sap-text-secondary uppercase">Personnel</p>
            </div>
            <div className="w-10 h-10 bg-sap-light-blue rounded-full flex items-center justify-center text-sap-blue">
              <Users size={20} />
            </div>
          </div>
        ))}
      </div>

      <div className="sap-card">
        <div className="sap-card-header">
          <h3 className="sap-card-title">Employee Registry</h3>
        </div>
        
        {showForm && (
          <div className="p-6 bg-gray-50/50 border-b border-sap-border">
            <h3 className="text-lg font-bold mb-4 text-sap-blue">Register New Personnel</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="sap-label">Worker ID</label>
                <input className="sap-input" required value={formData.worker_id} onChange={e => setFormData({...formData, worker_id: e.target.value})} placeholder="e.g. EMP001" />
              </div>
              <div>
                <label className="sap-label">Full Name</label>
                <input className="sap-input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Legal Name" />
              </div>
              <div>
                <label className="sap-label">Assign Project</label>
                <select className="sap-input" required value={formData.project_id} onChange={e => setFormData({...formData, project_id: e.target.value})}>
                  <option value="">Select Project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="sap-label">Designation</label>
                <input className="sap-input" required value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} placeholder="Role" />
              </div>
              <div>
                <label className="sap-label">Joining Date</label>
                <input type="date" className="sap-input" required value={formData.joining_date} onChange={e => setFormData({...formData, joining_date: e.target.value})} />
              </div>
              <div>
                <label className="sap-label">Serial Number</label>
                <input className="sap-input" required value={formData.serial_no} onChange={e => setFormData({...formData, serial_no: e.target.value})} placeholder="Internal S.No" />
              </div>
              <div className="md:col-span-3 flex gap-2">
                <button type="submit" className="sap-btn-primary flex-1">Confirm Registration</button>
                <button type="button" onClick={() => setShowForm(false)} className="sap-btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div className="sap-table-container">
          <table className="sap-table">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Worker ID</th>
                <th>Name</th>
                <th>Project Assignment</th>
                <th>Designation</th>
                <th>Joining Date</th>
              </tr>
            </thead>
            <tbody>
              {workers.map(w => (
                <tr key={w.id}>
                  <td className="text-sap-text-secondary">{w.serial_no}</td>
                  <td className="font-mono font-bold text-sap-blue">{w.worker_id}</td>
                  <td className="font-medium">{w.name}</td>
                  <td><span className="sap-badge sap-badge-blue">{w.project_name}</span></td>
                  <td>{w.designation}</td>
                  <td>{new Date(w.joining_date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function BillingSection({ billing, projects, onRefresh, notify }: { billing: Billing[], projects: Project[], onRefresh: () => void, notify: (m: string, t?: 'success' | 'error') => void }) {
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
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
        const text = await response.text();
        let errorMessage = 'Failed to save bill';
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = text.slice(0, 100) || `Server error (${response.status})`;
        }
        throw new Error(errorMessage);
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
    <div className="space-y-6">
      <SectionHeader 
        title="Billing & Invoicing" 
        onAdd={() => setShowForm(true)} 
        onImport={() => setShowImport(true)}
      />

      <GenericImportModal 
        isOpen={showImport} 
        onClose={() => setShowImport(false)} 
        type="billing" 
        onRefresh={onRefresh} 
        notify={notify} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="sap-card p-6 bg-sap-blue text-white flex justify-between items-center">
          <div>
            <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Total Billing Value</p>
            <p className="text-3xl font-bold mt-1">₹{totalBilling.toLocaleString()}</p>
            <p className="text-[10px] text-white/40 mt-2">Cumulative across all active sites</p>
          </div>
          <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
            <Receipt size={28} className="text-white/80" />
          </div>
        </div>

        <div className="lg:col-span-2 sap-card">
          <div className="sap-card-header">
            <h3 className="sap-card-title">Monthly Revenue Summary</h3>
          </div>
          <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(monthlySummary).sort().reverse().slice(0, 4).map(([m, val]: [any, any]) => (
              <div key={m} className="p-3 bg-gray-50 rounded border border-sap-border">
                <p className="text-[10px] font-bold text-sap-text-secondary uppercase">{m}</p>
                <p className="text-lg font-bold text-sap-blue">₹{val.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="sap-card">
        <div className="sap-card-header">
          <h3 className="sap-card-title">Billing Ledger</h3>
        </div>

        {showForm && (
          <div className="p-6 bg-gray-50/50 border-b border-sap-border">
            <h3 className="text-lg font-bold mb-4 text-sap-blue">Record New Invoice</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="sap-label">SR No</label>
                <input className="sap-input" required value={formData.sr_no} onChange={e => setFormData({...formData, sr_no: e.target.value})} />
              </div>
              <div>
                <label className="sap-label">Project</label>
                <select className="sap-input" required value={formData.project_id} onChange={e => setFormData({...formData, project_id: e.target.value})}>
                  <option value="">Select Project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="sap-label">Bill Number</label>
                <input className="sap-input" required value={formData.bill_no} onChange={e => setFormData({...formData, bill_no: e.target.value})} />
              </div>
              <div>
                <label className="sap-label">Nature of Work</label>
                <input className="sap-input" required value={formData.work_nature} onChange={e => setFormData({...formData, work_nature: e.target.value})} />
              </div>
              <div>
                <label className="sap-label">Amount (INR)</label>
                <input type="number" className="sap-input" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
              </div>
              <div>
                <label className="sap-label">Billing Month</label>
                <input type="month" className="sap-input" required value={formData.month} onChange={e => setFormData({...formData, month: e.target.value})} />
              </div>
              <div>
                <label className="sap-label">Certification Date</label>
                <input type="date" className="sap-input" required value={formData.certify_date} onChange={e => setFormData({...formData, certify_date: e.target.value})} />
              </div>
              <div className="flex items-end gap-2">
                <button type="submit" className="sap-btn-primary flex-1">Save Invoice</button>
                <button type="button" onClick={() => setShowForm(false)} className="sap-btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div className="sap-table-container">
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
                  <td className="text-sap-text-secondary">{b.sr_no}</td>
                  <td className="font-bold text-sap-blue">{b.project_name}</td>
                  <td>{b.bill_no}</td>
                  <td>{b.work_nature}</td>
                  <td className="font-mono font-bold">₹{b.amount.toLocaleString()}</td>
                  <td><span className="sap-badge sap-badge-blue">{b.month}</span></td>
                  <td>{new Date(b.certify_date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ClientPaymentsSection({ payments, projects, onRefresh, notify }: { payments: ClientPayment[], projects: Project[], onRefresh: () => void, notify: (m: string, t?: 'success' | 'error') => void }) {
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
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
        const text = await response.text();
        let errorMessage = 'Failed to record payment';
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = text.slice(0, 100) || `Server error (${response.status})`;
        }
        throw new Error(errorMessage);
      }

      notify('Payment recorded successfully!');
      setShowForm(false);
      onRefresh();
    } catch (error: any) {
      notify(`Error: ${error.message}`, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader 
        title="Financial Settlement" 
        onAdd={() => setShowForm(true)} 
        onImport={() => setShowImport(true)}
      />

      <GenericImportModal 
        isOpen={showImport} 
        onClose={() => setShowImport(false)} 
        type="client-payments" 
        onRefresh={onRefresh} 
        notify={notify} 
      />

      {showForm && (
        <div className="sap-card p-6 bg-gray-50/50">
          <h3 className="text-lg font-bold mb-4 text-sap-blue">Record Client Payment</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="sap-label">Project</label>
              <select className="sap-input" required value={formData.project_id} onChange={e => setFormData({...formData, project_id: e.target.value})}>
                <option value="">Select Project</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="sap-label">Total Bill Value</label>
              <input type="number" className="sap-input" required value={formData.bill_value} onChange={e => setFormData({...formData, bill_value: e.target.value})} />
            </div>
            <div>
              <label className="sap-label">Amount Received</label>
              <input type="number" className="sap-input" required value={formData.amount_received} onChange={e => setFormData({...formData, amount_received: e.target.value})} />
            </div>
            <div className="md:col-span-3 flex gap-2">
              <button type="submit" className="sap-btn-primary flex-1">Record Payment</button>
              <button type="button" onClick={() => setShowForm(false)} className="sap-btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="sap-card">
        <div className="sap-card-header">
          <h3 className="sap-card-title">Payment Ledger</h3>
        </div>
        <div className="sap-table-container">
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
                  <td className="font-bold text-sap-blue">{p.project_name}</td>
                  <td className="font-mono">₹{p.bill_value.toLocaleString()}</td>
                  <td className="font-mono text-green-700 font-bold">₹{p.amount_received.toLocaleString()}</td>
                  <td className="font-mono text-red-700 font-bold">
                    <div className="flex items-center gap-2">
                      ₹{p.balance.toLocaleString()}
                      {p.balance > 0 && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KharchiSection({ kharchi, projects, workers, onRefresh, notify }: { kharchi: Kharchi[], projects: Project[], workers: Worker[], onRefresh: () => void, notify: (m: string, t?: 'success' | 'error') => void }) {
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
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
        const text = await response.text();
        let errorMessage = 'Failed to save entry';
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = text.slice(0, 100) || `Server error (${response.status})`;
        }
        throw new Error(errorMessage);
      }

      notify('Kharchi entry saved!');
      setShowForm(false);
      onRefresh();
    } catch (error: any) {
      notify(`Error: ${error.message}`, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader 
        title="Pocket Money Tracking" 
        onImport={() => setShowImport(true)}
      />
      
      <GenericImportModal 
        isOpen={showImport} 
        onClose={() => setShowImport(false)} 
        type="kharchi" 
        onRefresh={onRefresh} 
        notify={notify} 
      />
      
      <div className="sap-card p-6">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="sap-label">Target Project Filter</label>
            <select className="sap-input" value={selectedProject} onChange={e => setSelectedProject(e.target.value)}>
              <option value="">All Projects</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <button 
            disabled={!selectedProject}
            onClick={() => setShowForm(true)} 
            className="sap-btn-primary disabled:opacity-50 h-[36px]"
          >
            Add Sunday Entry
          </button>
        </div>
      </div>

      {showForm && (
        <div className="sap-card p-6 bg-gray-50/50">
          <h3 className="text-lg font-bold mb-4 text-sap-blue">New Kharchi Entry</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="sap-label">Worker</label>
              <select className="sap-input" required value={formData.worker_id} onChange={e => setFormData({...formData, worker_id: e.target.value})}>
                <option value="">Select Worker</option>
                {filteredWorkers.map(w => <option key={w.worker_id} value={w.worker_id}>{w.name} ({w.worker_id})</option>)}
              </select>
            </div>
            <div>
              <label className="sap-label">Amount (INR)</label>
              <input type="number" className="sap-input" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
            </div>
            <div>
              <label className="sap-label">Sunday Date</label>
              <input type="date" className="sap-input" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
            </div>
            <div className="md:col-span-3 flex gap-2">
              <button type="submit" className="sap-btn-primary flex-1">Save Entry</button>
              <button type="button" onClick={() => setShowForm(false)} className="sap-btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="sap-card">
        <div className="sap-card-header">
          <h3 className="sap-card-title">Kharchi History</h3>
        </div>
        <div className="sap-table-container">
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
                  <td>{new Date(k.date).toLocaleDateString()}</td>
                  <td className="font-mono font-bold text-sap-blue">{k.worker_id}</td>
                  <td className="font-medium">{k.worker_name}</td>
                  <td><span className="sap-badge sap-badge-blue">{k.project_name}</span></td>
                  <td className="font-mono font-bold">₹{k.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AdvancesSection({ advances, projects, workers, onRefresh, notify }: { advances: Advance[], projects: Project[], workers: Worker[], onRefresh: () => void, notify: (m: string, t?: 'success' | 'error') => void }) {
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
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
        const text = await response.text();
        let errorMessage = 'Failed to save advance';
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = text.slice(0, 100) || `Server error (${response.status})`;
        }
        throw new Error(errorMessage);
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
    <div className="space-y-6">
      <SectionHeader 
        title="Advance Administration" 
        onImport={() => setShowImport(true)}
      />
      
      <GenericImportModal 
        isOpen={showImport} 
        onClose={() => setShowImport(false)} 
        type="advances" 
        onRefresh={onRefresh} 
        notify={notify} 
      />
      
      <div className="sap-card p-6">
        <div className="flex flex-col md:flex-row justify-between items-end gap-4">
          <div className="flex-1 w-full">
            <label className="sap-label">Project Filter</label>
            <select className="sap-input" value={selectedProject} onChange={e => setSelectedProject(e.target.value)}>
              <option value="">All Projects</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="text-right bg-sap-blue/5 p-3 rounded border border-sap-blue/10 min-w-[200px]">
            <p className="text-[10px] font-bold uppercase text-sap-text-secondary">Project Advance Total</p>
            <p className="text-2xl font-bold text-sap-blue">₹{totalAdvance.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="flex justify-start">
        <button 
          disabled={!selectedProject}
          onClick={() => setShowForm(true)} 
          className="sap-btn-primary disabled:opacity-50"
        >
          Record New Advance
        </button>
      </div>

      {showForm && (
        <div className="sap-card p-6 bg-gray-50/50">
          <h3 className="text-lg font-bold mb-4 text-sap-blue">New Advance Entry</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="sap-label">Worker</label>
              <select className="sap-input" required value={formData.worker_id} onChange={e => setFormData({...formData, worker_id: e.target.value})}>
                <option value="">Select Worker</option>
                {filteredWorkers.map(w => <option key={w.worker_id} value={w.worker_id}>{w.name} ({w.worker_id})</option>)}
              </select>
            </div>
            <div>
              <label className="sap-label">Amount (INR)</label>
              <input type="number" className="sap-input" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
            </div>
            <div>
              <label className="sap-label">Date</label>
              <input type="date" className="sap-input" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
            </div>
            <div>
              <label className="sap-label">Paid By</label>
              <input className="sap-input" required value={formData.paid_by} onChange={e => setFormData({...formData, paid_by: e.target.value})} placeholder="Payer Name" />
            </div>
            <div className="md:col-span-2">
              <label className="sap-label">Remarks</label>
              <input className="sap-input" value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} placeholder="Optional notes" />
            </div>
            <div className="md:col-span-3 flex gap-2">
              <button type="submit" className="sap-btn-primary flex-1">Save Advance</button>
              <button type="button" onClick={() => setShowForm(false)} className="sap-btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="sap-card">
        <div className="sap-card-header">
          <h3 className="sap-card-title">Advance Ledger</h3>
        </div>
        <div className="sap-table-container">
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
                  <td>{new Date(a.date).toLocaleDateString()}</td>
                  <td className="font-mono font-bold text-sap-blue">{a.worker_id}</td>
                  <td className="font-medium">{a.worker_name}</td>
                  <td className="font-mono font-bold">₹{a.amount.toLocaleString()}</td>
                  <td>{a.paid_by}</td>
                  <td className="text-xs italic text-sap-text-secondary">{a.remarks || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function WorkerPaymentsSection({ projects, onRefresh, notify }: { projects: Project[], onRefresh: () => void, notify: (m: string, t?: 'success' | 'error') => void }) {
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [showImport, setShowImport] = useState(false);
  const [month, setMonth] = useState<string>(new Date().toISOString().slice(5, 7));
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [summaries, setSummaries] = useState<WorkerPaymentSummary[]>([]);
  const [editingWorker, setEditingWorker] = useState<string | null>(null);
  const [editData, setEditData] = useState({ work_amount: '', mess_deduction: '' });

  const fetchSummaries = async () => {
    if (!selectedProject) return;
    try {
      const res = await fetch(`/api/worker-payments-summary?project_id=${selectedProject}&month=${month}&year=${year}`);
      if (!res.ok) throw new Error("Failed to fetch summaries");
      setSummaries(await res.json());
    } catch (e) {
      console.error("Error fetching summaries:", e);
      notify("Failed to load payment summaries", "error");
    }
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
        const text = await response.text();
        let errorMessage = 'Failed to save payment';
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = text.slice(0, 100) || `Server error (${response.status})`;
        }
        throw new Error(errorMessage);
      }

      notify('Payment settlement saved!');
      setEditingWorker(null);
      fetchSummaries();
    } catch (error: any) {
      notify(`Error: ${error.message}`, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader 
        title="Payment Settlement Console" 
        onImport={() => setShowImport(true)}
      />

      <GenericImportModal 
        isOpen={showImport} 
        onClose={() => setShowImport(false)} 
        type="worker-payments" 
        onRefresh={() => {
          onRefresh();
          fetchSummaries();
        }} 
        notify={notify} 
      />
      
      <div className="sap-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="sap-label">Project</label>
            <select className="sap-input" value={selectedProject} onChange={e => setSelectedProject(e.target.value)}>
              <option value="">Select Project</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="sap-label">Month</label>
            <select className="sap-input" value={month} onChange={e => setMonth(e.target.value)}>
              {['01','02','03','04','05','06','07','08','09','10','11','12'].map(m => (
                <option key={m} value={m}>{new Date(2000, Number(m)-1).toLocaleString('default', { month: 'long' })}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="sap-label">Year</label>
            <input type="number" className="sap-input" value={year} onChange={e => setYear(e.target.value)} />
          </div>
        </div>
      </div>

      {!selectedProject ? (
        <div className="sap-card p-12 text-center text-sap-text-secondary">
          <Info size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-sm">Please select a project to view payment settlements</p>
        </div>
      ) : (
        <div className="sap-card">
          <div className="sap-card-header">
            <h3 className="sap-card-title">Settlement Worksheet</h3>
          </div>
          <div className="sap-table-container">
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
                    <td className="text-sap-text-secondary">{s.serial_no}</td>
                    <td className="font-mono font-bold text-sap-blue">{s.worker_id}</td>
                    <td className="font-medium">{s.name}</td>
                    <td>
                      {editingWorker === s.worker_id ? (
                        <input 
                          type="number" 
                          className="sap-input w-24" 
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
                          className="sap-input w-24" 
                          value={editData.mess_deduction} 
                          onChange={e => setEditData({...editData, mess_deduction: e.target.value})} 
                        />
                      ) : (
                        <span className="font-mono">₹{s.mess_deduction.toLocaleString()}</span>
                      )}
                    </td>
                    <td className="text-orange-700 font-mono font-bold">₹{s.kharchi_deduction.toLocaleString()}</td>
                    <td className="text-red-700 font-mono font-bold">₹{s.advance_deduction.toLocaleString()}</td>
                    <td className="font-bold text-sap-blue font-mono">₹{s.final_payment.toLocaleString()}</td>
                    <td>
                      {editingWorker === s.worker_id ? (
                        <div className="flex gap-2">
                          <button onClick={() => handleSavePayment(s.worker_id)} className="text-green-600 font-bold hover:underline text-xs">Save</button>
                          <button onClick={() => setEditingWorker(null)} className="text-sap-text-secondary hover:underline text-xs">Cancel</button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => {
                            setEditingWorker(s.worker_id);
                            setEditData({ work_amount: s.work_amount.toString(), mess_deduction: s.mess_deduction.toString() });
                          }} 
                          className="sap-btn-secondary !py-1 !px-3 !text-xs"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
