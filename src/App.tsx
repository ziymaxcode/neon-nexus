import React, { useState, useEffect } from 'react';
import { 
  Monitor, Gamepad2, Receipt, Coffee, Users, History, 
  Play, Square, Plus, Trash2, Edit, Printer, CheckCircle, 
  Clock, DollarSign, Activity, Zap
} from 'lucide-react';

// --- Types ---
type StationType = 'PC' | 'PS5' | 'Xbox';
type StationStatus = 'Available' | 'Occupied' | 'Reserved';

interface Station {
  id: string;
  name: string;
  type: StationType;
  status: StationStatus;
  ratePerHour: number;
}

interface Session {
  id: string;
  stationId: string;
  customerName: string;
  memberId?: string;
  startTime: number;
  ratePerHour: number;
}

interface Snack {
  id: string;
  name: string;
  price: number;
  category: string;
  emoji: string;
}

interface Member {
  id: string;
  name: string;
  phone: string;
  email: string;
  plan: 'Basic' | 'Silver' | 'Gold';
  joinDate: string;
  expiryDate: string;
  totalVisits: number;
  status: 'Active' | 'Expired';
}

interface BillItem {
  snackId: string;
  name: string;
  quantity: number;
  price: number;
}

interface Bill {
  id: string;
  sessionId?: string;
  customerName: string;
  memberId?: string;
  stationName?: string;
  durationMinutes?: number;
  gamingCharge: number;
  snacks: BillItem[];
  status: 'Pending' | 'Paid';
  createdAt: number;
}

interface Transaction {
  id: string;
  date: number;
  customerName: string;
  stationName: string;
  durationMinutes: number;
  gamingTotal: number;
  snacksTotal: number;
  discount: number;
  grandTotal: number;
  paymentMethod: string;
}

// --- Seed Data ---
const initialStations: Station[] = [
  ...Array.from({ length: 10 }, (_, i) => ({ id: `PC-${i+1}`, name: `PC-${(i+1).toString().padStart(2, '0')}`, type: 'PC' as StationType, status: 'Available' as StationStatus, ratePerHour: 80 })),
  ...Array.from({ length: 3 }, (_, i) => ({ id: `PS5-${i+1}`, name: `PS5-0${i+1}`, type: 'PS5' as StationType, status: 'Available' as StationStatus, ratePerHour: 150 })),
  ...Array.from({ length: 2 }, (_, i) => ({ id: `XBX-${i+1}`, name: `Xbox-0${i+1}`, type: 'Xbox' as StationType, status: 'Available' as StationStatus, ratePerHour: 120 })),
];

const initialSnacks: Snack[] = [
  { id: 's1', name: 'Burger', price: 99, category: 'Food', emoji: '🍔' },
  { id: 's2', name: 'Fries', price: 69, category: 'Food', emoji: '🍟' },
  { id: 's3', name: 'Sandwich', price: 89, category: 'Food', emoji: '🥪' },
  { id: 's4', name: 'Cold Coffee', price: 120, category: 'Beverage', emoji: '🥤' },
  { id: 's5', name: 'Energy Drink', price: 110, category: 'Beverage', emoji: '⚡' },
  { id: 's6', name: 'Chips', price: 40, category: 'Snacks', emoji: '🥔' },
  { id: 's7', name: 'Maggi', price: 60, category: 'Food', emoji: '🍜' },
  { id: 's8', name: 'Pizza Slice', price: 150, category: 'Food', emoji: '🍕' },
];

const initialMembers: Member[] = [];

const initialTransactions: Transaction[] = [];

// --- Helper Functions ---
const loadState = <T,>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (e) {
    console.error(`Failed to load ${key} from localStorage`, e);
    return fallback;
  }
};

