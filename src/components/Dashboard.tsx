import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { 
  FileText, 
  AlertTriangle, 
  FolderLock, 
  CircleDollarSign, 
  TrendingUp, 
  Clock, 
  Calendar,
  Sparkles,
  ArrowLeft,
  Briefcase,
  User,
  Plus,
  Bell,
  CheckCircle2,
  PhoneCall,
  MapPin,
  Search
} from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardProps {
  setCurrentTab?: (tab: string) => void;
  setTransactionFilter?: (filter: any) => void;
  setClientFilter?: (filter: any) => void;
  setDocumentFilter?: (filter: any) => void;
  openQuickAction: (action: string, templateId?: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  setCurrentTab, 
  setTransactionFilter, 
  setClientFilter, 
  setDocumentFilter,
  openQuickAction
}) => {
  const { 
    transactions, 
    clients, 
    documents, 
    tasks, 
    payments, 
    notifications,
    currentUser,
    currentWorkspace,
    completeTask,
    markNotificationAsRead,
    setCurrentTab: contextSetCurrentTab
  } = useApp();

  const changeTab = setCurrentTab || contextSetCurrentTab;

  // 1. Calculations for stats
  const activeTransactions = transactions.filter(t => t.status !== 'completed' && t.status !== 'cancelled');
  const waitingDocsCount = transactions.filter(t => t.status === 'waiting_docs').length;
  const inProgressCount = transactions.filter(t => t.status === 'in_progress').length;
  
  // Overdue transactions (expectedCompletionDate before today and not completed)
  const todayStr = new Date().toISOString().split('T')[0];
  const overdueTransactions = transactions.filter(t => 
    t.status !== 'completed' && 
    t.status !== 'cancelled' && 
    t.expectedCompletionDate && 
    t.expectedCompletionDate < todayStr
  );

  // Total received money
  const totalReceived = payments.reduce((acc, p) => acc + Number(p.amount), 0);
  
  // Total outstanding money (remaining amount on all active transactions)
  const totalRemaining = activeTransactions.reduce((acc, t) => acc + Number(t.remainingAmount), 0);

  // Unpaid or partially paid count
  const remainingClientsCount = Array.from(new Set(
    activeTransactions
      .filter(t => t.remainingAmount > 0)
      .map(t => t.clientId)
  )).length;

  // Documents expiring soon (in less than 15 days)
  const fifteenDaysFromNow = new Date();
  fifteenDaysFromNow.setDate(fifteenDaysFromNow.getDate() + 15);
  const fifteenDaysStr = fifteenDaysFromNow.toISOString().split('T')[0];
  
  const expiringDocuments = documents.filter(d => 
    d.expiryDate && 
    d.expiryDate >= todayStr && 
    d.expiryDate <= fifteenDaysStr
  );

  // 2. Clickable Summary Handlers
  const handleViewActiveTransactions = () => {
    setTransactionFilter?.({ status: 'active' });
    changeTab('transactions');
  };

  const handleViewWaitingDocs = () => {
    setTransactionFilter?.({ status: 'waiting_docs' });
    changeTab('transactions');
  };

  const handleViewOverdueTransactions = () => {
    setTransactionFilter?.({ status: 'overdue' });
    changeTab('transactions');
  };

  const handleViewExpiringDocs = () => {
    setDocumentFilter?.({ expiring: true });
    changeTab('documents');
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'call': return <PhoneCall className="w-5 h-5 text-blue-500" />;
      case 'payment_collect': return <CircleDollarSign className="w-5 h-5 text-green-500" />;
      case 'doc_request': return <FileText className="w-5 h-5 text-amber-500" />;
      default: return <MapPin className="w-5 h-5 text-[#1597B8]" />;
    }
  };

  return (
    <div id="dashboard-wrapper" className="space-y-6 font-sans">
      {/* Smart Welcome Banner */}
      <div id="smart-welcome-banner" className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-l from-[#0F2742] via-[#162f4c] to-[#1597B8] p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="z-10">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-5 h-5 text-yellow-400 fill-yellow-400 animate-pulse" />
            <span className="text-xs font-bold text-cyan-200 uppercase tracking-wider">مرحباً بك في لوحة تحكم مكتبك الذكي</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black">أهلاً بك يا، {currentUser.fullName} 👋</h2>
          <p className="text-white/70 text-xs md:text-sm mt-1">
            مساحة عمل: <span className="text-white font-bold">{currentWorkspace.name}</span>. إليك ملخص المعاملات والمهام والحسابات المالية اليوم.
          </p>
        </div>

        {/* Quick Actions Panel */}
        <div className="flex flex-wrap gap-2 z-10 shrink-0">
          <button 
            onClick={() => openQuickAction('transaction')}
            className="px-4 py-2.5 bg-[#1597B8] hover:bg-cyan-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-lg shadow-[#1597B8]/20"
          >
            <Plus className="w-4 h-4" />
            معاملة جديدة
          </button>
          <button 
            onClick={() => openQuickAction('client')}
            className="px-4 py-2.5 bg-[#23B78D] hover:bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-lg shadow-[#23B78D]/20"
          >
            <Plus className="w-4 h-4" />
            عميل جديد
          </button>
          <button 
            onClick={() => openQuickAction('payment')}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all border border-white/20"
          >
            <CircleDollarSign className="w-4 h-4" />
            تسجيل دفعة
          </button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div id="stats-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Active Transactions */}
        <div 
          onClick={handleViewActiveTransactions}
          className="glass-panel p-5 rounded-3xl border border-white shadow-sm cursor-pointer hover:shadow-md transition-all hover:translate-y-[-2px]"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-500 text-xs font-bold">المعاملات النشطة</span>
            <div className="w-8 h-8 rounded-full bg-[#1597B8]/10 flex items-center justify-center text-[#1597B8]">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-black text-[#0F2742]">{activeTransactions.length}</h3>
            <span className="text-[10px] font-bold text-[#23B78D] bg-[#23B78D]/10 px-2 py-0.5 rounded-lg">
              {inProgressCount} تحت الإجراء
            </span>
          </div>
        </div>

        {/* Stat 2: Waiting Docs */}
        <div 
          onClick={handleViewWaitingDocs}
          className="glass-panel p-5 rounded-3xl border border-white shadow-sm cursor-pointer hover:shadow-md transition-all hover:translate-y-[-2px]"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-500 text-xs font-bold">تنتظر مستندات</span>
            <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-600">
              <FolderLock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-black text-[#0F2742]">{String(waitingDocsCount).padStart(2, '0')}</h3>
            <span className="text-[10px] font-bold text-yellow-600 bg-yellow-500/10 px-2 py-0.5 rounded-lg">
              مراجعة الآن
            </span>
          </div>
        </div>

        {/* Stat 3: Overdue */}
        <div 
          onClick={handleViewOverdueTransactions}
          className="glass-panel p-5 rounded-3xl border border-white shadow-sm cursor-pointer hover:shadow-md transition-all hover:translate-y-[-2px]"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-500 text-xs font-bold">معاملات متأخرة</span>
            <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-black text-red-600">{String(overdueTransactions.length).padStart(2, '0')}</h3>
            <span className="text-[10px] font-bold text-white bg-red-500 px-2 py-0.5 rounded-lg">
              حرجة
            </span>
          </div>
        </div>

        {/* Stat 4: Total Received */}
        <div 
          onClick={() => changeTab('accounts')}
          className="glass-panel p-5 rounded-3xl border border-white shadow-sm cursor-pointer hover:shadow-md transition-all hover:translate-y-[-2px]"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-500 text-xs font-bold">إجمالي المبالغ المستلمة</span>
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <CircleDollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-black text-[#0F2742]">{totalReceived.toLocaleString()}</h3>
            <span className="text-[10px] font-bold text-gray-400">ر.س</span>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div id="main-dashboard-grid" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Right Section: Recent Transactions & AI Smart Summary */}
        <div className="lg:col-span-8 space-y-6">
          {/* Smart Daily Summary Box */}
          <div id="smart-daily-summary-box" className="glass-panel-dark text-white p-6 rounded-3xl shadow-xl">
            <h4 className="text-md font-bold mb-4 flex items-center gap-2">
              <span className="w-2.5 h-6 bg-[#23B78D] rounded-full"></span>
              ملخص اليوم الذكي
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div 
                onClick={handleViewActiveTransactions}
                className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all cursor-pointer flex items-start gap-3"
              >
                <div className="w-8 h-8 bg-[#1597B8]/20 rounded-xl flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-[#1597B8]" />
                </div>
                <div>
                  <p className="text-white/60 text-xs">تحديثات مطلوبة</p>
                  <p className="font-bold text-white mt-0.5">لديك {activeTransactions.length} معاملات تحتاج متابعة وسير عمل</p>
                </div>
              </div>

              <div 
                onClick={handleViewExpiringDocs}
                className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all cursor-pointer flex items-start gap-3"
              >
                <div className="w-8 h-8 bg-[#23B78D]/20 rounded-xl flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-[#23B78D]" />
                </div>
                <div>
                  <p className="text-white/60 text-xs">مستندات قاربت على الانتهاء</p>
                  <p className="font-bold text-[#23B78D] mt-0.5">
                    {expiringDocuments.length === 0 
                      ? 'لا توجد مستندات منتهية حالياً' 
                      : `${expiringDocuments.length} مستندات تنتهي خلال 15 يوماً`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Transactions List */}
          <div id="recent-transactions-panel" className="glass-panel p-6 rounded-3xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-black text-[#0F2742]">أحدث المعاملات المضافة</h4>
              <button 
                onClick={() => {
                  setTransactionFilter?.({});
                  changeTab('transactions');
                }}
                className="text-xs text-[#1597B8] font-bold flex items-center gap-1 hover:underline"
              >
                عرض كل المعاملات <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {transactions.slice(0, 4).map(tx => {
                const client = clients.find(c => c.id === tx.clientId);
                return (
                  <div 
                    key={tx.id}
                    className="bg-white p-4 rounded-2xl flex items-center justify-between border border-gray-100 shadow-xs hover:border-[#1597B8]/30 transition-all"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 rounded-full bg-[#1597B8]/10 flex items-center justify-center text-[#1597B8] shrink-0">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-bold text-sm text-[#0F2742] truncate">{tx.title}</p>
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                          العميل: {client?.fullName} • {tx.referenceNumber}
                        </p>
                      </div>
                    </div>

                    <div className="text-left shrink-0">
                      {tx.status === 'completed' && (
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#23B78D]/10 text-[#23B78D]">
                          مكتملة
                        </span>
                      )}
                      {tx.status === 'in_progress' && (
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#1597B8]/10 text-[#1597B8]">
                          تحت الإجراء
                        </span>
                      )}
                      {tx.status === 'waiting_docs' && (
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600">
                          نقص مستندات
                        </span>
                      )}
                      {tx.status === 'new' && (
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600">
                          جديدة
                        </span>
                      )}
                      {tx.status !== 'completed' && tx.status !== 'in_progress' && tx.status !== 'waiting_docs' && tx.status !== 'new' && (
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-gray-500/10 text-gray-600">
                          {tx.status === 'cancelled' ? 'ملغاة' : tx.status === 'needs_review' ? 'تحتاج مراجعة' : 'معلقة'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Left Section: Calendar and Outstanding Financial Summary */}
        <div className="lg:col-span-4 space-y-6">
          {/* Today's Tasks & Meetings */}
          <div id="today-tasks-box" className="glass-panel p-6 rounded-3xl shadow-sm">
            <h4 className="text-md font-bold mb-4 flex items-center gap-2 text-[#0F2742]">
              <Calendar className="w-5 h-5 text-[#1597B8]" />
              مهام ومواعيد اليوم
            </h4>

            <div className="space-y-4">
              {tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').slice(0, 3).map(task => (
                <div key={task.id} className="flex gap-3 items-start p-2 hover:bg-white/50 rounded-xl transition-all">
                  <div className="w-10 h-10 bg-[#F7F9FC] rounded-xl flex items-center justify-center border border-gray-100 shrink-0">
                    {getTaskIcon(task.taskType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[#0F2742] truncate">{task.title}</p>
                    <p className="text-[10px] text-gray-400 truncate mt-0.5">
                      تاريخ الاستحقاق: {task.dueDate.split('T')[0]}
                    </p>
                  </div>
                  <button 
                    onClick={() => completeTask(task.id, 'completed')}
                    title="تحديد كمكتمل"
                    className="w-6 h-6 rounded-full bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center text-emerald-600 hover:text-emerald-700 transition-all shrink-0 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length === 0 && (
                <div className="text-center py-6 text-gray-400 text-xs">
                  لا توجد مهام نشطة لليوم!
                </div>
              )}
            </div>

            <button 
              onClick={() => openQuickAction('task')}
              className="w-full mt-4 py-3 border-2 border-dashed border-gray-200 hover:border-[#1597B8]/30 rounded-2xl text-gray-400 hover:text-[#1597B8] text-xs font-bold hover:bg-white/50 transition-all cursor-pointer"
            >
              + إضافة مهمة جديدة
            </button>
          </div>

          {/* Financial Liability Panel */}
          <div id="financial-liabilities-panel" className="bg-gradient-to-br from-[#1597B8] to-[#0F2742] p-6 rounded-3xl text-white shadow-xl shadow-[#1597B8]/20">
            <p className="text-white/70 text-xs font-bold">المستحقات المالية المتبقية لدى العملاء</p>
            <p className="text-3xl font-black mt-1 mb-3">
              {totalRemaining.toLocaleString()} <span className="text-sm font-normal">ر.س</span>
            </p>
            <div className="flex items-center justify-between">
              <span className="text-[10px] bg-white/20 px-3 py-1 rounded-full font-bold">
                {remainingClientsCount} عملاء لديهم مبالغ غير مسددة
              </span>
              <button 
                onClick={() => changeTab('accounts')}
                className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
