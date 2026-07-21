import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { Payment, Expense, Transaction } from '../types';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Plus, 
  Printer, 
  ExternalLink, 
  Search, 
  CircleDollarSign, 
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  MessageCircle,
  X
} from 'lucide-react';

export const Accounts: React.FC = () => {
  const { 
    payments, 
    expenses, 
    transactions, 
    clients, 
    addTransactionPayment, 
    addExpense, 
    currentUser 
  } = useApp();

  const isReadOnly = currentUser.role === 'viewer';
  const isEmployee = currentUser.role === 'employee';

  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);

  // Expense form state
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState('مصروفات معاملات');
  const [expTxId, setExpTxId] = useState('');

  // Calculations
  const totalReceived = payments.reduce((acc, p) => acc + Number(p.amount), 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + Number(e.amount), 0);
  
  // Total profit = total received - total government fees - total expenses
  const totalGovFeesPaid = transactions.reduce((acc, t) => {
    // If completed or in progress with received amount, calculate portion or full government fees
    if (t.status === 'completed') {
      return acc + t.governmentFee;
    }
    return acc;
  }, 0);

  const netBalance = totalReceived - totalExpenses;

  // Filters
  const filteredPayments = payments.filter(p => {
    const tx = transactions.find(t => t.id === p.transactionId);
    const client = tx ? clients.find(c => c.id === tx.clientId) : null;
    const matchesSearch = (client && client.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (tx && tx.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (p.referenceNumber && p.referenceNumber.includes(searchTerm));
    const matchesMethod = paymentMethodFilter === 'all' ? true : p.paymentMethod === paymentMethodFilter;
    return matchesSearch && matchesMethod;
  });

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle || !expAmount) return;

    addExpense({
      title: expTitle,
      amount: Number(expAmount),
      expenseDate: new Date().toISOString().split('T')[0],
      category: expCategory,
      transactionId: expTxId || undefined
    });

    // Reset Form
    setShowAddExpense(false);
    setExpTitle('');
    setExpAmount('');
    setExpCategory('مصروفات معاملات');
    setExpTxId('');
  };

  const generateReceiptWhatsApp = (p: Payment) => {
    const tx = transactions.find(t => t.id === p.transactionId);
    const client = tx ? clients.find(c => c.id === tx.clientId) : null;
    if (!client) return '#';

    // Format phone
    let phoneNum = client.phone;
    if (phoneNum.startsWith('05')) {
      phoneNum = '966' + phoneNum.slice(1);
    }

    const message = `السلام عليكم ورحمة الله وبركاته، أخي العزيز ${client.fullName}.\n\nنشكركم لسداد مبلغ وقدره (*${p.amount} ريال*) لقاء المعاملة رقم (${tx?.referenceNumber}) بتاريخ ${p.paymentDate}.\n\n- وسيلة الدفع: ${p.paymentMethod === 'cash' ? 'كاش' : (p.paymentMethod === 'bank_transfer' ? 'تحويل بنكي' : 'شبكة')}\n- متبقي على المعاملة: ${tx?.remainingAmount} ريال.\n\nتم تسجيل السند بنجاح في نظام رتّب الذكي.`;
    return `https://wa.me/${phoneNum}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#0F2742]">الدفاتر المالية والحسابات</h2>
          <p className="text-gray-500 text-xs mt-1">
            صيانة الإيرادات والمصروفات ودفتر القيود المالي للمكتب لضمان الرقابة والامتثال والشفافية.
          </p>
        </div>
        {!isReadOnly && !isEmployee && (
          <button 
            onClick={() => setShowAddExpense(true)}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl flex items-center gap-2 shadow-lg shadow-red-500/10 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            تسجيل مصروفات جديدة
          </button>
        )}
      </div>

      {/* Financial Overview Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1: Total Received */}
        <div className="glass-panel p-5 rounded-3xl border border-white shadow-sm flex justify-between items-center">
          <div>
            <p className="text-gray-500 text-xs font-bold">إجمالي المقبوضات (الإيراد الكلي)</p>
            <p className="text-2xl font-black text-emerald-600 mt-1 font-mono">+{totalReceived.toLocaleString()} <span className="text-xs font-normal">ر.س</span></p>
            <span className="text-[10px] text-gray-400 mt-1 block">كل المبالغ المستلمة من الدفعات</span>
          </div>
          <div className="w-10 h-10 bg-emerald-500/10 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2: Total Expenses */}
        <div className="glass-panel p-5 rounded-3xl border border-white shadow-sm flex justify-between items-center">
          <div>
            <p className="text-gray-500 text-xs font-bold">إجمالي المصروفات التشغيلية</p>
            <p className="text-2xl font-black text-red-600 mt-1 font-mono">-{totalExpenses.toLocaleString()} <span className="text-xs font-normal">ر.س</span></p>
            <span className="text-[10px] text-gray-400 mt-1 block">شامل رسوم الفحوصات والبلدية ومشتريات المكتب</span>
          </div>
          <div className="w-10 h-10 bg-red-500/10 text-red-600 rounded-2xl flex items-center justify-center shrink-0">
            <ArrowDownRight className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3: Profit Balance */}
        <div className="glass-panel p-5 rounded-3xl border border-white shadow-sm flex justify-between items-center">
          <div>
            <p className="text-gray-500 text-xs font-bold">رصيد الحساب المالي (الصافي المحلي)</p>
            <p className="text-2xl font-black text-[#0F2742] mt-1 font-mono">{netBalance.toLocaleString()} <span className="text-xs font-normal">ر.س</span></p>
            <span className="text-[10px] text-gray-400 mt-1 block">الرصيد المتوفر بعد حسم المصروفات</span>
          </div>
          <div className="w-10 h-10 bg-[#1597B8]/10 text-[#1597B8] rounded-2xl flex items-center justify-center shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main ledger and search section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Historic Receipts list */}
        <div className="lg:col-span-8 space-y-4">
          <div className="glass-panel p-5 rounded-3xl border border-white shadow-sm space-y-4">
            <h3 className="text-sm font-black text-[#0F2742] flex items-center gap-1.5">
              <CircleDollarSign className="w-4.5 h-4.5 text-[#1597B8]" />
              قيود وسجلات الدفع المقبوضة
            </h3>

            {/* Quick Filters */}
            <div className="flex flex-col sm:flex-row gap-2.5 text-xs">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="ابحث باسم المودع أو المعاملة أو رقم السند..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-10 pl-4 py-2 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white text-xs"
                />
              </div>

              <select 
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none text-xs"
              >
                <option value="all">كل طرق الدفع</option>
                <option value="cash">نقداً (كاش)</option>
                <option value="bank_transfer">تحويل بنكي</option>
                <option value="network">مدى / شبكة</option>
              </select>
            </div>

            {/* List */}
            <div className="space-y-2.5">
              {filteredPayments.map(pay => {
                const tx = transactions.find(t => t.id === pay.transactionId);
                const client = tx ? clients.find(c => c.id === tx.clientId) : null;

                return (
                  <div key={pay.id} className="p-3 bg-white border border-gray-100 rounded-2xl flex items-center justify-between text-xs hover:border-[#1597B8]/20 transition-all">
                    <div>
                      <p className="font-bold text-[#0F2742]">{tx ? tx.title : 'قيد مالي مباشر'}</p>
                      <p className="text-[10px] text-gray-400 mt-1">العميل: {client?.fullName} • المحصل: {pay.recordedBy}</p>
                      <p className="text-[9px] font-mono text-gray-400 mt-0.5">التاريخ: {pay.paymentDate} {pay.referenceNumber && `• رقم الحوالة: ${pay.referenceNumber}`}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-left">
                        <span className="font-black text-emerald-600 block font-mono">+{pay.amount} ر.س</span>
                        <span className="text-[9px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-bold">
                          {pay.paymentMethod === 'cash' ? 'كاش' : (pay.paymentMethod === 'bank_transfer' ? 'تحويل' : 'شبكة')}
                        </span>
                      </div>

                      {/* Receipt printing simulation and Whatsapp link */}
                      <div className="flex flex-col gap-1">
                        <button 
                          onClick={() => setSelectedReceipt(pay)}
                          className="p-1.5 hover:bg-gray-100 text-gray-500 hover:text-[#0F2742] rounded-lg"
                          title="طباعة سند القبض"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <a 
                          href={generateReceiptWhatsApp(pay)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg"
                          title="إرسال إيصال بالواتساب"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredPayments.length === 0 && (
                <p className="text-center py-12 text-gray-400 text-xs bg-gray-50/20 rounded-2xl">
                  لا توجد قيود قبض مطابقة للبحث حالياً.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Expenses List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-panel p-5 rounded-3xl border border-white shadow-sm space-y-4">
            <h3 className="text-sm font-black text-red-600 flex items-center gap-1.5">
              <TrendingDown className="w-4.5 h-4.5 text-red-500" />
              أحدث المصروفات والمدفوعات
            </h3>

            <div className="space-y-3">
              {expenses.map(exp => {
                const tx = transactions.find(t => t.id === exp.transactionId);
                return (
                  <div key={exp.id} className="p-3 bg-red-50/20 border border-red-100/50 rounded-2xl text-xs">
                    <div className="flex justify-between items-start">
                      <p className="font-bold text-[#0F2742]">{exp.title}</p>
                      <span className="font-mono font-black text-red-600">-{exp.amount} ر.س</span>
                    </div>
                    <p className="text-[9px] text-gray-400 mt-1">الفئة: {exp.category} • تاريخ الصرف: {exp.expenseDate}</p>
                    {tx && <p className="text-[8px] text-[#1597B8] font-bold mt-0.5 truncate">مرتبط بالمعاملة: {tx.referenceNumber}</p>}
                  </div>
                );
              })}

              {expenses.length === 0 && (
                <p className="text-center py-6 text-gray-400 text-xs">لا توجد مصروفات مسجلة.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Simulated Receipt Printing Modal */}
      {selectedReceipt && (() => {
        const tx = transactions.find(t => t.id === selectedReceipt.transactionId);
        const client = tx ? clients.find(c => c.id === tx.clientId) : null;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative text-right text-xs" dir="rtl">
              <button 
                onClick={() => setSelectedReceipt(null)}
                className="absolute top-4 left-4 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Receipt Body */}
              <div id="print-receipt" className="p-4 border-2 border-dashed border-gray-200 rounded-2xl space-y-4">
                <div className="text-center border-b border-gray-100 pb-3">
                  <h3 className="text-lg font-black text-[#0F2742]">سند قبض رسمي</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">رتّب – مكتب المعقّب والخدمات الذكي</p>
                  <p className="text-[9px] font-mono text-gray-400">رقم السند: REC-{selectedReceipt.id.slice(-6)}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">تاريخ السداد:</span>
                    <span className="font-bold text-[#0F2742]">{selectedReceipt.paymentDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">استلمنا من العميل:</span>
                    <span className="font-bold text-[#0F2742]">{client?.fullName || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">بشأن معاملة:</span>
                    <span className="font-bold text-[#0F2742] truncate max-w-[200px]">{tx?.title || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">طريقة الدفع:</span>
                    <span className="font-bold text-[#0F2742]">{selectedReceipt.paymentMethod === 'cash' ? 'كاش نقدي' : (selectedReceipt.paymentMethod === 'bank_transfer' ? 'تحويل بنكي' : 'شبكة مدى')}</span>
                  </div>
                  {selectedReceipt.referenceNumber && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">رقم العملية/التحويل:</span>
                      <span className="font-mono text-gray-500">{selectedReceipt.referenceNumber}</span>
                    </div>
                  )}
                </div>

                <div className="bg-[#1597B8]/5 p-3 rounded-xl border border-[#1597B8]/10 text-center">
                  <p className="text-gray-500 text-[10px] font-bold">المبلغ المقبوض النهائي</p>
                  <p className="text-2xl font-black text-[#1597B8] font-mono mt-1">{selectedReceipt.amount} ر.س</p>
                </div>

                <div className="flex justify-between text-[8px] text-gray-400 pt-3 border-t border-gray-100">
                  <span>المحاسب المسؤول: {selectedReceipt.recordedBy}</span>
                  <span>ختم إلكتروني موثق</span>
                </div>
              </div>

              <div className="flex gap-2 justify-end mt-4">
                <button 
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-[#0F2742] text-white rounded-xl font-bold text-xs flex items-center gap-1.5 hover:bg-[#162f4c]"
                >
                  <Printer className="w-4 h-4" />
                  طباعة الإيصال
                </button>
                <button 
                  onClick={() => setSelectedReceipt(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-500 rounded-xl text-xs font-bold"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Record Expense Modal */}
      {showAddExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <button 
              onClick={() => setShowAddExpense(false)}
              className="absolute top-4 left-4 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-[#0F2742] mb-1">تسجيل قيد مصروفات جديد</h3>
            <p className="text-xs text-gray-400 mb-6">يرجى تسجيل تفاصيل الصرف وقيمة الفواتير بدقة.</p>

            <form onSubmit={handleSaveExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">اسم البند / الفاتورة *</label>
                <input 
                  type="text" 
                  required
                  placeholder="مثال: فاتورة كهرباء، فحص سيارة كامري"
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">القيمة الإجمالية (ر.س) *</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    placeholder="القيمة بالريال..."
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">الفئة والتصنيف *</label>
                  <select 
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none"
                  >
                    <option value="مصروفات معاملات">رسوم فحص / بلدية</option>
                    <option value="مصروفات إدارية">إيجار أو كهرباء</option>
                    <option value="مشتريات مكتب">أدوات مكتبية وقرطاسية</option>
                    <option value="أخرى">مصروفات أخرى</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 mb-1">ربط بمعاملة (اختياري)</label>
                  <select 
                    value={expTxId}
                    onChange={(e) => setExpTxId(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none"
                  >
                    <option value="">غير مرتبط بمعاملة</option>
                    {transactions.map(t => (
                      <option key={t.id} value={t.id}>{t.title} ({t.referenceNumber})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setShowAddExpense(false)}
                  className="px-4 py-2.5 text-xs font-bold text-gray-400 bg-gray-50 hover:bg-gray-100"
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-lg"
                >
                  حفظ المصروف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
