import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { Client, Transaction, AppDocument, Payment } from '../types';
import { 
  Search, 
  Plus, 
  Building2, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Archive, 
  Eye, 
  EyeOff, 
  FileText, 
  FolderLock, 
  CreditCard,
  Briefcase,
  History,
  X,
  FileCheck
} from 'lucide-react';
import { motion } from 'motion/react';

interface ClientsProps {
  initialFilter?: any;
}

export const Clients: React.FC<ClientsProps> = ({ initialFilter }) => {
  const { 
    clients, 
    transactions, 
    documents, 
    payments, 
    addClient, 
    updateClient, 
    archiveClient,
    addAuditLog,
    currentUser
  } = useApp();

  const isReadOnly = currentUser.role === 'viewer';
  const canRevealSensitive = currentUser.role === 'owner' || currentUser.role === 'admin';

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [clientTypeFilter, setClientTypeFilter] = useState<'all' | 'individual' | 'company'>('all');
  const [statusFilter, setStatusFilter] = useState<'active' | 'archived'>('active');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  // Create / Edit modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newClientData, setNewClientData] = useState({
    fullName: '',
    clientType: 'individual' as 'individual' | 'company',
    phone: '',
    email: '',
    city: 'الرياض',
    nationalId: '',
    residenceId: '',
    commercialRegister: '',
    companyName: '',
    nationality: 'سعودي',
    notes: ''
  });

  // State to track revealed IDs (for security masking/reveal feature)
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const [revealedValues, setRevealedValues] = useState<Record<string, string>>({});

  // Filters
  const filteredClients = clients.filter(c => {
    const matchesSearch = c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.phone.includes(searchTerm) || 
                          (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = clientTypeFilter === 'all' || c.clientType === clientTypeFilter;
    const matchesStatus = c.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Handle sensitive data reveal with audit logging!
  const toggleRevealId = async (clientId: string, fieldType: 'nationalId' | 'residenceId' | 'commercialRegister', val: string) => {
    const key = `${clientId}-${fieldType}`;
    const willReveal = !revealedIds[key];

    if (willReveal) {
      const response = await fetch(`/api/clients/${clientId}/sensitive?field=${fieldType}`);
      if (!response.ok) return;
      const data = await response.json();
      setRevealedValues(prev => ({ ...prev, [key]: data.value || '' }));
    } else {
      setRevealedValues(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
    
    setRevealedIds(prev => ({ ...prev, [key]: willReveal }));

    if (willReveal) {
      // Log event to secure audit trail
      const label = fieldType === 'nationalId' ? 'الهوية الوطنية' : fieldType === 'residenceId' ? 'رقم الإقامة' : 'السجل التجاري';
      addAuditLog(
        `كشف البيانات الحساسة (${label}) للعميل: ${clients.find(c => c.id === clientId)?.fullName}`,
        'warning',
        `المستخدم ${currentUser.fullName} كشف حقل البيانات الحساس المرمز بقيمة ${val}`
      );
    }
  };

  const getMaskedValue = (clientId: string, fieldType: 'nationalId' | 'residenceId' | 'commercialRegister', val?: string) => {
    if (!val) return '—';
    const key = `${clientId}-${fieldType}`;
    if (revealedIds[key]) return revealedValues[key] || val;
    
    // Mask all but last 4 characters
    if (val.length > 4) {
      return '•'.repeat(val.length - 4) + val.slice(-4);
    }
    return '••••';
  };

  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientData.fullName || !newClientData.phone) return;

    addClient({
      fullName: newClientData.fullName,
      clientType: newClientData.clientType,
      phone: newClientData.phone,
      email: newClientData.email || undefined,
      city: newClientData.city || undefined,
      nationalId: newClientData.nationalId || undefined,
      residenceId: newClientData.residenceId || undefined,
      commercialRegister: newClientData.commercialRegister || undefined,
      companyName: newClientData.clientType === 'company' ? (newClientData.companyName || newClientData.fullName) : undefined,
      nationality: newClientData.nationality || undefined,
      notes: newClientData.notes || undefined
    });

    setShowAddModal(false);
    setNewClientData({
      fullName: '',
      clientType: 'individual',
      phone: '',
      email: '',
      city: 'الرياض',
      nationalId: '',
      residenceId: '',
      commercialRegister: '',
      companyName: '',
      nationality: 'سعودي',
      notes: ''
    });
  };

  // Get single client data for the unified view
  const clientTransactions = selectedClient ? transactions.filter(t => t.clientId === selectedClient.id) : [];
  const clientDocuments = selectedClient ? documents.filter(d => d.clientId === selectedClient.id) : [];
  const clientPayments = selectedClient ? payments.filter(p => {
    const tx = transactions.find(t => t.id === p.transactionId);
    return tx?.clientId === selectedClient.id;
  }) : [];

  return (
    <div className="space-y-6 font-sans">
      {/* Title & Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#0F2742]">إدارة ملفات العملاء</h2>
          <p className="text-gray-500 text-xs mt-1">
            عرض بيانات العملاء ومتابعة معاملاتهم ومستنداتهم في ملف موحد شامل لضمان الشفافية.
          </p>
        </div>
        {!isReadOnly && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 bg-[#1597B8] hover:bg-cyan-600 text-white font-bold text-sm rounded-xl flex items-center gap-2 shadow-lg shadow-[#1597B8]/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            إضافة عميل جديد
          </button>
        )}
      </div>

      {/* Main Grid: Split into sidebar and details or a beautiful list */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Client List with filtering */}
        <div className={`${selectedClient ? 'lg:col-span-4' : 'lg:col-span-12'} space-y-4 transition-all`}>
          {/* Filter Bar */}
          <div className="glass-panel p-4 rounded-3xl shadow-xs space-y-3">
            <div className="relative">
              <Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="البحث باسم العميل أو رقم الجوال..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2.5 bg-white/50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#1597B8] focus:bg-white"
              />
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => setClientTypeFilter('all')}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                  clientTypeFilter === 'all' 
                    ? 'bg-[#0F2742] text-white border-[#0F2742]' 
                    : 'bg-white text-gray-500 border-gray-200'
                }`}
              >
                الكل
              </button>
              <button 
                onClick={() => setClientTypeFilter('individual')}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                  clientTypeFilter === 'individual' 
                    ? 'bg-[#0F2742] text-white border-[#0F2742]' 
                    : 'bg-white text-gray-500 border-gray-200'
                }`}
              >
                أفراد
              </button>
              <button 
                onClick={() => setClientTypeFilter('company')}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                  clientTypeFilter === 'company' 
                    ? 'bg-[#0F2742] text-white border-[#0F2742]' 
                    : 'bg-white text-gray-500 border-gray-200'
                }`}
              >
                مؤسسات/شركات
              </button>
            </div>

            <div className="flex gap-2 border-t border-gray-100 pt-2 text-[10px] text-gray-400 justify-between items-center">
              <span>حالة الملف:</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setStatusFilter('active')}
                  className={`px-2 py-0.5 rounded ${statusFilter === 'active' ? 'bg-[#23B78D]/10 text-[#23B78D] font-bold' : 'text-gray-400'}`}
                >
                  النشطين
                </button>
                <button 
                  onClick={() => setStatusFilter('archived')}
                  className={`px-2 py-0.5 rounded ${statusFilter === 'archived' ? 'bg-red-500/10 text-red-600 font-bold' : 'text-gray-400'}`}
                >
                  المؤرشفين
                </button>
              </div>
            </div>
          </div>

          {/* Client List */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {filteredClients.map(c => (
              <div 
                key={c.id}
                onClick={() => setSelectedClient(c)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  selectedClient?.id === c.id 
                    ? 'bg-gradient-to-l from-white to-[#1597B8]/5 border-[#1597B8] shadow-md' 
                    : 'bg-white border-gray-100 hover:border-gray-200 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      c.clientType === 'company' ? 'bg-blue-50 text-blue-500' : 'bg-emerald-50 text-emerald-500'
                    }`}>
                      {c.clientType === 'company' ? <Building2 className="w-4.5 h-4.5" /> : <User className="w-4.5 h-4.5" />}
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold text-sm text-[#0F2742] truncate">{c.fullName}</p>
                      <p className="text-xs text-gray-400 truncate flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-gray-300" /> {c.phone}
                      </p>
                    </div>
                  </div>
                  <div className="text-left shrink-0">
                    <span className="text-[10px] text-gray-400 block font-mono">{c.city}</span>
                    <span className={`inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      c.clientType === 'company' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      {c.clientType === 'company' ? 'مؤسسة' : 'فرد'}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {filteredClients.length === 0 && (
              <div className="text-center py-12 bg-white rounded-3xl border border-gray-100 text-gray-400 text-xs">
                لا يوجد عملاء يطابقون خيارات البحث.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Unified Client Portfolio */}
        {selectedClient && (
          <div className="lg:col-span-8 space-y-6">
            <div className="glass-panel p-6 rounded-3xl border border-white shadow-sm relative">
              <button 
                onClick={() => setSelectedClient(null)}
                className="absolute top-4 left-4 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Client Profile Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-gray-100 gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-[#1597B8]/10 text-[#1597B8] rounded-2xl flex items-center justify-center font-black text-2xl shadow-inner">
                    {selectedClient.fullName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-[#0F2742] flex items-center gap-2">
                      {selectedClient.fullName}
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        selectedClient.status === 'active' ? 'bg-[#23B78D]/10 text-[#23B78D]' : 'bg-red-500/10 text-red-600'
                      }`}>
                        {selectedClient.status === 'active' ? 'ملف نشط' : 'ملف مؤرشف'}
                      </span>
                    </h3>
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {selectedClient.city}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {selectedClient.phone}</span>
                      {selectedClient.email && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {selectedClient.email}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {!isReadOnly && selectedClient.status === 'active' && (
                  <button 
                    onClick={() => {
                      archiveClient(selectedClient.id);
                      setSelectedClient(null);
                    }}
                    className="px-3.5 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Archive className="w-4 h-4" />
                    أرشفة الملف
                  </button>
                )}
              </div>

              {/* Grid: 2 columns for data blocks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                {/* Sensitive IDs Block with mask/reveal */}
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-[#0F2742] flex items-center gap-2">
                    <FolderLock className="w-4.5 h-4.5 text-[#1597B8]" />
                    الهويات والمستندات الرسمية (بيانات حساسة)
                  </h4>

                  <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 space-y-3">
                    {/* National ID */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">الهوية الوطنية:</span>
                      <div className="flex items-center gap-2 font-mono font-bold text-[#0F2742]">
                        <span>{getMaskedValue(selectedClient.id, 'nationalId', selectedClient.nationalId)}</span>
                        {selectedClient.nationalId && canRevealSensitive && (
                          <button 
                            onClick={() => toggleRevealId(selectedClient.id, 'nationalId', selectedClient.nationalId || '')}
                            className="p-1 hover:bg-gray-100 rounded text-gray-500"
                          >
                            {revealedIds[`${selectedClient.id}-nationalId`] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Residence ID */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">رقم الإقامة:</span>
                      <div className="flex items-center gap-2 font-mono font-bold text-[#0F2742]">
                        <span>{getMaskedValue(selectedClient.id, 'residenceId', selectedClient.residenceId)}</span>
                        {selectedClient.residenceId && canRevealSensitive && (
                          <button 
                            onClick={() => toggleRevealId(selectedClient.id, 'residenceId', selectedClient.residenceId || '')}
                            className="p-1 hover:bg-gray-100 rounded text-gray-500"
                          >
                            {revealedIds[`${selectedClient.id}-residenceId`] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Commercial Register */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">السجل التجاري:</span>
                      <div className="flex items-center gap-2 font-mono font-bold text-[#0F2742]">
                        <span>{getMaskedValue(selectedClient.id, 'commercialRegister', selectedClient.commercialRegister)}</span>
                        {selectedClient.commercialRegister && canRevealSensitive && (
                          <button 
                            onClick={() => toggleRevealId(selectedClient.id, 'commercialRegister', selectedClient.commercialRegister || '')}
                            className="p-1 hover:bg-gray-100 rounded text-gray-500"
                          >
                            {revealedIds[`${selectedClient.id}-commercialRegister`] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Nationality */}
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-100">
                      <span className="text-gray-400">الجنسية:</span>
                      <span className="font-bold text-[#0F2742]">{selectedClient.nationality || 'سعودي'}</span>
                    </div>
                  </div>
                </div>

                {/* Notes Block */}
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-[#0F2742] flex items-center gap-2">
                    <History className="w-4.5 h-4.5 text-[#1597B8]" />
                    ملاحظات ومواصفات العميل
                  </h4>
                  <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 h-[135px] overflow-y-auto text-xs text-gray-600 leading-relaxed">
                    {selectedClient.notes || 'لا توجد ملاحظات إضافية مسجلة لهذا العميل.'}
                  </div>
                </div>
              </div>

              {/* Transactions, Files and Payments Tabs */}
              <div className="mt-8 border-t border-gray-100 pt-6 space-y-6">
                {/* Subsection: Active transactions */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-gray-400" />
                    المعاملات المرتبطة بالعميل ({clientTransactions.length})
                  </h4>
                  <div className="space-y-2">
                    {clientTransactions.map(tx => (
                      <div key={tx.id} className="p-3 bg-white border border-gray-100 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-[#0F2742]">{tx.title}</p>
                          <p className="text-[10px] text-gray-400 mt-1">الرقم المرجعي: {tx.referenceNumber} • تاريخ الاستلام: {tx.receivedDate}</p>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                          tx.status === 'completed' ? 'bg-[#23B78D]/10 text-[#23B78D]' : 'bg-[#1597B8]/10 text-[#1597B8]'
                        }`}>
                          {tx.status === 'completed' ? 'مكتملة' : 'نشطة'}
                        </span>
                      </div>
                    ))}
                    {clientTransactions.length === 0 && (
                      <p className="text-center py-4 text-gray-400 text-xs bg-gray-50/50 rounded-xl border border-gray-100">
                        لا توجد معاملات مسجلة حالياً.
                      </p>
                    )}
                  </div>
                </div>

                {/* Subsection: Attached Files */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-gray-400" />
                    المستندات المرفوعة ({clientDocuments.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {clientDocuments.map(doc => (
                      <div key={doc.id} className="p-3 bg-white border border-gray-100 rounded-xl flex items-center gap-2 text-xs">
                        <FileText className="w-5 h-5 text-[#1597B8] shrink-0" />
                        <div className="overflow-hidden flex-1">
                          <p className="font-bold text-[#0F2742] truncate" title={doc.fileName}>{doc.fileName}</p>
                          <p className="text-[9px] text-gray-400 truncate mt-0.5">{doc.fileSize} KB • {doc.expiryDate ? `ينتهي في ${doc.expiryDate}` : 'صلاحية دائمة'}</p>
                        </div>
                      </div>
                    ))}
                    {clientDocuments.length === 0 && (
                      <p className="col-span-2 text-center py-4 text-gray-400 text-xs bg-gray-50/50 rounded-xl border border-gray-100">
                        لا توجد مستندات مرفوعة لهذا العميل.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 left-4 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-[#0F2742] mb-1">إضافة عميل جديد</h3>
            <p className="text-xs text-gray-400 mb-6">يرجى ملء البيانات التالية بدقة. سيتم تشفير الهويات والسجلات تلقائياً.</p>

            <form onSubmit={handleSaveClient} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">نوع العميل *</label>
                  <select 
                    value={newClientData.clientType}
                    onChange={(e) => setNewClientData({...newClientData, clientType: e.target.value as 'individual' | 'company'})}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#1597B8]"
                  >
                    <option value="individual">فرد</option>
                    <option value="company">مؤسسة / شركة</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">الاسم الكامل / اسم الشركة *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="مثال: شركة النور أو عبدالله الشمري"
                    value={newClientData.fullName}
                    onChange={(e) => setNewClientData({...newClientData, fullName: e.target.value})}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#1597B8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">رقم الجوال (أساسي) *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="مثال: 0501234567"
                    value={newClientData.phone}
                    onChange={(e) => setNewClientData({...newClientData, phone: e.target.value})}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#1597B8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">البريد الإلكتروني</label>
                  <input 
                    type="email" 
                    placeholder="example@rattib.com"
                    value={newClientData.email}
                    onChange={(e) => setNewClientData({...newClientData, email: e.target.value})}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#1597B8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">المدينة</label>
                  <input 
                    type="text" 
                    placeholder="مثال: الرياض"
                    value={newClientData.city}
                    onChange={(e) => setNewClientData({...newClientData, city: e.target.value})}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#1597B8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">الجنسية</label>
                  <input 
                    type="text" 
                    placeholder="مثال: سعودي"
                    value={newClientData.nationality}
                    onChange={(e) => setNewClientData({...newClientData, nationality: e.target.value})}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#1597B8]"
                  />
                </div>
              </div>

              {/* Conditional ID inputs */}
              <div className="border-t border-gray-100 pt-4 space-y-4">
                <h4 className="text-xs font-bold text-[#1597B8]">البيانات الرسمية (الحساسة والمشفرة تلقائياً)</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {newClientData.clientType === 'individual' ? (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">رقم الهوية الوطنية</label>
                        <input 
                          type="text" 
                          placeholder="مثال: 1023456789"
                          value={newClientData.nationalId}
                          onChange={(e) => setNewClientData({...newClientData, nationalId: e.target.value})}
                          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#1597B8]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">رقم الإقامة</label>
                        <input 
                          type="text" 
                          placeholder="مثال: 2234567890"
                          value={newClientData.residenceId}
                          onChange={(e) => setNewClientData({...newClientData, residenceId: e.target.value})}
                          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#1597B8]"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">رقم السجل التجاري</label>
                        <input 
                          type="text" 
                          placeholder="مثال: 1010345678"
                          value={newClientData.commercialRegister}
                          onChange={(e) => setNewClientData({...newClientData, commercialRegister: e.target.value})}
                          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#1597B8]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">اسم الكيان التجاري الرسمي</label>
                        <input 
                          type="text" 
                          placeholder="مثال: شركة النور اللوجستية"
                          value={newClientData.companyName}
                          onChange={(e) => setNewClientData({...newClientData, companyName: e.target.value})}
                          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#1597B8]"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">ملاحظات ومواصفات إضافية</label>
                <textarea 
                  rows={3}
                  placeholder="أي تفاصيل أخرى مثل تفضيلات العميل أو أرقام ملفات الكيانات..."
                  value={newClientData.notes}
                  onChange={(e) => setNewClientData({...newClientData, notes: e.target.value})}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#1597B8]"
                />
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-gray-400 bg-gray-50 hover:bg-gray-100 rounded-xl"
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 text-xs font-bold text-white bg-[#1597B8] hover:bg-cyan-600 rounded-xl shadow-lg shadow-[#1597B8]/10"
                >
                  حفظ العميل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
