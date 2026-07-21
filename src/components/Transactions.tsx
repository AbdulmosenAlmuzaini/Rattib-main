import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { Transaction, Client, User, ServiceTemplate, ChecklistItem } from '../types';
import { 
  Search, 
  Plus, 
  Briefcase, 
  Calendar, 
  UserCircle, 
  MoreVertical, 
  CheckCircle, 
  Circle, 
  ChevronRight, 
  DollarSign, 
  Layers, 
  Menu, 
  MessageCircle, 
  ExternalLink,
  ChevronDown,
  X,
  PlusCircle,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';

interface TransactionsProps {
  initialFilter?: any;
  openQuickAction?: (action: string) => void;
}

const STATUS_LABELS: Record<Transaction['status'], { label: string; color: string; bg: string }> = {
  new: { label: 'جديدة', color: 'text-blue-600', bg: 'bg-blue-50' },
  waiting_docs: { label: 'نقص مستندات', color: 'text-amber-600', bg: 'bg-amber-50' },
  ready: { label: 'جاهزة للتقديم', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  in_progress: { label: 'تحت الإجراء', color: 'text-[#1597B8]', bg: 'bg-cyan-50' },
  needs_review: { label: 'تحتاج مراجعة', color: 'text-purple-600', bg: 'bg-purple-50' },
  pending: { label: 'معلقة', color: 'text-gray-500', bg: 'bg-gray-100' },
  completed: { label: 'مكتملة', color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
  cancelled: { label: 'ملغاة', color: 'text-red-600', bg: 'bg-red-50' }
};

const PRIORITY_LABELS: Record<Transaction['priority'], { label: string; bg: string; text: string }> = {
  low: { label: 'منخفضة', bg: 'bg-gray-100', text: 'text-gray-600' },
  normal: { label: 'عادية', bg: 'bg-blue-50', text: 'text-blue-600' },
  high: { label: 'عالية', bg: 'bg-orange-50', text: 'text-orange-600' },
  urgent: { label: 'عاجلة جداً', bg: 'bg-red-50', text: 'text-red-600' }
};

export const Transactions: React.FC<TransactionsProps> = ({ initialFilter, openQuickAction }) => {
  const { 
    transactions, 
    clients, 
    users, 
    templates, 
    currentUser,
    updateTransactionStatus,
    updateTransactionChecklist,
    addTransactionPayment,
    payments
  } = useApp();

  const isReadOnly = currentUser.role === 'viewer';
  const isAccountant = currentUser.role === 'accountant';

  // UI state
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [assignedFilter, setAssignedFilter] = useState<string>('all');
  
  // Selected transaction detail view
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Partial Payment Form
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer' | 'card' | 'network' | 'other'>('cash');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [pendingChecklistItemId, setPendingChecklistItemId] = useState<string | null>(null);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [transactionActionMessage, setTransactionActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Handle preset filters if passed from App.tsx
  React.useEffect(() => {
    if (initialFilter) {
      if (initialFilter.status) {
        setStatusFilter(initialFilter.status);
      }
      if (initialFilter.followUp) {
        setStatusFilter('follow-up');
      }
      if (initialFilter.openTransactionId) {
        const transaction = transactions.find(item => item.id === initialFilter.openTransactionId);
        if (transaction) {
          setSearchTerm('');
          setStatusFilter('all');
          setTransactionActionMessage(null);
          setSelectedTx(transaction);
        }
      }
    }
  }, [initialFilter, transactions]);

  // Keep the open details modal synchronized with the canonical transaction state.
  const selectedTxId = selectedTx?.id;
  React.useEffect(() => {
    if (!selectedTxId) return;
    const latest = transactions.find(transaction => transaction.id === selectedTxId);
    if (latest) setSelectedTx(latest);
  }, [transactions, selectedTxId]);

  // Filters
  const filteredTransactions = transactions.filter(tx => {
    const client = clients.find(c => c.id === tx.clientId);
    const matchesSearch = tx.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          tx.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (client && client.fullName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const isDueForFollowUp = !!tx.nextFollowUpDate && tx.nextFollowUpDate.slice(0, 10) <= new Date().toISOString().slice(0, 10) && !['completed', 'cancelled'].includes(tx.status);
    const matchesStatus = statusFilter === 'all' 
      ? true 
      : statusFilter === 'follow-up'
        ? isDueForFollowUp
      : (statusFilter === 'active' 
          ? tx.status !== 'completed' && tx.status !== 'cancelled' 
          : (statusFilter === 'overdue' 
              ? (tx.status !== 'completed' && tx.status !== 'cancelled' && tx.expectedCompletionDate && tx.expectedCompletionDate < new Date().toISOString().split('T')[0])
              : tx.status === statusFilter));

    const matchesPriority = priorityFilter === 'all' ? true : tx.priority === priorityFilter;
    const matchesAssigned = assignedFilter === 'all' ? true : tx.assignedUserId === assignedFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesAssigned;
  });

  // Kanban Column Definitions
  const columns: { id: Transaction['status']; label: string; color: string }[] = [
    { id: 'new', label: 'جديدة', color: '#3B82F6' },
    { id: 'waiting_docs', label: 'نقص مستندات', color: '#F59E0B' },
    { id: 'ready', label: 'جاهزة للتقديم', color: '#10B981' },
    { id: 'in_progress', label: 'تحت الإجراء', color: '#1597B8' },
    { id: 'needs_review', label: 'تحتاج مراجعة', color: '#8B5CF6' },
    { id: 'pending', label: 'معلقة', color: '#6B7280' },
    { id: 'completed', label: 'مكتملة', color: '#10B981' }
  ];

  // Helper to move transaction to another column
  const moveTransaction = (txId: string, newStatus: Transaction['status']) => {
    if (isReadOnly) return;
    updateTransactionStatus(txId, newStatus);
    // If the modal is currently open, update its state too
    if (selectedTx && selectedTx.id === txId) {
      setSelectedTx(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  // Record payment
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTx || !paymentAmount || isReadOnly) return;

    const amount = Number(paymentAmount);
    if (amount <= 0 || amount > selectedTx.remainingAmount) {
      alert('المبلغ المدفوع يجب أن يكون أكبر من الصفر ولا يتعدى المبلغ المتبقي.');
      return;
    }

    setIsSubmittingPayment(true);
    setTransactionActionMessage(null);
    const updatedTx = await addTransactionPayment(selectedTx.id, {
      transactionId: selectedTx.id,
      amount,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod,
      referenceNumber: paymentReference || undefined,
      notes: paymentNotes || undefined
    });
    setIsSubmittingPayment(false);

    if (!updatedTx) {
      setTransactionActionMessage({ type: 'error', text: 'تعذر تسجيل الدفعة. حاول مرة أخرى.' });
      return;
    }

    setSelectedTx(updatedTx);
    setPaymentAmount('');
    setPaymentNotes('');
    setPaymentReference('');
    setTransactionActionMessage({ type: 'success', text: 'تم تسجيل الدفعة وتحديث الرصيد فورًا.' });
  };

  const handleChecklistToggle = async (item: ChecklistItem) => {
    if (!selectedTx || isReadOnly || pendingChecklistItemId) return;
    setPendingChecklistItemId(item.id);
    setTransactionActionMessage(null);
    const updatedTx = await updateTransactionChecklist(selectedTx.id, item.id, !item.isCompleted);
    setPendingChecklistItemId(null);
    if (!updatedTx) {
      setTransactionActionMessage({ type: 'error', text: 'تعذر تحديث خطوة الإنجاز. حاول مرة أخرى.' });
      return;
    }
    setSelectedTx(updatedTx);
    setTransactionActionMessage({ type: 'success', text: item.isCompleted ? 'تم إلغاء إنجاز الخطوة.' : 'تم اعتماد إنجاز الخطوة.' });
  };

  // Send Whatsapp update generator (RTL & Wa.me compatible)
  const generateWhatsAppLink = (tx: Transaction, type: 'status' | 'invoice') => {
    const client = clients.find(c => c.id === tx.clientId);
    if (!client) return '#';

    // Format phone to 966 standard
    let phoneNum = client.phone;
    if (phoneNum.startsWith('05')) {
      phoneNum = '966' + phoneNum.slice(1);
    } else if (phoneNum.startsWith('5')) {
      phoneNum = '966' + phoneNum;
    }

    let message = '';
    if (type === 'status') {
      const statusLbl = STATUS_LABELS[tx.status].label;
      message = `السلام عليكم ورحمة الله وبركاته، أخي العزيز ${client.fullName}.\n\nنفيدكم علماً بأن معاملتكم رقم (${tx.referenceNumber}) بعنوان:\n*${tx.title}*\nقد أصبحت حالتها الآن: *[ ${statusLbl} ]*.\n\nيمكنكم دائماً متابعة سير العمل. شكراً لثقتكم بمكتبنا - رتّب الذكي.`;
    } else {
      message = `السلام عليكم ورحمة الله وبركاته، أخي العزيز ${client.fullName}.\n\nتجدون أدناه كشف الحساب المالي للمعاملة رقم (${tx.referenceNumber}):\n- عنوان المعاملة: *${tx.title}*\n- إجمالي التكاليف والرسوم: ${tx.totalAmount} ريال\n- المبلغ المسدد: ${tx.receivedAmount} ريال\n- *المبلغ المتبقي للاستحقاق: ${tx.remainingAmount} ريال*\n\nيرجى التنسيق لسداد المبلغ المتبقي عبر التحويل أو الدفع بالشبكة. شكراً لكم.`;
    }

    return `https://wa.me/${phoneNum}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Title Bar & Quick Stats */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#0F2742]">لوحة المعاملات وسير العمل</h2>
          <p className="text-gray-500 text-xs mt-1">
            متابعة المعاملات النشطة والمنجزة وتحريكها عبر مراحل التخليص والتعقيب الحكومي بكفاءة.
          </p>
        </div>
        {!isReadOnly && !isAccountant && (
          <button 
            onClick={() => openQuickAction('transaction')}
            className="px-5 py-2.5 bg-[#1597B8] hover:bg-cyan-600 text-white font-bold text-sm rounded-xl flex items-center gap-2 shadow-lg shadow-[#1597B8]/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            إنشاء معاملة جديدة
          </button>
        )}
      </div>

      {/* View Switcher and Advanced Filters Box */}
      <div className="glass-panel p-5 rounded-3xl border border-white shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
          {/* View Mode */}
          <div className="flex bg-gray-100 p-1.5 rounded-xl self-start shrink-0">
            <button 
              onClick={() => setViewMode('kanban')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'kanban' ? 'bg-white text-[#0F2742] shadow-xs' : 'text-gray-500'
              }`}
            >
              <Layers className="w-4 h-4" />
              لوحة كانبان (Kanban)
            </button>
            <button 
              onClick={() => setViewMode('table')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'table' ? 'bg-white text-[#0F2742] shadow-xs' : 'text-gray-500'
              }`}
            >
              <Menu className="w-4 h-4" />
              عرض جدول مفصل
            </button>
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="ابحث برقم المعاملة، عنوانها، أو اسم العميل..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 bg-white/50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#1597B8] focus:bg-white"
            />
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-gray-100 text-xs">
          <div>
            <label className="block text-gray-400 mb-1">المرحلة / الحالة</label>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none"
            >
              <option value="all">كل الحالات النشطة والمنتهية</option>
            <option value="active">المعاملات النشطة فقط</option>
            <option value="follow-up">تحتاج متابعة اليوم</option>
              <option value="overdue">المعاملات المتأخرة فقط</option>
              {columns.map(col => (
                <option key={col.id} value={col.id}>{col.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-400 mb-1">مستوى الأولوية</label>
            <select 
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none"
            >
              <option value="all">كل الأولويات</option>
              <option value="low">منخفضة</option>
              <option value="normal">عادية</option>
              <option value="high">عالية</option>
              <option value="urgent">عاجلة جداً</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-400 mb-1">المعقب المسؤول</label>
            <select 
              value={assignedFilter}
              onChange={(e) => setAssignedFilter(e.target.value)}
              className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none"
            >
              <option value="all">كل الموظفين</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.fullName}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end justify-end">
            <button 
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setPriorityFilter('all');
                setAssignedFilter('all');
              }}
              className="text-xs text-[#1597B8] hover:underline font-bold"
            >
              تصفير الفلاتر
            </button>
          </div>
        </div>
      </div>

      {/* Kanban Board View */}
      {viewMode === 'kanban' ? (
        <div className="flex gap-4 overflow-x-auto pb-4 select-none" style={{ minHeight: '500px' }}>
          {columns.map(col => {
            const colTxs = filteredTransactions.filter(t => t.status === col.id);
            return (
              <div 
                key={col.id}
                className="w-72 bg-gray-100/60 rounded-3xl p-4 flex flex-col shrink-0 border border-gray-200/50"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: col.color }}></span>
                    <span className="text-xs font-black text-[#0F2742]">{col.label}</span>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 bg-white px-2 py-0.5 rounded-full shadow-xs">
                    {colTxs.length}
                  </span>
                </div>

                {/* Cards List */}
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[550px] pr-0.5">
                  {colTxs.map(tx => {
                    const client = clients.find(c => c.id === tx.clientId);
                    const user = users.find(u => u.id === tx.assignedUserId);
                    const doneChecklist = tx.checklist.filter(c => c.isCompleted).length;
                    const totalChecklist = tx.checklist.length;
                    
                    return (
                      <div 
                        key={tx.id}
                        onClick={() => setSelectedTx(tx)}
                        className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:shadow-md hover:border-[#1597B8]/20 transition-all cursor-pointer group"
                      >
                        {/* Priority Badge */}
                        <div className="flex justify-between items-center mb-2">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${PRIORITY_LABELS[tx.priority].bg} ${PRIORITY_LABELS[tx.priority].text}`}>
                            {PRIORITY_LABELS[tx.priority].label}
                          </span>
                          <span className="text-[9px] font-bold text-gray-400 font-mono">
                            {tx.referenceNumber}
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className="text-xs font-bold text-[#0F2742] group-hover:text-[#1597B8] transition-colors leading-relaxed">
                          {tx.title}
                        </h4>

                        {/* Client details */}
                        <p className="text-[10px] text-gray-400 truncate mt-1">
                          العميل: {client?.fullName}
                        </p>

                        {/* Checklist Progress Bar */}
                        {totalChecklist > 0 && (
                          <div className="mt-3 space-y-1">
                            <div className="flex justify-between text-[8px] text-gray-400 font-bold">
                              <span>المراحل الفرعية والتنفيذ</span>
                              <span>{doneChecklist} من {totalChecklist}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1">
                              <div 
                                className="bg-[#23B78D] h-1 rounded-full transition-all"
                                style={{ width: `${(doneChecklist / totalChecklist) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        )}

                        {/* Footer info: dates & assigned user */}
                        <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-50 text-[9px] text-gray-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{tx.expectedCompletionDate || 'مفتوح'}</span>
                          </div>
                          
                          {user ? (
                            <span className="bg-gray-50 px-1.5 py-0.5 rounded flex items-center gap-1 font-bold text-gray-600">
                              <UserCircle className="w-3 h-3 text-[#1597B8]" />
                              {user.fullName.split(' ')[0]}
                            </span>
                          ) : (
                            <span className="text-orange-400 text-[8px] font-bold">غير محدد</span>
                          )}
                        </div>

                        {/* Column shift buttons for non-drag-and-drop mobile/preview */}
                        {!isReadOnly && (
                          <div className="flex gap-1 mt-3 pt-2 border-t border-gray-100 justify-end" onClick={e => e.stopPropagation()}>
                            <p className="text-[8px] text-gray-400 ml-auto self-center">نقل إلى:</p>
                            {columns.filter(c => c.id !== tx.status).slice(0, 3).map(colItem => (
                              <button
                                key={colItem.id}
                                onClick={() => moveTransaction(tx.id, colItem.id)}
                                className="p-1 bg-gray-50 hover:bg-[#1597B8]/10 hover:text-[#1597B8] border border-gray-200 text-[8px] font-bold rounded transition-colors"
                              >
                                {colItem.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {colTxs.length === 0 && (
                    <div className="text-center py-12 text-gray-400 text-[11px] border border-dashed border-gray-200 rounded-2xl bg-white/50">
                      لا توجد معاملات في هذا العمود.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Detailed Table View */
        <div className="glass-panel rounded-3xl border border-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#0F2742] text-white text-[11px] uppercase">
                <tr>
                  <th className="px-6 py-4 font-bold">الرقم المرجعي</th>
                  <th className="px-6 py-4 font-bold">المعاملة والموضوع</th>
                  <th className="px-6 py-4 font-bold">العميل</th>
                  <th className="px-6 py-4 font-bold">المعقب المسؤول</th>
                  <th className="px-6 py-4 font-bold">الأولوية</th>
                  <th className="px-6 py-4 font-bold">الحالة</th>
                  <th className="px-6 py-4 font-bold">المالية (المتبقي/الإجمالي)</th>
                  <th className="px-6 py-4 font-bold">تاريخ الاستحقاق</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTransactions.map(tx => {
                  const client = clients.find(c => c.id === tx.clientId);
                  const user = users.find(u => u.id === tx.assignedUserId);
                  return (
                    <tr 
                      key={tx.id}
                      onClick={() => setSelectedTx(tx)}
                      className="hover:bg-gray-50/50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 font-mono font-bold text-gray-500">
                        {tx.referenceNumber}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-[#0F2742]">{tx.title}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{tx.checklist.filter(c => c.isCompleted).length} من {tx.checklist.length} خطوة فرعية منجزة</p>
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-700">
                        {client?.fullName}
                      </td>
                      <td className="px-6 py-4">
                        {user ? (
                          <span className="inline-flex items-center gap-1.5 font-medium text-gray-600">
                            <UserCircle className="w-4 h-4 text-[#1597B8]" />
                            {user.fullName}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded ${PRIORITY_LABELS[tx.priority].bg} ${PRIORITY_LABELS[tx.priority].text}`}>
                          {PRIORITY_LABELS[tx.priority].label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${STATUS_LABELS[tx.status].bg} ${STATUS_LABELS[tx.status].color}`}>
                          {STATUS_LABELS[tx.status].label}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono">
                        <div className="flex flex-col">
                          <span className="font-bold text-red-600">{tx.remainingAmount} ر.س معلق</span>
                          <span className="text-[10px] text-gray-400">من أصل {tx.totalAmount}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 font-mono">
                        {tx.expectedCompletionDate || '—'}
                      </td>
                    </tr>
                  );
                })}

                {filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-gray-400 text-xs bg-white">
                      لا توجد معاملات تطابق المعايير المحددة.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transaction Details Modal (Unified "ملف المعاملة التفصيلي") */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto font-sans text-right" dir="rtl">
            <button 
              onClick={() => setSelectedTx(null)}
              className="absolute top-4 left-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Reference & Title */}
            <div className="border-b border-gray-100 pb-5 mb-5">
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 mb-2">
                <span className="font-mono bg-gray-100 px-2 py-0.5 rounded font-bold">{selectedTx.referenceNumber}</span>
                <span>•</span>
                <span>تاريخ الاستلام: {selectedTx.receivedDate}</span>
                {selectedTx.completedDate && (
                  <>
                    <span>•</span>
                    <span className="text-[#23B78D] font-bold">تاريخ الإنجاز: {selectedTx.completedDate}</span>
                  </>
                )}
              </div>
              <h3 className="text-xl font-black text-[#0F2742] leading-relaxed">{selectedTx.title}</h3>
              <p className="text-xs text-gray-500 mt-2 bg-gray-50 p-3 rounded-xl border border-gray-100/50 leading-relaxed">
                {selectedTx.description || 'لا يوجد وصف مضاف للمعاملة.'}
              </p>
            </div>

            {/* Grid Layout: Checklist vs Financial Ledger & WhatsApp updates */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Checklist & Steps Action (8 cols) */}
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <h4 className="text-sm font-black text-[#0F2742] mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4.5 h-4.5 text-[#1597B8]" />
                    مراحل الإنجاز والتحقق الفرعية (الـ Checklist)
                  </h4>
                  
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3">
                    {selectedTx.checklist.map(item => (
                      <div 
                        key={item.id}
                        className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                          item.isCompleted 
                            ? 'bg-emerald-50/50 border-emerald-100 text-gray-500' 
                            : 'bg-white border-gray-200 text-[#0F2742]'
                        }`}
                      >
                        <button 
                          type="button"
                          disabled={isReadOnly || pendingChecklistItemId !== null}
                          aria-label={item.isCompleted ? `إلغاء إنجاز ${item.stepName}` : `تحديد ${item.stepName} كمكتملة`}
                          onClick={() => void handleChecklistToggle(item)}
                          className="mt-0.5 text-gray-400 hover:text-[#1597B8] transition-colors cursor-pointer shrink-0 disabled:cursor-wait disabled:opacity-60"
                        >
                          {item.isCompleted ? (
                            <CheckCircle className="w-5 h-5 text-[#23B78D]" />
                          ) : (
                            <Circle className="w-5 h-5 text-gray-300" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-bold leading-normal ${item.isCompleted ? 'line-through text-gray-400' : ''}`}>
                            {item.stepName}
                          </p>
                          {item.isCompleted && (
                            <p className="text-[9px] text-gray-400 mt-1">
                              أنجزها: <span className="font-bold">{item.completedBy}</span> {item.completedAt && `في ${new Date(item.completedAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}`}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                    {selectedTx.checklist.length === 0 && (
                      <p className="text-center py-4 text-xs text-gray-400">لا توجد خطوات مضافة لهذه المعاملة.</p>
                    )}
                  </div>
                </div>

                {/* Change Phase/Status Row */}
                {!isReadOnly && (
                  <div>
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">تحديث الحالة والمرحلة الحكومية الحالية:</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {columns.map(col => (
                        <button
                          key={col.id}
                          onClick={() => moveTransaction(selectedTx.id, col.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            selectedTx.status === col.id
                              ? 'bg-[#0F2742] text-white border-[#0F2742]'
                              : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {col.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Financial Ledger & Whatsapp (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                {/* Financial details card */}
                <div className="bg-gradient-to-br from-[#0F2742] to-[#162f4c] text-white p-5 rounded-3xl shadow-lg">
                  <h4 className="text-xs font-black text-white/50 uppercase tracking-wider mb-3">تفاصيل الحساب والرسوم</h4>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-white/60">أتعاب خدمة المكتب:</span>
                      <span className="font-bold font-mono">{selectedTx.serviceFee} ر.س</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-white/60">الرسوم الحكومية:</span>
                      <span className="font-bold font-mono">{selectedTx.governmentFee} ر.س</span>
                    </div>
                    {selectedTx.extraExpenses > 0 && (
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-white/60">مصاريف إضافية:</span>
                        <span className="font-bold font-mono">{selectedTx.extraExpenses} ر.س</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-black pt-2 text-[#23B78D]">
                      <span>إجمالي تكاليف المعاملة:</span>
                      <span className="font-mono">{selectedTx.totalAmount} ر.س</span>
                    </div>
                    <div className="flex justify-between text-xs pt-1 border-t border-white/10 text-cyan-200">
                      <span>المبالغ المدفوعة مسبقاً:</span>
                      <span className="font-mono">{selectedTx.receivedAmount} ر.س</span>
                    </div>
                    <div className="flex justify-between text-sm font-black pt-2 border-t border-dashed border-white/20 text-orange-400">
                      <span>المتبقي غير المسدد:</span>
                      <span className="font-mono">{selectedTx.remainingAmount} ر.س</span>
                    </div>
                  </div>
                </div>

                {/* Instant Action: Record Payment */}
                {!isReadOnly && selectedTx.remainingAmount > 0 && (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-3">
                    <h5 className="text-xs font-black text-[#0F2742] flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-[#1597B8]" />
                      تسجيل دفعة جزئية / كاملة جديدة
                    </h5>
                    
                    <form onSubmit={handlePaymentSubmit} className="space-y-2">
                      <div className="flex gap-2">
                        <input 
                          type="number" 
                          required
                          min="1"
                          max={selectedTx.remainingAmount}
                          placeholder="المبلغ بالريال..."
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          className="flex-1 p-2 bg-white border border-gray-200 rounded-lg text-xs font-bold focus:outline-none"
                        />
                        <select 
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value as any)}
                          className="p-2 bg-white border border-gray-200 rounded-lg text-xs font-bold"
                        >
                          <option value="cash">كاش / نقداً</option>
                          <option value="bank_transfer">تحويل بنكي</option>
                          <option value="network">شبكة / POS</option>
                        </select>
                      </div>
                      
                      <input 
                        type="text" 
                        placeholder="الرقم المرجعي أو رقم الحوالة (اختياري)..."
                        value={paymentReference}
                        onChange={(e) => setPaymentReference(e.target.value)}
                        className="w-full p-2 bg-white border border-gray-200 rounded-lg text-[10px] focus:outline-none"
                      />

                      <button 
                        type="submit"
                        disabled={isSubmittingPayment}
                        className="w-full py-2 bg-[#23B78D] hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer disabled:cursor-wait disabled:opacity-60"
                      >
                        {isSubmittingPayment ? 'جاري تسجيل الدفعة...' : 'تسجيل الدفعة وتعديل الرصيد'}
                      </button>
                    </form>
                  </div>
                )}

                {transactionActionMessage && (
                  <div
                    role="status"
                    aria-live="polite"
                    className={`rounded-xl border px-3 py-2 text-xs font-bold ${transactionActionMessage.type === 'success' ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-red-100 bg-red-50 text-red-700'}`}
                  >
                    {transactionActionMessage.text}
                  </div>
                )}

                {/* Secure Client Communication: WhatsApp wa.me triggers */}
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl space-y-3">
                  <h5 className="text-xs font-black text-[#0F2742] flex items-center gap-1">
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    مراسلة العميل عبر الواتساب الفوري (RTL)
                  </h5>
                  <p className="text-[10px] text-gray-500 leading-normal">
                    يمكنك إرسال إشعار فوري وتحديث للعميل بشأن حالة المعاملة أو المطالبة المالية مباشرة عبر واتساب بدون تخزين الأرقام يدوياً.
                  </p>

                  <div className="flex gap-2">
                    <a 
                      href={generateWhatsAppLink(selectedTx, 'status')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-center font-bold text-[10px] rounded-xl flex items-center justify-center gap-1 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      تحديث الحالة
                    </a>
                    <a 
                      href={generateWhatsAppLink(selectedTx, 'invoice')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 bg-white hover:bg-gray-50 text-emerald-600 text-center font-bold text-[10px] rounded-xl border border-emerald-200 flex items-center justify-center gap-1 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      إرسال فاتورة/مستحقات
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