const formatTime = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const calculateCost = (startTime: number, ratePerHour: number) => {
  const hours = (Date.now() - startTime) / (1000 * 60 * 60);
  return Math.max(10, Math.ceil(hours * ratePerHour)); // Min 10 charge
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stations, setStations] = useState<Station[]>(() => loadState('neon_nexus_stations_v2', initialStations));
  const [sessions, setSessions] = useState<Session[]>(() => loadState('neon_nexus_sessions_v2', []));
  const [snacks, setSnacks] = useState<Snack[]>(() => loadState('neon_nexus_snacks_v2', initialSnacks));
  const [members, setMembers] = useState<Member[]>(() => loadState('neon_nexus_members_v2', initialMembers));
  const [bills, setBills] = useState<Bill[]>(() => loadState('neon_nexus_bills_v2', []));
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadState('neon_nexus_transactions_v2', initialTransactions));
  const [now, setNow] = useState(Date.now());

  // Save state to localStorage whenever it changes
  useEffect(() => { localStorage.setItem('neon_nexus_stations_v2', JSON.stringify(stations)); }, [stations]);
  useEffect(() => { localStorage.setItem('neon_nexus_sessions_v2', JSON.stringify(sessions)); }, [sessions]);
  useEffect(() => { localStorage.setItem('neon_nexus_snacks_v2', JSON.stringify(snacks)); }, [snacks]);
  useEffect(() => { localStorage.setItem('neon_nexus_members_v2', JSON.stringify(members)); }, [members]);
  useEffect(() => { localStorage.setItem('neon_nexus_bills_v2', JSON.stringify(bills)); }, [bills]);
  useEffect(() => { localStorage.setItem('neon_nexus_transactions_v2', JSON.stringify(transactions)); }, [transactions]);

  // Modals state
  const [isStartSessionModalOpen, setIsStartSessionModalOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [sessionForm, setSessionForm] = useState({ customerName: '', memberId: '', ratePerHour: 80 });

  const [isAddSnackModalOpen, setIsAddSnackModalOpen] = useState(false);
  const [selectedSnack, setSelectedSnack] = useState<Snack | null>(null);
  const [snackForm, setSnackForm] = useState({ billId: '', quantity: 1 });

  const [isNewMemberModalOpen, setIsNewMemberModalOpen] = useState(false);
  const [memberForm, setMemberForm] = useState({ name: '', phone: '', email: '', plan: 'Basic' as 'Basic'|'Silver'|'Gold' });

  const [isPayBillModalOpen, setIsPayBillModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('UPI');

  const [isAddStationModalOpen, setIsAddStationModalOpen] = useState(false);
  const [stationForm, setStationForm] = useState({ name: '', type: 'PC' as StationType, ratePerHour: 80 });
  const [editingStationId, setEditingStationId] = useState<string | null>(null);

  const [isAddNewSnackModalOpen, setIsAddNewSnackModalOpen] = useState(false);
  const [newSnackForm, setNewSnackForm] = useState({ name: '', price: 50, emoji: '🥤', category: 'Beverage' });
  const [editingSnackId, setEditingSnackId] = useState<string | null>(null);

  // Live timer update
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // --- Actions ---
  const handleAddStation = () => {
    if (!stationForm.name) return;
    
    if (editingStationId) {
      setStations(stations.map(s => s.id === editingStationId ? {
        ...s,
        name: stationForm.name,
        type: stationForm.type,
        ratePerHour: stationForm.ratePerHour
      } : s));
    } else {
      const newStation: Station = {
        id: `st_${Date.now()}`,
        name: stationForm.name,
        type: stationForm.type,
        status: 'Available',
        ratePerHour: stationForm.ratePerHour
      };
      setStations([...stations, newStation]);
    }
    
    setIsAddStationModalOpen(false);
    setEditingStationId(null);
    setStationForm({ name: '', type: 'PC', ratePerHour: 80 });
  };

  const handleEditStationClick = (station: Station, e: React.MouseEvent) => {
    e.stopPropagation();
    setStationForm({ name: station.name, type: station.type, ratePerHour: station.ratePerHour });
    setEditingStationId(station.id);
    setIsAddStationModalOpen(true);
  };

  const handleRemoveStation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setStations(stations.filter(s => s.id !== id));
  };

  const handleAddNewSnack = () => {
    if (!newSnackForm.name) return;
    
    if (editingSnackId) {
      setSnacks(snacks.map(s => s.id === editingSnackId ? {
        ...s,
        name: newSnackForm.name,
        price: newSnackForm.price,
        category: newSnackForm.category,
        emoji: newSnackForm.emoji
      } : s));
    } else {
      const newSnack: Snack = {
        id: `snk_${Date.now()}`,
        name: newSnackForm.name,
        price: newSnackForm.price,
        category: newSnackForm.category,
        emoji: newSnackForm.emoji
      };
      setSnacks([...snacks, newSnack]);
    }
    
    setIsAddNewSnackModalOpen(false);
    setEditingSnackId(null);
    setNewSnackForm({ name: '', price: 50, emoji: '🥤', category: 'Beverage' });
  };

  const handleEditSnackClick = (snack: Snack, e: React.MouseEvent) => {
    e.stopPropagation();
    setNewSnackForm({ name: snack.name, price: snack.price, emoji: snack.emoji, category: snack.category });
    setEditingSnackId(snack.id);
    setIsAddNewSnackModalOpen(true);
  };

  const handleRemoveSnack = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSnacks(snacks.filter(s => s.id !== id));
  };

  const handleStartSession = () => {
    if (!selectedStation) return;
    const newSession: Session = {
      id: `sess_${Date.now()}`,
      stationId: selectedStation.id,
      customerName: sessionForm.customerName || 'Guest',
      memberId: sessionForm.memberId || undefined,
      startTime: Date.now(),
      ratePerHour: sessionForm.ratePerHour,
    };
    setSessions([...sessions, newSession]);
    setStations(stations.map(s => s.id === selectedStation.id ? { ...s, status: 'Occupied' } : s));
    setIsStartSessionModalOpen(false);
  };

  const handleEndSession = (session: Session) => {
    const station = stations.find(s => s.id === session.stationId);
    const cost = calculateCost(session.startTime, session.ratePerHour);
    const durationMinutes = Math.ceil((Date.now() - session.startTime) / (1000 * 60));
    
    // Check if there's an existing pending bill for this session/customer
    let existingBill = bills.find(b => b.sessionId === session.id && b.status === 'Pending');
    
    if (existingBill) {
      setBills(bills.map(b => b.id === existingBill!.id ? { 
        ...b, 
        gamingCharge: cost, 
        durationMinutes,
        stationName: station?.name 
      } : b));
    } else {
      const newBill: Bill = {
        id: `bill_${Date.now()}`,
        sessionId: session.id,
        customerName: session.customerName,
        memberId: session.memberId,
        stationName: station?.name,
        durationMinutes,
        gamingCharge: cost,
        snacks: [],
        status: 'Pending',
        createdAt: Date.now()
      };
      setBills([...bills, newBill]);
    }

    setSessions(sessions.filter(s => s.id !== session.id));
    setStations(stations.map(s => s.id === session.stationId ? { ...s, status: 'Available' } : s));
    setActiveTab('billing');
  };

  const handleAddSnackToBill = () => {
    if (!selectedSnack || !snackForm.billId) return;
    
    let targetBill = bills.find(b => b.id === snackForm.billId);
    
    // If "new_bill" selected, create a standalone snacks bill
    if (snackForm.billId === 'new_bill') {
      const newBill: Bill = {
        id: `bill_${Date.now()}`,
        customerName: 'Walk-in Customer',
        gamingCharge: 0,
        snacks: [{ snackId: selectedSnack.id, name: selectedSnack.name, quantity: snackForm.quantity, price: selectedSnack.price }],
        status: 'Pending',
        createdAt: Date.now()
      };
      setBills([...bills, newBill]);
    } else if (targetBill) {
      const existingSnackIndex = targetBill.snacks.findIndex(s => s.snackId === selectedSnack.id);
      let newSnacks = [...targetBill.snacks];
      if (existingSnackIndex >= 0) {
        newSnacks[existingSnackIndex].quantity += snackForm.quantity;
      } else {
        newSnacks.push({ snackId: selectedSnack.id, name: selectedSnack.name, quantity: snackForm.quantity, price: selectedSnack.price });
      }
      setBills(bills.map(b => b.id === targetBill!.id ? { ...b, snacks: newSnacks } : b));
    }
    
    setIsAddSnackModalOpen(false);
  };

  const handleAddMember = () => {
    const newMember: Member = {
      id: `m_${Date.now()}`,
      ...memberForm,
      joinDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      totalVisits: 0,
      status: 'Active'
    };
    setMembers([...members, newMember]);
    setIsNewMemberModalOpen(false);
  };

  const handlePayBill = () => {
    if (!selectedBill) return;
    
    const snacksTotal = selectedBill.snacks.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let discount = 0;
    
    if (selectedBill.memberId) {
      const member = members.find(m => m.id === selectedBill.memberId);
      if (member && member.status === 'Active') {
        if (member.plan === 'Basic') discount = selectedBill.gamingCharge * 0.10;
        if (member.plan === 'Silver') discount = selectedBill.gamingCharge * 0.20;
        if (member.plan === 'Gold') discount = selectedBill.gamingCharge * 0.30;
      }
    }
    
    const subtotal = selectedBill.gamingCharge + snacksTotal - discount;
    const tax = subtotal * 0.05;
    const grandTotal = subtotal + tax;

    const newTx: Transaction = {
      id: `tx_${Date.now()}`,
      date: Date.now(),
      customerName: selectedBill.customerName,
      stationName: selectedBill.stationName || 'N/A',
      durationMinutes: selectedBill.durationMinutes || 0,
      gamingTotal: selectedBill.gamingCharge,
      snacksTotal,
      discount,
      grandTotal,
      paymentMethod
    };

    setTransactions([newTx, ...transactions]);
    setBills(bills.filter(b => b.id !== selectedBill.id));
    
    if (selectedBill.memberId) {
      setMembers(members.map(m => m.id === selectedBill.memberId ? { ...m, totalVisits: m.totalVisits + 1 } : m));
    }
    
    setIsPayBillModalOpen(false);
  };

  const printBill = (bill: Bill) => {
    const snacksTotal = bill.snacks.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let discount = 0;
    if (bill.memberId) {
      const member = members.find(m => m.id === bill.memberId);
      if (member && member.status === 'Active') {
        if (member.plan === 'Basic') discount = bill.gamingCharge * 0.10;
        if (member.plan === 'Silver') discount = bill.gamingCharge * 0.20;
        if (member.plan === 'Gold') discount = bill.gamingCharge * 0.30;
      }
    }
    const subtotal = bill.gamingCharge + snacksTotal - discount;
    const tax = subtotal * 0.05;
    const grandTotal = subtotal + tax;

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>Bill - Neon Nexus</title>
          <style>
            body { font-family: monospace; padding: 20px; color: #000; background: #fff; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
            .title { font-size: 24px; font-weight: bold; margin: 0; }
            .subtitle { font-size: 12px; margin: 5px 0; }
            .row { display: flex; justify-content: space-between; margin: 5px 0; }
            .divider { border-top: 1px dashed #000; margin: 10px 0; }
            table { width: 100%; text-align: left; border-collapse: collapse; margin-top: 10px; }
            th, td { padding: 5px 0; }
            th { border-bottom: 1px solid #000; }
            .text-right { text-align: right; }
            .total-row { font-weight: bold; font-size: 16px; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">NEON NEXUS</h1>
            <p class="subtitle">Gaming Cafe & Lounge</p>
            <p class="subtitle">Date: ${new Date().toLocaleString()}</p>
          </div>
          
          <div class="row"><span>Customer:</span> <span>${bill.customerName}</span></div>
          ${bill.stationName ? `<div class="row"><span>Station:</span> <span>${bill.stationName} (${bill.durationMinutes} mins)</span></div>` : ''}
          
          <div class="divider"></div>
          
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Price</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${bill.gamingCharge > 0 ? `
              <tr>
                <td>Gaming Charge</td>
                <td class="text-right">-</td>
                <td class="text-right">-</td>
                <td class="text-right">₹${bill.gamingCharge.toFixed(2)}</td>
              </tr>` : ''}
              ${bill.snacks.map(s => `
              <tr>
                <td>${s.name}</td>
                <td class="text-right">${s.quantity}</td>
                <td class="text-right">₹${s.price}</td>
                <td class="text-right">₹${(s.price * s.quantity).toFixed(2)}</td>
              </tr>`).join('')}
            </tbody>
          </table>
          
          <div class="divider"></div>
          
          <div class="row"><span>Subtotal:</span> <span>₹${(bill.gamingCharge + snacksTotal).toFixed(2)}</span></div>
          ${discount > 0 ? `<div class="row"><span>Member Discount:</span> <span>-₹${discount.toFixed(2)}</span></div>` : ''}
          <div class="row"><span>GST (5%):</span> <span>₹${tax.toFixed(2)}</span></div>
          
          <div class="divider"></div>
          
          <div class="row total-row"><span>GRAND TOTAL:</span> <span>₹${grandTotal.toFixed(2)}</span></div>
          
          <div class="footer">
            <p>Thank you for playing!</p>
            <p>See you in the cyber grid.</p>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  // --- Renderers ---
  const renderDashboard = () => {
    const todayRevenue = transactions
      .filter(t => new Date(t.date).toDateString() === new Date().toDateString())
      .reduce((sum, t) => sum + t.grandTotal, 0);

    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-orbitron neon-text-cyan mb-6">SYSTEM DASHBOARD</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[var(--color-cyber-card)] border border-[var(--color-cyber-cyan)] p-6 rounded-lg neon-border-cyan">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm uppercase tracking-wider">Active Sessions</p>
                <h3 className="text-4xl font-orbitron text-white mt-2">{sessions.length}</h3>
              </div>
              <Activity className="w-12 h-12 text-[var(--color-cyber-cyan)] opacity-80" />
            </div>
          </div>
          
          <div className="bg-[var(--color-cyber-card)] border border-[var(--color-cyber-magenta)] p-6 rounded-lg neon-border-magenta">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm uppercase tracking-wider">Today's Revenue</p>
                <h3 className="text-4xl font-orbitron text-white mt-2">₹{todayRevenue.toFixed(0)}</h3>
              </div>
              <DollarSign className="w-12 h-12 text-[var(--color-cyber-magenta)] opacity-80" />
            </div>
          </div>
          
          <div className="bg-[var(--color-cyber-card)] border border-[var(--color-cyber-amber)] p-6 rounded-lg neon-border-amber">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm uppercase tracking-wider">Active Members</p>
                <h3 className="text-4xl font-orbitron text-white mt-2">{members.filter(m => m.status === 'Active').length}</h3>
              </div>
              <Users className="w-12 h-12 text-[var(--color-cyber-amber)] opacity-80" />
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-xl font-orbitron text-[var(--color-cyber-cyan)] mb-4">RECENT ACTIVITY</h3>
          <div className="bg-[var(--color-cyber-card)] border border-gray-800 rounded-lg overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-900/50 text-gray-400 text-sm uppercase">
                <tr>
                  <th className="p-4">Time</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Station</th>
                  <th className="p-4">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {transactions.slice(0, 5).map(tx => (
                  <tr key={tx.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="p-4">{new Date(tx.date).toLocaleTimeString()}</td>
                    <td className="p-4">{tx.customerName}</td>
                    <td className="p-4">{tx.stationName}</td>
                    <td className="p-4 text-[var(--color-cyber-cyan)]">₹{tx.grandTotal.toFixed(2)}</td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr><td colSpan={4} className="p-4 text-center text-gray-500">No recent activity</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderSessions = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-orbitron neon-text-magenta">GAMING GRID</h2>
        <div className="flex gap-4 text-sm items-center">
          <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500 neon-bg-cyan"></div> Available</span>
          <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500 neon-bg-magenta"></div> Occupied</span>
          <button 
            onClick={() => setIsAddStationModalOpen(true)}
            className="ml-4 px-4 py-2 bg-[var(--color-cyber-cyan)]/20 text-[var(--color-cyber-cyan)] border border-[var(--color-cyber-cyan)] rounded hover:bg-[var(--color-cyber-cyan)]/40 transition-colors flex items-center gap-2 font-orbitron text-sm uppercase"
          >
            <Plus className="w-4 h-4" /> Add Station
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {stations.map(station => {
          const session = sessions.find(s => s.stationId === station.id);
          const isOccupied = station.status === 'Occupied';
          
          return (
            <div 
              key={station.id}
              className={`relative overflow-hidden rounded-lg border p-5 transition-all duration-300 cursor-pointer
                ${isOccupied 
                  ? 'bg-[var(--color-cyber-card)] border-[var(--color-cyber-magenta)] neon-border-magenta' 
                  : 'bg-[var(--color-cyber-card)] border-[var(--color-cyber-cyan)] hover:neon-border-cyan'}`}
              onClick={() => {
                if (!isOccupied) {
                  setSelectedStation(station);
                  setSessionForm({ customerName: '', memberId: '', ratePerHour: station.ratePerHour });
                  setIsStartSessionModalOpen(true);
                }
              }}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-orbitron font-bold text-white">{station.name}</h3>
                  <p className="text-gray-400 text-sm">{station.type} • ₹{station.ratePerHour}/hr</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {station.type === 'PC' ? <Monitor className={`w-6 h-6 ${isOccupied ? 'text-[var(--color-cyber-magenta)]' : 'text-[var(--color-cyber-cyan)]'}`} /> : 
                   <Gamepad2 className={`w-6 h-6 ${isOccupied ? 'text-[var(--color-cyber-magenta)]' : 'text-[var(--color-cyber-cyan)]'}`} />}
                  {!isOccupied && (
                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => handleEditStationClick(station, e)}
                        className="text-gray-500 hover:text-[var(--color-cyber-cyan)] transition-colors"
                        title="Edit Station"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => handleRemoveStation(station.id, e)}
                        className="text-gray-500 hover:text-red-500 transition-colors"
                        title="Remove Station"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {isOccupied && session ? (
                <div className="space-y-3 mt-4 border-t border-gray-800 pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Player:</span>
                    <span className="text-white font-semibold">{session.customerName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Time:</span>
                    <span className="text-[var(--color-cyber-magenta)] font-mono text-lg">{formatTime(now - session.startTime)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Est. Cost:</span>
                    <span className="text-[var(--color-cyber-amber)]">₹{calculateCost(session.startTime, session.ratePerHour)}</span>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleEndSession(session); }}
                    className="w-full mt-2 py-2 bg-red-900/50 hover:bg-red-800 text-red-200 border border-red-500 rounded font-orbitron uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                  >
                    <Square className="w-4 h-4" /> End Session
                  </button>
                </div>
              ) : (
                <div className="mt-8 text-center">
                  <span className="inline-block px-3 py-1 bg-[var(--color-cyber-cyan)]/10 text-[var(--color-cyber-cyan)] rounded-full text-sm uppercase tracking-widest font-bold">
                    Available
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderBilling = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-orbitron neon-text-amber mb-6">ACTIVE BILLS</h2>
      
      {bills.length === 0 ? (
        <div className="text-center py-12 text-gray-500 border border-gray-800 rounded-lg bg-[var(--color-cyber-card)]">
          <Receipt className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="text-xl font-orbitron">No pending bills</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {bills.map(bill => {
            const snacksTotal = bill.snacks.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            let discount = 0;
            if (bill.memberId) {
              const member = members.find(m => m.id === bill.memberId);
              if (member && member.status === 'Active') {
                if (member.plan === 'Basic') discount = bill.gamingCharge * 0.10;
                if (member.plan === 'Silver') discount = bill.gamingCharge * 0.20;
                if (member.plan === 'Gold') discount = bill.gamingCharge * 0.30;
              }
            }
            const subtotal = bill.gamingCharge + snacksTotal - discount;
            const tax = subtotal * 0.05;
            const grandTotal = subtotal + tax;

            return (
              <div key={bill.id} className="bg-[var(--color-cyber-card)] border border-gray-700 rounded-lg p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-cyber-amber)]/5 rounded-full blur-3xl"></div>
                
                <div className="flex justify-between items-start mb-4 border-b border-gray-800 pb-4">
                  <div>
                    <h3 className="text-xl font-orbitron text-white">{bill.customerName}</h3>
                    <p className="text-gray-400 text-sm">Bill ID: {bill.id}</p>
                  </div>
                  <span className="px-3 py-1 bg-yellow-900/30 text-yellow-500 border border-yellow-700/50 rounded text-xs uppercase tracking-wider">
                    Pending
                  </span>
                </div>

                <div className="space-y-4 mb-6">
                  {bill.gamingCharge > 0 && (
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-gray-300">Gaming: {bill.stationName}</p>
                        <p className="text-gray-500 text-xs">{bill.durationMinutes} mins</p>
                      </div>
                      <span className="text-white">₹{bill.gamingCharge.toFixed(2)}</span>
                    </div>
                  )}
                  
                  {bill.snacks.length > 0 && (
                    <div className="border-t border-gray-800/50 pt-2">
                      <p className="text-gray-400 text-xs uppercase mb-2">Snacks & Beverages</p>
                      {bill.snacks.map((snack, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm mb-1">
                          <span className="text-gray-300">{snack.quantity}x {snack.name}</span>
                          <span className="text-white">₹{(snack.price * snack.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-700 pt-4 space-y-2 text-sm">
                  <div className="flex justify-between text-gray-400">
                    <span>Subtotal</span>
                    <span>₹{(bill.gamingCharge + snacksTotal).toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-[var(--color-cyber-cyan)]">
                      <span>Member Discount</span>
                      <span>-₹{discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-400">
                    <span>GST (5%)</span>
                    <span>₹{tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-orbitron text-[var(--color-cyber-amber)] pt-2 border-t border-gray-800">
                    <span>TOTAL</span>
                    <span>₹{grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button 
                    onClick={() => printBill(bill)}
                    className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded border border-gray-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Printer className="w-4 h-4" /> Print
                  </button>
                  <button 
                    onClick={() => { setSelectedBill(bill); setIsPayBillModalOpen(true); }}
                    className="flex-1 py-2 bg-[var(--color-cyber-amber)]/20 hover:bg-[var(--color-cyber-amber)]/40 text-[var(--color-cyber-amber)] rounded border border-[var(--color-cyber-amber)] transition-colors flex items-center justify-center gap-2 font-bold uppercase tracking-wider"
                  >
                    <CheckCircle className="w-4 h-4" /> Settle
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderSnacks = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-orbitron neon-text-cyan">CYBER CAFE MENU</h2>
        <button 
          onClick={() => setIsAddNewSnackModalOpen(true)}
          className="px-4 py-2 bg-[var(--color-cyber-cyan)]/20 text-[var(--color-cyber-cyan)] border border-[var(--color-cyber-cyan)] rounded hover:bg-[var(--color-cyber-cyan)]/40 transition-colors flex items-center gap-2 font-orbitron text-sm uppercase"
        >
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {snacks.map(snack => (
          <div key={snack.id} className="relative bg-[var(--color-cyber-card)] border border-gray-800 hover:border-[var(--color-cyber-cyan)] rounded-lg p-4 transition-all group">
            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={(e) => handleEditSnackClick(snack, e)}
                className="text-gray-600 hover:text-[var(--color-cyber-cyan)]"
                title="Edit Item"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button 
                onClick={(e) => handleRemoveSnack(snack.id, e)}
                className="text-gray-600 hover:text-red-500"
                title="Remove Item"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="text-4xl mb-3 text-center group-hover:scale-110 transition-transform">{snack.emoji}</div>
            <h3 className="text-lg font-bold text-white text-center truncate">{snack.name}</h3>
            <p className="text-[var(--color-cyber-cyan)] text-center font-mono mb-4">₹{snack.price}</p>
            <button 
              onClick={() => { setSelectedSnack(snack); setSnackForm({ billId: '', quantity: 1 }); setIsAddSnackModalOpen(true); }}
              className="w-full py-1.5 bg-gray-800 hover:bg-[var(--color-cyber-cyan)] hover:text-black text-white rounded text-sm transition-colors flex items-center justify-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add to Bill
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMembers = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-orbitron neon-text-magenta">NEXUS MEMBERS</h2>
        <button 
          onClick={() => setIsNewMemberModalOpen(true)}
          className="px-4 py-2 bg-[var(--color-cyber-magenta)]/20 text-[var(--color-cyber-magenta)] border border-[var(--color-cyber-magenta)] rounded hover:bg-[var(--color-cyber-magenta)] hover:text-white transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Member
        </button>
      </div>

      <div className="bg-[var(--color-cyber-card)] border border-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-gray-900/80 text-gray-400 text-sm uppercase font-orbitron">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Plan</th>
                <th className="p-4">Visits</th>
                <th className="p-4">Expiry</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {members.map(member => (
                <tr key={member.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="p-4 font-bold text-white">{member.name}</td>
                  <td className="p-4 text-gray-400">{member.phone}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs uppercase font-bold
                      ${member.plan === 'Gold' ? 'bg-yellow-900/50 text-yellow-500 border border-yellow-700' : 
                        member.plan === 'Silver' ? 'bg-gray-700/50 text-gray-300 border border-gray-500' : 
                        'bg-blue-900/50 text-blue-400 border border-blue-700'}`}>
                      {member.plan}
                    </span>
                  </td>
                  <td className="p-4 text-gray-300">{member.totalVisits}</td>
                  <td className="p-4 text-gray-400">{member.expiryDate}</td>
                  <td className="p-4">
                    {member.status === 'Active' ? (
                      <span className="text-[var(--color-cyber-cyan)] flex items-center gap-1"><Zap className="w-3 h-3" /> Active</span>
                    ) : (
                      <span className="text-red-500">Expired</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-orbitron neon-text-cyan mb-6">TRANSACTION LOGS</h2>
      
      <div className="bg-[var(--color-cyber-card)] border border-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-gray-900/80 text-gray-400 text-sm uppercase font-orbitron">
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Station</th>
                <th className="p-4">Gaming</th>
                <th className="p-4">Snacks</th>
                <th className="p-4">Total</th>
                <th className="p-4">Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {transactions.map(tx => (
                <tr key={tx.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="p-4 text-gray-400">{new Date(tx.date).toLocaleString()}</td>
                  <td className="p-4 text-white">{tx.customerName}</td>
                  <td className="p-4 text-gray-300">{tx.stationName}</td>
                  <td className="p-4 text-gray-400">₹{tx.gamingTotal.toFixed(2)}</td>
                  <td className="p-4 text-gray-400">₹{tx.snacksTotal.toFixed(2)}</td>
                  <td className="p-4 font-bold text-[var(--color-cyber-cyan)]">₹{tx.grandTotal.toFixed(2)}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-300 border border-gray-700">
                      {tx.paymentMethod}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden scanlines">
      {/* Sidebar */}
      <div className="w-64 bg-[var(--color-cyber-dark)] border-r border-gray-800 flex flex-col relative z-10">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-2xl font-orbitron font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-cyber-cyan)] to-[var(--color-cyber-magenta)]">
            NEON NEXUS
          </h1>
          <p className="text-xs text-gray-500 tracking-widest uppercase mt-1">Cafe OS v2.4</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {[
            { id: 'dashboard', icon: Activity, label: 'Dashboard', color: 'cyan' },
            { id: 'sessions', icon: Monitor, label: 'Gaming Grid', color: 'magenta' },
            { id: 'billing', icon: Receipt, label: 'Billing', color: 'amber' },
            { id: 'snacks', icon: Coffee, label: 'Cafe Menu', color: 'cyan' },
            { id: 'members', icon: Users, label: 'Members', color: 'magenta' },
            { id: 'history', icon: History, label: 'History', color: 'amber' },
          ].map(item => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 font-orbitron uppercase text-sm tracking-wider
                  ${isActive 
                    ? `bg-[var(--color-cyber-${item.color})]/10 text-[var(--color-cyber-${item.color})] border border-[var(--color-cyber-${item.color})]/50 neon-border-${item.color}` 
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200 border border-transparent'}`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-gray-800 text-center">
          <div className="text-xs font-mono text-gray-500 flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            SYSTEM ONLINE
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto relative z-10 p-8">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'sessions' && renderSessions()}
        {activeTab === 'billing' && renderBilling()}
        {activeTab === 'snacks' && renderSnacks()}
        {activeTab === 'members' && renderMembers()}
        {activeTab === 'history' && renderHistory()}
      </div>

      {/* Modals */}
      {isStartSessionModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--color-cyber-dark)] border border-[var(--color-cyber-cyan)] neon-border-cyan rounded-lg p-6 w-full max-w-md">
            <h3 className="text-2xl font-orbitron text-[var(--color-cyber-cyan)] mb-4 uppercase">Initialize Session</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Station</label>
                <input type="text" disabled value={selectedStation?.name || ''} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-gray-500" />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Customer Name</label>
                <input 
                  type="text" 
                  value={sessionForm.customerName}
                  onChange={e => setSessionForm({...sessionForm, customerName: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-700 focus:border-[var(--color-cyber-cyan)] rounded px-3 py-2 text-white outline-none transition-colors"
                  placeholder="Enter name or scan ID"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Member ID (Optional)</label>
                <select 
                  value={sessionForm.memberId}
                  onChange={e => {
                    const member = members.find(m => m.id === e.target.value);
                    setSessionForm({
                      ...sessionForm, 
                      memberId: e.target.value,
                      customerName: member ? member.name : sessionForm.customerName
                    });
                  }}
                  className="w-full bg-gray-900 border border-gray-700 focus:border-[var(--color-cyber-cyan)] rounded px-3 py-2 text-white outline-none"
                >
                  <option value="">-- Select Member --</option>
                  {members.filter(m => m.status === 'Active').map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.phone})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Rate / Hour (₹)</label>
                <input 
                  type="number" 
                  value={sessionForm.ratePerHour}
                  onChange={e => setSessionForm({...sessionForm, ratePerHour: Number(e.target.value)})}
                  className="w-full bg-gray-900 border border-gray-700 focus:border-[var(--color-cyber-cyan)] rounded px-3 py-2 text-white outline-none"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setIsStartSessionModalOpen(false)} className="flex-1 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors">Cancel</button>
                <button onClick={handleStartSession} className="flex-1 py-2 bg-[var(--color-cyber-cyan)]/20 text-[var(--color-cyber-cyan)] border border-[var(--color-cyber-cyan)] rounded hover:bg-[var(--color-cyber-cyan)] hover:text-black transition-colors font-bold uppercase tracking-wider flex items-center justify-center gap-2">
                  <Play className="w-4 h-4" /> Start
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAddSnackModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--color-cyber-dark)] border border-[var(--color-cyber-cyan)] neon-border-cyan rounded-lg p-6 w-full max-w-md">
            <h3 className="text-2xl font-orbitron text-[var(--color-cyber-cyan)] mb-4 uppercase">Add to Order</h3>
            <div className="flex items-center gap-4 mb-6 p-4 bg-gray-900 rounded border border-gray-800">
              <span className="text-4xl">{selectedSnack?.emoji}</span>
              <div>
                <h4 className="text-xl text-white font-bold">{selectedSnack?.name}</h4>
                <p className="text-[var(--color-cyber-cyan)]">₹{selectedSnack?.price}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Select Bill / Session</label>
                <select 
                  value={snackForm.billId}
                  onChange={e => setSnackForm({...snackForm, billId: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-700 focus:border-[var(--color-cyber-cyan)] rounded px-3 py-2 text-white outline-none"
                >
                  <option value="">-- Select Target --</option>
                  <option value="new_bill">+ Create New Walk-in Bill</option>
                  {bills.filter(b => b.status === 'Pending').map(b => (
                    <option key={b.id} value={b.id}>{b.customerName} {b.stationName ? `(${b.stationName})` : ''}</option>
                  ))}
                  {sessions.map(s => {
                    const station = stations.find(st => st.id === s.stationId);
                    // Check if bill already exists for this session
                    const existingBill = bills.find(b => b.sessionId === s.id);
                    if (existingBill) return null;
                    return <option key={`sess_${s.id}`} value={`create_for_${s.id}`}>[Active] {s.customerName} ({station?.name})</option>;
                  })}
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Quantity</label>
                <div className="flex items-center gap-4">
                  <button onClick={() => setSnackForm({...snackForm, quantity: Math.max(1, snackForm.quantity - 1)})} className="w-10 h-10 bg-gray-800 rounded flex items-center justify-center text-white hover:bg-gray-700">-</button>
                  <span className="text-xl text-white w-8 text-center">{snackForm.quantity}</span>
                  <button onClick={() => setSnackForm({...snackForm, quantity: snackForm.quantity + 1})} className="w-10 h-10 bg-gray-800 rounded flex items-center justify-center text-white hover:bg-gray-700">+</button>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setIsAddSnackModalOpen(false)} className="flex-1 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors">Cancel</button>
                <button 
                  onClick={() => {
                    // Handle special case where we need to create a bill for an active session first
                    if (snackForm.billId.startsWith('create_for_')) {
                      const sessionId = snackForm.billId.replace('create_for_', '');
                      const session = sessions.find(s => s.id === sessionId);
                      const station = stations.find(st => st.id === session?.stationId);
                      if (session) {
                        const newBill: Bill = {
                          id: `bill_${Date.now()}`,
                          sessionId: session.id,
                          customerName: session.customerName,
                          memberId: session.memberId,
                          stationName: station?.name,
                          gamingCharge: 0,
                          snacks: [{ snackId: selectedSnack!.id, name: selectedSnack!.name, quantity: snackForm.quantity, price: selectedSnack!.price }],
                          status: 'Pending',
                          createdAt: Date.now()
                        };
                        setBills([...bills, newBill]);
                        setIsAddSnackModalOpen(false);
                        return;
                      }
                    }
                    handleAddSnackToBill();
                  }} 
                  disabled={!snackForm.billId}
                  className="flex-1 py-2 bg-[var(--color-cyber-cyan)]/20 text-[var(--color-cyber-cyan)] border border-[var(--color-cyber-cyan)] rounded hover:bg-[var(--color-cyber-cyan)] hover:text-black transition-colors font-bold uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isNewMemberModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--color-cyber-dark)] border border-[var(--color-cyber-magenta)] neon-border-magenta rounded-lg p-6 w-full max-w-md">
            <h3 className="text-2xl font-orbitron text-[var(--color-cyber-magenta)] mb-4 uppercase">Register Member</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={memberForm.name}
                  onChange={e => setMemberForm({...memberForm, name: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-700 focus:border-[var(--color-cyber-magenta)] rounded px-3 py-2 text-white outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Phone Number</label>
                <input 
                  type="tel" 
                  value={memberForm.phone}
                  onChange={e => setMemberForm({...memberForm, phone: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-700 focus:border-[var(--color-cyber-magenta)] rounded px-3 py-2 text-white outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Email</label>
                <input 
                  type="email" 
                  value={memberForm.email}
                  onChange={e => setMemberForm({...memberForm, email: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-700 focus:border-[var(--color-cyber-magenta)] rounded px-3 py-2 text-white outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Membership Plan</label>
                <select 
                  value={memberForm.plan}
                  onChange={e => setMemberForm({...memberForm, plan: e.target.value as any})}
                  className="w-full bg-gray-900 border border-gray-700 focus:border-[var(--color-cyber-magenta)] rounded px-3 py-2 text-white outline-none"
                >
                  <option value="Basic">Basic (₹299/mo - 10% Off)</option>
                  <option value="Silver">Silver (₹599/mo - 20% Off)</option>
                  <option value="Gold">Gold (₹999/mo - 30% Off)</option>
                </select>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setIsNewMemberModalOpen(false)} className="flex-1 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors">Cancel</button>
                <button onClick={handleAddMember} disabled={!memberForm.name || !memberForm.phone} className="flex-1 py-2 bg-[var(--color-cyber-magenta)]/20 text-[var(--color-cyber-magenta)] border border-[var(--color-cyber-magenta)] rounded hover:bg-[var(--color-cyber-magenta)] hover:text-white transition-colors font-bold uppercase disabled:opacity-50">
                  Register
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isPayBillModalOpen && selectedBill && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--color-cyber-dark)] border border-[var(--color-cyber-amber)] neon-border-amber rounded-lg p-6 w-full max-w-md">
            <h3 className="text-2xl font-orbitron text-[var(--color-cyber-amber)] mb-4 uppercase">Settle Payment</h3>
            
            <div className="bg-gray-900 p-4 rounded border border-gray-800 mb-6 text-center">
              <p className="text-gray-400 text-sm uppercase tracking-wider mb-1">Amount Due</p>
              <h2 className="text-4xl font-orbitron text-[var(--color-cyber-amber)]">
                ₹{(() => {
                  const snacksTotal = selectedBill.snacks.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                  let discount = 0;
                  if (selectedBill.memberId) {
                    const member = members.find(m => m.id === selectedBill.memberId);
                    if (member && member.status === 'Active') {
                      if (member.plan === 'Basic') discount = selectedBill.gamingCharge * 0.10;
                      if (member.plan === 'Silver') discount = selectedBill.gamingCharge * 0.20;
                      if (member.plan === 'Gold') discount = selectedBill.gamingCharge * 0.30;
                    }
                  }
                  const subtotal = selectedBill.gamingCharge + snacksTotal - discount;
                  return (subtotal + (subtotal * 0.05)).toFixed(2);
                })()}
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Payment Method</label>
                <div className="grid grid-cols-3 gap-3">
                  {['UPI', 'Cash', 'Card'].map(method => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`py-2 rounded border text-sm font-bold uppercase tracking-wider transition-colors
                        ${paymentMethod === method 
                          ? 'bg-[var(--color-cyber-amber)]/20 border-[var(--color-cyber-amber)] text-[var(--color-cyber-amber)]' 
                          : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'}`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-3 mt-8">
                <button onClick={() => setIsPayBillModalOpen(false)} className="flex-1 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors">Cancel</button>
                <button onClick={handlePayBill} className="flex-1 py-2 bg-[var(--color-cyber-amber)]/20 text-[var(--color-cyber-amber)] border border-[var(--color-cyber-amber)] rounded hover:bg-[var(--color-cyber-amber)] hover:text-black transition-colors font-bold uppercase flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Confirm Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {isAddStationModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--color-cyber-dark)] border border-[var(--color-cyber-cyan)] neon-border-cyan rounded-lg p-6 w-full max-w-md">
            <h3 className="text-2xl font-orbitron text-[var(--color-cyber-cyan)] mb-4 uppercase">{editingStationId ? 'Edit Station' : 'Add New Station'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Station Name</label>
                <input 
                  type="text" 
                  value={stationForm.name}
                  onChange={e => setStationForm({...stationForm, name: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-[var(--color-cyber-cyan)] focus:neon-border-cyan transition-all"
                  placeholder="e.g. PC-11"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Station Type</label>
                <select 
                  value={stationForm.type}
                  onChange={e => setStationForm({...stationForm, type: e.target.value as StationType})}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-[var(--color-cyber-cyan)] focus:neon-border-cyan transition-all"
                >
                  <option value="PC">PC</option>
                  <option value="PS5">PS5</option>
                  <option value="Xbox">Xbox</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Rate Per Hour (₹)</label>
                <input 
                  type="number" 
                  value={stationForm.ratePerHour}
                  onChange={e => setStationForm({...stationForm, ratePerHour: Number(e.target.value)})}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-[var(--color-cyber-cyan)] focus:neon-border-cyan transition-all"
                />
              </div>
              
              <div className="flex gap-3 mt-8">
                <button onClick={() => { setIsAddStationModalOpen(false); setEditingStationId(null); setStationForm({ name: '', type: 'PC', ratePerHour: 80 }); }} className="flex-1 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors">Cancel</button>
                <button onClick={handleAddStation} className="flex-1 py-2 bg-[var(--color-cyber-cyan)]/20 text-[var(--color-cyber-cyan)] border border-[var(--color-cyber-cyan)] rounded hover:bg-[var(--color-cyber-cyan)] hover:text-black transition-colors font-bold uppercase flex items-center justify-center gap-2">
                  {editingStationId ? <CheckCircle className="w-4 h-4" /> : <Plus className="w-4 h-4" />} {editingStationId ? 'Save Changes' : 'Add Station'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {isAddNewSnackModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--color-cyber-dark)] border border-[var(--color-cyber-cyan)] neon-border-cyan rounded-lg p-6 w-full max-w-md">
            <h3 className="text-2xl font-orbitron text-[var(--color-cyber-cyan)] mb-4 uppercase">{editingSnackId ? 'Edit Menu Item' : 'Add Menu Item'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Item Name</label>
                <input 
                  type="text" 
                  value={newSnackForm.name}
                  onChange={e => setNewSnackForm({...newSnackForm, name: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-[var(--color-cyber-cyan)] focus:neon-border-cyan transition-all"
                  placeholder="e.g. Energy Drink"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Price (₹)</label>
                <input 
                  type="number" 
                  value={newSnackForm.price}
                  onChange={e => setNewSnackForm({...newSnackForm, price: Number(e.target.value)})}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-[var(--color-cyber-cyan)] focus:neon-border-cyan transition-all"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Category</label>
                <select 
                  value={newSnackForm.category}
                  onChange={e => setNewSnackForm({...newSnackForm, category: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-[var(--color-cyber-cyan)] focus:neon-border-cyan transition-all"
                >
                  <option value="Beverage">Beverage</option>
                  <option value="Food">Food</option>
                  <option value="Snack">Snack</option>
                  <option value="Dessert">Dessert</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Emoji Icon</label>
                <input 
                  type="text" 
                  value={newSnackForm.emoji}
                  onChange={e => setNewSnackForm({...newSnackForm, emoji: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-[var(--color-cyber-cyan)] focus:neon-border-cyan transition-all text-2xl"
                  placeholder="🥤"
                />
              </div>
              
              <div className="flex gap-3 mt-8">
                <button onClick={() => { setIsAddNewSnackModalOpen(false); setEditingSnackId(null); setNewSnackForm({ name: '', price: 50, emoji: '🥤', category: 'Beverage' }); }} className="flex-1 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors">Cancel</button>
                <button onClick={handleAddNewSnack} className="flex-1 py-2 bg-[var(--color-cyber-cyan)]/20 text-[var(--color-cyber-cyan)] border border-[var(--color-cyber-cyan)] rounded hover:bg-[var(--color-cyber-cyan)] hover:text-black transition-colors font-bold uppercase flex items-center justify-center gap-2">
                  {editingSnackId ? <CheckCircle className="w-4 h-4" /> : <Plus className="w-4 h-4" />} {editingSnackId ? 'Save Changes' : 'Add Item'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
