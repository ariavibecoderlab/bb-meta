import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { DollarSign, TrendingUp, AlertTriangle, CreditCard, Building2, FileText, Bell, ArrowUpRight, ArrowDownRight, CheckCircle } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  code: string;
  monthly_revenue_target: number;
  monthly_cost_budget: number;
}

interface CashFlow {
  id: string;
  company_id: string;
  date: string;
  opening_balance: number;
  total_inflow: number;
  total_outflow: number;
  closing_balance: number;
}

interface Alert {
  id: string;
  company_id: string;
  alert_type: string;
  severity: string;
  title: string;
  message: string;
  is_resolved: boolean;
  created_at: string;
}

interface Loan {
  id: string;
  lender_name: string;
  outstanding_amount: number;
  monthly_payment: number;
  next_payment_date: string;
  remaining_months: number;
  status: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  total_amount: number;
  due_date: string;
  status: string;
  reminder_count: number;
  company_id?: string;
}

interface Payable {
  id: string;
  vendor_name: string;
  amount: number;
  due_date: string;
  status: string;
  priority: string;
  description: string;
}

export default function FinanceDashboard({ profile: _profile }: { profile: any }) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [cashFlows, setCashFlows] = useState<CashFlow[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payables, setPayables] = useState<Payable[]>([]);
  const [totalCash, setTotalCash] = useState(0);
  const [totalInflow, setTotalInflow] = useState(0);
  const [totalOutflow, setTotalOutflow] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'receivables' | 'payables' | 'loans' | 'alerts'>('overview');

  useEffect(() => {
    fetchAll();
  }, [selectedCompany]);

  const fetchAll = async () => {
    // Companies
    const { data: comps } = await supabase.from('companies').select('*').eq('is_active', true);
    if (comps) setCompanies(comps);

    // Today's cash flow
    let cfQuery = supabase.from('daily_cash_flow').select('*').order('date', { ascending: false }).limit(30);
    if (selectedCompany !== 'all') cfQuery = cfQuery.eq('company_id', selectedCompany);
    const { data: cf } = await cfQuery;
    if (cf) {
      setCashFlows(cf);
      const today = cf.filter(c => c.date === new Date().toISOString().split('T')[0]);
      setTotalCash(today.reduce((s, c) => s + (c.closing_balance || 0), 0));
      setTotalInflow(today.reduce((s, c) => s + (c.total_inflow || 0), 0));
      setTotalOutflow(today.reduce((s, c) => s + (c.total_outflow || 0), 0));
    }

    // Alerts
    let alertQuery = supabase.from('financial_alerts').select('*').eq('is_resolved', false).order('created_at', { ascending: false }).limit(20);
    if (selectedCompany !== 'all') alertQuery = alertQuery.eq('company_id', selectedCompany);
    const { data: al } = await alertQuery;
    setAlerts(al || []);

    // Loans
    const { data: ln } = await supabase.from('loan_obligations').select('*').eq('status', 'active');
    setLoans(ln || []);

    // Invoices (overdue + upcoming)
    let invQuery = supabase.from('invoices').select('*').in('status', ['sent', 'overdue', 'partially_paid']).order('due_date', { ascending: true }).limit(20);
    if (selectedCompany !== 'all') invQuery = invQuery.eq('company_id', selectedCompany);
    const { data: inv } = await invQuery;
    setInvoices(inv || []);

    // Payables
    let payQuery = supabase.from('payables').select('*').in('status', ['pending', 'approved']).order('due_date', { ascending: true }).limit(20);
    if (selectedCompany !== 'all') payQuery = payQuery.eq('company_id', selectedCompany);
    const { data: pay } = await payQuery;
    setPayables(pay || []);
  };

  const formatRM = (n: number) => `RM ${(n || 0).toLocaleString('en-MY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  const getCompanyName = (id: string) => companies.find(c => c.id === id)?.name || '';
  const getSeverityColor = (s: string) => {
    if (s === 'critical') return 'bg-red-100 text-red-700 border-red-200';
    if (s === 'high') return 'bg-orange-100 text-orange-700 border-orange-200';
    if (s === 'medium') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-blue-100 text-blue-700 border-blue-200';
  };

  const overdueInvoices = invoices.filter(i => i.status === 'overdue' || new Date(i.due_date) < new Date());
  const overduePayables = payables.filter(p => new Date(p.due_date) < new Date());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-700 to-teal-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2"><DollarSign size={24} /> Agent Din 💰</h1>
            <p className="text-emerald-200 text-sm">Financial Intelligence Dashboard</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-emerald-200">{new Date().toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p className="text-xs text-emerald-300">Last updated: {new Date().toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>

        {/* Cash Position Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-xs text-emerald-200">Total Cash Position</p>
            <p className="text-xl font-bold">{formatRM(totalCash)}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-xs text-emerald-200 flex items-center gap-1"><ArrowUpRight size={12} /> Today's Inflow</p>
            <p className="text-xl font-bold text-green-300">{formatRM(totalInflow)}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-xs text-emerald-200 flex items-center gap-1"><ArrowDownRight size={12} /> Today's Outflow</p>
            <p className="text-xl font-bold text-red-300">{formatRM(totalOutflow)}</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-3 shadow-sm text-center cursor-pointer hover:shadow-md" onClick={() => setActiveTab('alerts')}>
          <AlertTriangle className="mx-auto text-red-500" size={20} />
          <p className="text-lg font-bold">{alerts.filter(a => a.severity === 'critical' || a.severity === 'high').length}</p>
          <p className="text-xs text-gray-500">Urgent Alerts</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm text-center cursor-pointer hover:shadow-md" onClick={() => setActiveTab('receivables')}>
          <FileText className="mx-auto text-amber-500" size={20} />
          <p className="text-lg font-bold">{overdueInvoices.length}</p>
          <p className="text-xs text-gray-500">Overdue Inv.</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm text-center cursor-pointer hover:shadow-md" onClick={() => setActiveTab('payables')}>
          <CreditCard className="mx-auto text-blue-500" size={20} />
          <p className="text-lg font-bold">{overduePayables.length}</p>
          <p className="text-xs text-gray-500">Payables Due</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm text-center cursor-pointer hover:shadow-md" onClick={() => setActiveTab('loans')}>
          <Building2 className="mx-auto text-purple-500" size={20} />
          <p className="text-lg font-bold">{loans.length}</p>
          <p className="text-xs text-gray-500">Active Loans</p>
        </div>
      </div>

      {/* Company Filter */}
      <select
        value={selectedCompany}
        onChange={e => setSelectedCompany(e.target.value)}
        className="w-full border rounded-lg px-4 py-2 text-sm bg-white"
      >
        <option value="all">All Companies</option>
        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {[
          { key: 'overview', label: 'Overview', icon: TrendingUp },
          { key: 'receivables', label: 'Receivables', icon: FileText },
          { key: 'payables', label: 'Payables', icon: CreditCard },
          { key: 'loans', label: 'Loans', icon: Building2 },
          { key: 'alerts', label: 'Alerts', icon: Bell },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium ${
              activeTab === tab.key ? 'bg-white shadow-sm text-emerald-700' : 'text-gray-500'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Cash Flow by Company */}
          <h3 className="font-semibold text-gray-700 text-sm">Cash Position by Company</h3>
          <div className="space-y-2">
            {companies.map(comp => {
              const cf = cashFlows.find(c => c.company_id === comp.id);
              return (
                <div key={comp.id} className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{comp.name}</p>
                    <p className="text-xs text-gray-400">Target: {formatRM(comp.monthly_revenue_target)}/mo</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatRM(cf?.closing_balance || 0)}</p>
                    <div className="flex gap-2 text-xs">
                      <span className="text-green-600">+{formatRM(cf?.total_inflow || 0)}</span>
                      <span className="text-red-600">-{formatRM(cf?.total_outflow || 0)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Upcoming Obligations */}
          <h3 className="font-semibold text-gray-700 text-sm mt-4">⏰ Upcoming Payments (7 days)</h3>
          <div className="space-y-2">
            {payables
              .filter(p => new Date(p.due_date) < new Date(Date.now() + 7 * 86400000))
              .slice(0, 5)
              .map(p => (
                <div key={p.id} className="bg-white rounded-xl p-3 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{p.vendor_name}</p>
                    <p className="text-xs text-gray-400">{p.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">{formatRM(p.amount)}</p>
                    <p className="text-xs text-gray-400">Due: {new Date(p.due_date).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}</p>
                  </div>
                </div>
              ))
            }
            {payables.filter(p => new Date(p.due_date) < new Date(Date.now() + 7 * 86400000)).length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No upcoming payments this week</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'receivables' && (
        <div className="space-y-2">
          <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
            <p className="text-sm font-medium text-amber-700">⚠️ {overdueInvoices.length} Overdue Invoices</p>
            <p className="text-xs text-amber-600">Total outstanding: {formatRM(overdueInvoices.reduce((s, i) => s + i.total_amount, 0))}</p>
          </div>
          {invoices.map(inv => (
            <div key={inv.id} className={`bg-white rounded-xl p-4 shadow-sm ${inv.status === 'overdue' || new Date(inv.due_date) < new Date() ? 'border-l-4 border-red-500' : ''}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{inv.customer_name}</p>
                  <p className="text-xs text-gray-400">{inv.invoice_number} • {getCompanyName(inv.company_id || '')}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatRM(inv.total_amount)}</p>
                  <p className={`text-xs ${new Date(inv.due_date) < new Date() ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                    Due: {new Date(inv.due_date).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              </div>
              {inv.reminder_count > 0 && (
                <p className="text-xs text-gray-400 mt-1">📧 {inv.reminder_count} reminder(s) sent</p>
              )}
            </div>
          ))}
          {invoices.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No outstanding invoices</p>}
        </div>
      )}

      {activeTab === 'payables' && (
        <div className="space-y-2">
          {payables.map(p => (
            <div key={p.id} className={`bg-white rounded-xl p-4 shadow-sm ${new Date(p.due_date) < new Date() ? 'border-l-4 border-red-500' : ''}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{p.vendor_name}</p>
                  <p className="text-xs text-gray-400">{p.description}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatRM(p.amount)}</p>
                  <span className={`px-2 py-0.5 rounded text-xs ${p.priority === 'critical' ? 'bg-red-100 text-red-700' : p.priority === 'high' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                    {p.priority}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-1">Due: {new Date(p.due_date).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}</p>
            </div>
          ))}
          {payables.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No pending payables</p>}
        </div>
      )}

      {activeTab === 'loans' && (
        <div className="space-y-3">
          {loans.map(ln => (
            <div key={ln.id} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium">{ln.lender_name}</p>
                  <p className="text-xs text-gray-400">{ln.remaining_months} months remaining</p>
                </div>
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium">{ln.status}</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xs text-gray-400">Outstanding</p>
                  <p className="font-bold text-sm">{formatRM(ln.outstanding_amount)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Monthly</p>
                  <p className="font-bold text-sm text-red-600">{formatRM(ln.monthly_payment)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Next Due</p>
                  <p className="font-bold text-sm">{new Date(ln.next_payment_date).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}</p>
                </div>
              </div>
              {/* Progress bar */}
              <div className="mt-3">
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${Math.min(100, ((25000000 - ln.outstanding_amount) / 25000000) * 100)}%` }} />
                </div>
                <p className="text-xs text-gray-400 text-right mt-0.5">{Math.round(((25000000 - ln.outstanding_amount) / 25000000) * 100)}% paid</p>
              </div>
            </div>
          ))}
          {loans.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No active loans</p>}
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="space-y-2">
          {alerts.map(a => (
            <div key={a.id} className={`rounded-xl p-4 border ${getSeverityColor(a.severity)}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-sm">{a.title}</p>
                  <p className="text-xs mt-1 opacity-80">{a.message}</p>
                  <p className="text-xs mt-1 opacity-60">{getCompanyName(a.company_id)} • {new Date(a.created_at).toLocaleString('en-MY', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <span className="text-xs font-medium uppercase">{a.severity}</span>
              </div>
            </div>
          ))}
          {alerts.length === 0 && (
            <div className="bg-green-50 rounded-xl p-6 text-center">
              <CheckCircle className="mx-auto text-green-500" size={32} />
              <p className="text-green-700 font-medium mt-2">All Clear!</p>
              <p className="text-xs text-green-600">No active financial alerts</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
