import React, { lazy, Suspense, useEffect, useState } from 'react';
import { AppProvider, useApp } from './AppContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { AppDocument, AppNotification } from './types';

const Dashboard = lazy(() => import('./components/Dashboard').then(module => ({ default: module.Dashboard })));
const Clients = lazy(() => import('./components/Clients').then(module => ({ default: module.Clients })));
const Transactions = lazy(() => import('./components/Transactions').then(module => ({ default: module.Transactions })));
const Templates = lazy(() => import('./components/Templates').then(module => ({ default: module.Templates })));
const Documents = lazy(() => import('./components/Documents').then(module => ({ default: module.Documents })));
const Tasks = lazy(() => import('./components/Tasks').then(module => ({ default: module.Tasks })));
const Accounts = lazy(() => import('./components/Accounts').then(module => ({ default: module.Accounts })));
const ActivityLog = lazy(() => import('./components/ActivityLog').then(module => ({ default: module.ActivityLog })));

import { 
  Plus, 
  Sparkles, 
  Layers, 
  X, 
  UserPlus, 
  BriefcaseConveyorBelt, 
  FilePlus, 
  Zap, 
  DollarSign 
} from 'lucide-react';

function AppContent() {
  const { 
    currentTab, 
    setCurrentTab, 
    currentUser, 
    clients, 
    addClient, 
    addTransaction, 
    templates, 
    addTransactionPayment,
    transactions,
    addTask,
    users
  } = useApp();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quickActionModal, setQuickActionModal] = useState<string | null>(null); // 'client' | 'transaction' | 'payment' | 'task'
  const [passedTemplateId, setPassedTemplateId] = useState<string | undefined>(undefined);

  const [transactionFilter, setTransactionFilter] = useState<any>(null);
  const [documentFilter, setDocumentFilter] = useState<any>(null);
  const [taskFilter, setTaskFilter] = useState<any>(null);

  const handleNotificationNavigate = (notification: AppNotification) => {
    let destination = '';
    let filter = '';

    if (notification.actionUrl?.startsWith('/')) {
      const target = new URL(notification.actionUrl, window.location.origin);
      destination = target.pathname.replace(/^\//, '');
      filter = target.searchParams.get('filter') || '';
    }

    // `type` supports notifications created before the API normalized this field.
    const notificationType = notification.notificationType || notification.type as AppNotification['notificationType'] | undefined;
    if (!destination) {
      if (notificationType === 'expiry') destination = 'documents';
      else if (notificationType === 'overdue_task') destination = 'tasks';
      else if (notificationType === 'payment_due') destination = 'accounts';
      else destination = 'transactions';
    }

    if (destination === 'documents') {
      setDocumentFilter({ expiring: filter === 'expiring' || notificationType === 'expiry', notificationId: notification.id });
      setCurrentTab('documents');
    } else if (destination === 'tasks') {
      setTaskFilter({ overdue: filter === 'overdue' || notificationType === 'overdue_task', notificationId: notification.id });
      setCurrentTab('tasks');
    } else if (destination === 'accounts') {
      setCurrentTab('accounts');
    } else {
      setTransactionFilter({ followUp: filter === 'follow-up' || notificationType === 'overdue_transaction', notificationId: notification.id });
      setCurrentTab('transactions');
    }
  };

  const handleDocumentProcedure = (document: AppDocument) => {
    const linkedTransaction = document.transactionId
      ? transactions.find(transaction => transaction.id === document.transactionId)
      : undefined;

    if (linkedTransaction) {
      setTransactionFilter({ openTransactionId: linkedTransaction.id, sourceDocumentId: document.id });
      setCurrentTab('transactions');
      return;
    }

    setQtClientId(document.clientId || '');
    setQtTitle(`تجديد مستند: ${document.fileName.replace(/\.[^.]+$/, '')}`);
    setQuickActionModal('transaction');
  };

  useEffect(() => {
    const closeOverlays = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setSidebarOpen(false);
      setQuickActionModal(null);
    };
    window.addEventListener('keydown', closeOverlays);
    return () => window.removeEventListener('keydown', closeOverlays);
  }, []);

  // Form states for Quick Actions
  const [qcName, setQcName] = useState('');
  const [qcPhone, setQcPhone] = useState('');
  const [qcEmail, setQcEmail] = useState('');
  const [qcType, setQcType] = useState<'individual' | 'company'>('individual');
  const [qcNotes, setQcNotes] = useState('');

  const [qtTitle, setQtTitle] = useState('');
  const [qtClientId, setQtClientId] = useState('');
  const [qtTemplateId, setQtTemplateId] = useState('');
  const [qtCustomFee, setQtCustomFee] = useState('');
  const [qtCustomGovFee, setQtCustomGovFee] = useState('');

  const [qpTxId, setQpTxId] = useState('');
  const [qpAmount, setQpAmount] = useState('');
  const [qpMethod, setQpMethod] = useState<'cash' | 'bank_transfer' | 'network'>('cash');
  const [qpRef, setQpRef] = useState('');

  const [qkTaskTitle, setQkTaskTitle] = useState('');
  const [qkTaskDueDate, setQkTaskDueDate] = useState('');
  const [qkTaskPriority, setQkTaskPriority] = useState<'low' | 'normal' | 'high'>('normal');
  const [qkTaskAssigned, setQkTaskAssigned] = useState('');

  const handleOpenQuickAction = (action: string, templateId?: string) => {
    if (action === 'transaction' && templateId) {
      const tmpl = templates.find(t => t.id === templateId);
      if (tmpl) {
        setQtTemplateId(templateId);
        setQtTitle(tmpl.name);
        setQtCustomFee(String(tmpl.defaultServiceFee));
        setQtCustomGovFee(String(tmpl.defaultGovernmentFee));
      }
    }
    setQuickActionModal(action);
  };

  const handleCreateQuickClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qcName || !qcPhone) return;

    addClient({
      fullName: qcName,
      phone: qcPhone,
      email: qcEmail || undefined,
      clientType: qcType,
      notes: qcNotes || undefined,
      commercialRegister: qcType === 'company' ? '1010' + Math.floor(100000 + Math.random() * 900000) : undefined
    });

    setQuickActionModal(null);
    setQcName('');
    setQcPhone('');
    setQcEmail('');
    setQcNotes('');
    setCurrentTab('clients');
  };

  const handleCreateQuickTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qtTitle || !qtClientId) return;

    // Resolve template defaults or customs
    let serviceFee = 500;
    let govFee = 200;
    let steps: string[] = [];
    let docs: string[] = [];

    const tmpl = templates.find(t => t.id === (qtTemplateId || passedTemplateId));
    if (tmpl) {
      serviceFee = Number(qtCustomFee) || tmpl.defaultServiceFee;
      govFee = Number(qtCustomGovFee) || tmpl.defaultGovernmentFee;
      steps = tmpl.checklistSteps;
      docs = tmpl.requiredDocuments;
    }

    addTransaction({
      title: qtTitle,
      clientId: qtClientId,
      serviceTemplateId: qtTemplateId || undefined,
      serviceFee,
      governmentFee: govFee,
      customChecklistSteps: steps.length > 0 ? steps : undefined,
      customRequiredDocuments: docs.length > 0 ? docs : undefined
    });

    setQuickActionModal(null);
    setQtTitle('');
    setQtClientId('');
    setQtTemplateId('');
    setQtCustomFee('');
    setQtCustomGovFee('');
    setCurrentTab('transactions');
  };

  const handleCreateQuickPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qpTxId || !qpAmount) return;

    addTransactionPayment(qpTxId, {
      amount: Number(qpAmount),
      paymentMethod: qpMethod,
      referenceNumber: qpRef || undefined,
      paymentDate: new Date().toISOString().split('T')[0]
    });

    setQuickActionModal(null);
    setQpTxId('');
    setQpAmount('');
    setQpRef('');
    setCurrentTab('accounts');
  };

  const renderActiveTab = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <Dashboard 
            setCurrentTab={setCurrentTab}
            setTransactionFilter={setTransactionFilter}
            setDocumentFilter={setDocumentFilter}
            openQuickAction={handleOpenQuickAction} 
          />
        );
      case 'clients':
        return <Clients />;
      case 'transactions':
        return <Transactions initialFilter={transactionFilter} openQuickAction={handleOpenQuickAction} />;
      case 'templates':
        return <Templates openQuickAction={handleOpenQuickAction} />;
      case 'documents':
        return <Documents initialFilter={documentFilter} onContinueProcedure={handleDocumentProcedure} />;
      case 'tasks':
        return <Tasks initialFilter={taskFilter} />;
      case 'accounts':
        return <Accounts />;
      case 'activity':
        return <ActivityLog />;
      default:
        return (
          <Dashboard 
            setCurrentTab={setCurrentTab}
            setTransactionFilter={setTransactionFilter}
            setDocumentFilter={setDocumentFilter}
            openQuickAction={handleOpenQuickAction} 
          />
        );
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F7F9FC]" dir="rtl">
      {/* Sidebar - Navigation panel with Role simulation */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Container Area */}
      <div className="flex flex-col flex-1 h-full overflow-hidden" inert={sidebarOpen ? true : undefined}>
        {/* Header - Alerts, warning banners, real-time clock */}
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onNotificationNavigate={handleNotificationNavigate} />

        {/* Dynamic scrollable canvas with high contrast Frosted Glass accents */}
        <main id="main-content" className="flex-1 overflow-y-auto p-4 md:p-8 bg-linear-to-b from-[#F7F9FC] to-[#EFF2F6]">
          <Suspense fallback={
            <div className="flex min-h-64 flex-col items-center justify-center text-[#0F2742]" role="status" aria-live="polite">
              <div className="mb-3 h-10 w-10 animate-spin rounded-full border-4 border-[#1597B8] border-t-transparent" />
              <p className="text-sm font-bold">جاري فتح الصفحة...</p>
            </div>
          }>
            {renderActiveTab()}
          </Suspense>
        </main>
      </div>

      {/* FLOATING ACTION TRIGGER BAR FOR HIGHEST PRODUCTIVITY */}
      {currentUser.role !== 'viewer' && (
        <div className="fixed bottom-6 left-6 z-40 flex items-center gap-2 font-sans" dir="rtl">
          {/* Quick Transaction Action */}
          <button 
            onClick={() => handleOpenQuickAction('transaction')}
            className="w-12 h-12 bg-[#1597B8] text-white rounded-full flex items-center justify-center hover:bg-cyan-600 shadow-lg shadow-[#1597B8]/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title="إطلاق معاملة سريعة"
          >
            <Zap className="w-5 h-5" />
          </button>

          {/* Quick Client Action */}
          <button 
            onClick={() => handleOpenQuickAction('client')}
            className="w-12 h-12 bg-[#0F2742] text-white rounded-full flex items-center justify-center hover:bg-[#1a3a5e] shadow-lg shadow-[#0F2742]/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title="إضافة عميل سريع"
          >
            <UserPlus className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* QUICK CLIENT MODAL */}
      {quickActionModal === 'client' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative text-right">
            <button onClick={() => setQuickActionModal(null)} className="absolute top-4 left-4 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            <h3 className="text-lg font-black text-[#0F2742] mb-1">إضافة عميل سريع</h3>
            <p className="text-xs text-gray-400 mb-6">سجل بيانات التواصل بسرعة لإطلاق معامليته القياسية.</p>

            <form onSubmit={handleCreateQuickClient} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">الاسم الكامل *</label>
                <input 
                  type="text" required placeholder="مثال: خالد بن عبد الله العتيبي"
                  value={qcName} onChange={(e) => setQcName(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">رقم الجوال النشط *</label>
                <input 
                  type="text" required placeholder="مثال: 0551234567"
                  value={qcPhone} onChange={(e) => setQcPhone(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">البريد الإلكتروني (اختياري)</label>
                <input 
                  type="email" placeholder="client@example.com"
                  value={qcEmail} onChange={(e) => setQcEmail(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">نوع العميل *</label>
                <select 
                  value={qcType} onChange={(e) => setQcType(e.target.value as any)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none"
                >
                  <option value="individual">فرد (مواطن / مقيم)</option>
                  <option value="company">شركة / مؤسسة تجارية</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setQuickActionModal(null)} className="px-4 py-2 text-xs font-bold text-gray-400 bg-gray-50 hover:bg-gray-100 rounded-xl">إلغاء</button>
                <button type="submit" className="px-5 py-2 text-xs font-bold text-white bg-[#0F2742] hover:bg-[#1a3a5e] rounded-xl shadow-lg">حفظ العميل</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK TRANSACTION MODAL */}
      {quickActionModal === 'transaction' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative text-right">
            <button onClick={() => setQuickActionModal(null)} className="absolute top-4 left-4 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            <h3 className="text-lg font-black text-[#0F2742] mb-1">إطلاق معاملة جديدة</h3>
            <p className="text-xs text-gray-400 mb-6 font-bold">ربط العميل بقالب الخدمة وسير العمل التلقائي الخاص به.</p>

            <form onSubmit={handleCreateQuickTransaction} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">العميل المستفيد *</label>
                <select 
                  required value={qtClientId} onChange={(e) => setQtClientId(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none"
                >
                  <option value="">اختر عميل من القائمة...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">قالب الخدمة القياسي (اختياري)</label>
                <select 
                  value={qtTemplateId} 
                  onChange={(e) => {
                    const val = e.target.value;
                    setQtTemplateId(val);
                    const tmpl = templates.find(t => t.id === val);
                    if (tmpl) {
                      setQtTitle(tmpl.name);
                      setQtCustomFee(String(tmpl.defaultServiceFee));
                      setQtCustomGovFee(String(tmpl.defaultGovernmentFee));
                    }
                  }}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none"
                >
                  <option value="">تأسيس يدوي بدون قالب...</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">عنوان المعاملة *</label>
                <input 
                  type="text" required placeholder="مثال: نقل كفالة السائق، تجديد السجل التجاري"
                  value={qtTitle} onChange={(e) => setQtTitle(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none"
                />
              </div>

              {qtTemplateId && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-cyan-50/20 border border-cyan-100 rounded-2xl">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-0.5">أتعاب سعي المكتب (ر.س)</label>
                    <input 
                      type="number" value={qtCustomFee} onChange={(e) => setQtCustomFee(e.target.value)}
                      className="w-full p-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-0.5">الرسوم الحكومية (ر.س)</label>
                    <input 
                      type="number" value={qtCustomGovFee} onChange={(e) => setQtCustomGovFee(e.target.value)}
                      className="w-full p-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setQuickActionModal(null)} className="px-4 py-2 text-xs font-bold text-gray-400 bg-gray-50 hover:bg-gray-100 rounded-xl">إلغاء</button>
                <button type="submit" className="px-5 py-2 text-xs font-bold text-white bg-[#1597B8] hover:bg-cyan-600 rounded-xl shadow-lg">إطلاق المعاملة</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK PAYMENT MODAL */}
      {quickActionModal === 'payment' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative text-right font-sans" dir="rtl">
            <button onClick={() => setQuickActionModal(null)} className="absolute top-4 left-4 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            <h3 className="text-lg font-black text-[#0F2742] mb-1">تسجيل دفعة مالية سريعة</h3>
            <p className="text-xs text-gray-400 mb-6">تسجيل دفعة كاش أو تحويل بنكي لمعاملة قائمة.</p>

            <form onSubmit={handleCreateQuickPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">المعاملة المستهدفة *</label>
                <select 
                  required value={qpTxId} onChange={(e) => setQpTxId(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none"
                >
                  <option value="">اختر المعاملة...</option>
                  {transactions.filter(t => t.remainingAmount > 0).map(t => (
                    <option key={t.id} value={t.id}>{t.title} ({t.referenceNumber}) - متبقي: {t.remainingAmount} ر.س</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">المبلغ المستلم (ر.س) *</label>
                <input 
                  type="number" required min="1" placeholder="المبلغ بالريال..."
                  value={qpAmount} onChange={(e) => setQpAmount(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">طريقة الدفع *</label>
                <select 
                  value={qpMethod} onChange={(e) => setQpMethod(e.target.value as any)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none"
                >
                  <option value="cash">نقداً (كاش)</option>
                  <option value="bank_transfer">تحويل بنكي</option>
                  <option value="network">شبكة / مدى</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">الرقم المرجعي / رقم الحوالة (اختياري)</label>
                <input 
                  type="text" placeholder="مثال: REF-99210"
                  value={qpRef} onChange={(e) => setQpRef(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setQuickActionModal(null)} className="px-4 py-2 text-xs font-bold text-gray-400 bg-gray-50 hover:bg-gray-100 rounded-xl">إلغاء</button>
                <button type="submit" className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg">تسجيل الدفعة</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK TASK MODAL */}
      {quickActionModal === 'task' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative text-right font-sans" dir="rtl">
            <button onClick={() => setQuickActionModal(null)} className="absolute top-4 left-4 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            <h3 className="text-lg font-black text-[#0F2742] mb-1">إضافة مهمة جديدة</h3>
            <p className="text-xs text-gray-400 mb-6">جدولة مهمة جديدة ومتابعتها في التقويم.</p>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (!qkTaskTitle) return;
              addTask({
                title: qkTaskTitle,
                dueDate: qkTaskDueDate || new Date().toISOString().slice(0, 16),
                startDate: new Date().toISOString().slice(0, 16),
                priority: qkTaskPriority,
                assignedUserId: qkTaskAssigned || undefined,
                taskType: 'general'
              });
              setQuickActionModal(null);
              setQkTaskTitle('');
              setQkTaskDueDate('');
              setCurrentTab('tasks');
            }} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">عنوان المهمة *</label>
                <input 
                  type="text" required placeholder="مثال: مراجعة المرور، الاتصال بالعميل"
                  value={qkTaskTitle} onChange={(e) => setQkTaskTitle(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">تاريخ الاستحقاق *</label>
                <input 
                  type="datetime-local" required
                  value={qkTaskDueDate} onChange={(e) => setQkTaskDueDate(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">الموظف المسؤول (اختياري)</label>
                <select 
                  value={qkTaskAssigned} onChange={(e) => setQkTaskAssigned(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none"
                >
                  <option value="">اختر الموظف...</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">الأولوية</label>
                <select 
                  value={qkTaskPriority} onChange={(e) => setQkTaskPriority(e.target.value as any)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none"
                >
                  <option value="low">منخفضة</option>
                  <option value="normal">عادية</option>
                  <option value="high">عالية</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setQuickActionModal(null)} className="px-4 py-2 text-xs font-bold text-gray-400 bg-gray-50 hover:bg-gray-100 rounded-xl">إلغاء</button>
                <button type="submit" className="px-5 py-2 text-xs font-bold text-white bg-[#1597B8] hover:bg-cyan-600 rounded-xl shadow-lg">حفظ المهمة</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
