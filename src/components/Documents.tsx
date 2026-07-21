import React, { useState, useRef } from 'react';
import { useApp } from '../AppContext';
import { AppDocument } from '../types';
import { 
  FileText, 
  Search, 
  Plus, 
  Clock, 
  Trash2, 
  FileCheck, 
  Download, 
  AlertTriangle, 
  User, 
  Briefcase, 
  UploadCloud,
  X,
  Calendar,
  ArrowLeft
} from 'lucide-react';

interface DocumentsProps {
  initialFilter?: any;
  onContinueProcedure?: (document: AppDocument) => void;
}

export const Documents: React.FC<DocumentsProps> = ({ initialFilter, onContinueProcedure }) => {
  const { 
    documents, 
    clients, 
    transactions, 
    uploadDocument, 
    deleteDocument, 
    currentUser 
  } = useApp();

  const isReadOnly = currentUser.role === 'viewer';
  const isAccountant = currentUser.role === 'accountant';

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [docTypeFilter, setDocTypeFilter] = useState('all');
  const [expiryStatusFilter, setExpiryStatusFilter] = useState<'all' | 'expiring' | 'expired'>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Upload Form State
  const [clientId, setClientId] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [documentType, setDocumentType] = useState<AppDocument['documentType']>('national_id');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(250); // mock size in KB
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');

  // Drag and drop state
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter apply from parent
  React.useEffect(() => {
    if (initialFilter && initialFilter.expiring) {
      setExpiryStatusFilter('expiring');
    }
  }, [initialFilter]);

  const todayStr = new Date().toISOString().split('T')[0];
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  const thirtyDaysStr = thirtyDaysFromNow.toISOString().split('T')[0];

  // Filters
  const filteredDocuments = documents.filter(doc => {
    const client = clients.find(c => c.id === doc.clientId);
    const matchesSearch = doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (client && client.fullName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = docTypeFilter === 'all' ? true : doc.documentType === docTypeFilter;
    
    let matchesExpiry = true;
    if (expiryStatusFilter === 'expired') {
      matchesExpiry = !!doc.expiryDate && doc.expiryDate < todayStr;
    } else if (expiryStatusFilter === 'expiring') {
      matchesExpiry = !!doc.expiryDate && doc.expiryDate >= todayStr && doc.expiryDate <= thirtyDaysStr;
    }

    return matchesSearch && matchesType && matchesExpiry;
  });

  // Drag & drop handlers (Usability Pattern implementation!)
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    setUploadError('');
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setFileName(file.name);
      setFileSize(Math.round(file.size / 1024)); // size in KB
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setFileName(file.name);
      setFileSize(Math.round(file.size / 1024)); // size in KB
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSaveDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName || !selectedFile) return;

    const uploaded = await uploadDocument({
      clientId: clientId || undefined,
      transactionId: transactionId || undefined,
      documentType,
      fileName,
      fileSize,
      issueDate: issueDate || undefined,
      expiryDate: expiryDate || undefined,
      notes: notes || undefined
    }, selectedFile);
    if (!uploaded) {
      setUploadError('تعذر رفع الملف. تأكد من أنه PDF أو PNG أو JPG وألا يتجاوز 5MB.');
      return;
    }

    // Reset Form
    setShowAddModal(false);
    setClientId('');
    setTransactionId('');
    setFileName('');
    setSelectedFile(null);
    setIssueDate('');
    setExpiryDate('');
    setNotes('');
  };

  const getDocTypeLabel = (type: AppDocument['documentType']) => {
    switch (type) {
      case 'national_id': return 'هوية وطنية';
      case 'residence_id': return 'إقامة وافد';
      case 'passport': return 'جواز سفر';
      case 'cr': return 'سجل تجاري';
      case 'license': return 'رخصة بلدية/دفاع مدني';
      case 'authorization': return 'خطاب تفويض';
      case 'contract': return 'عقد موثق';
      case 'receipt': return 'إيصال دفع';
      default: return 'أوراق أخرى';
    }
  };

  // Check document status
  const getDocExpiryStatus = (expiryDate?: string) => {
    if (!expiryDate) return { label: 'صلاحية مفتوحة', color: 'text-gray-400 bg-gray-50' };
    if (expiryDate < todayStr) return { label: 'منتهي الصلاحية ⚠️', color: 'text-red-600 bg-red-50 font-bold' };
    if (expiryDate <= thirtyDaysStr) return { label: 'ينتهي قريباً ⌛', color: 'text-orange-600 bg-orange-50 font-bold' };
    return { label: `ساري (ينتهي ${expiryDate})`, color: 'text-[#23B78D] bg-emerald-50' };
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#0F2742]">مركز المستندات والأرشيف الإلكتروني</h2>
          <p className="text-gray-500 text-xs mt-1">
            متابعة وصيانة الهويات الوطنية وتراخيص البلدية وصور الإقامات للوافدين مع إشعارات تنبيهية مسبقة للانتهاء.
          </p>
        </div>
        {!isReadOnly && !isAccountant && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 bg-[#1597B8] hover:bg-cyan-600 text-white font-bold text-sm rounded-xl flex items-center gap-2 shadow-lg shadow-[#1597B8]/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            رفع مستند جديد
          </button>
        )}
      </div>

      {/* Expiry Alerts Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Expired count */}
        <div 
          onClick={() => setExpiryStatusFilter('expired')}
          className="p-4 rounded-3xl border border-red-100 bg-red-50/50 flex items-center justify-between cursor-pointer hover:bg-red-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center text-white font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-red-900 font-bold text-xs">مستندات منتهية الصلاحية ⚠️</p>
              <p className="text-[10px] text-red-600/70 mt-0.5">تحتاج مراجعة وتحديث وتواصل عاجل مع العميل.</p>
            </div>
          </div>
          <span className="text-2xl font-black text-red-600">
            {documents.filter(d => d.expiryDate && d.expiryDate < todayStr).length}
          </span>
        </div>

        {/* Expiring soon count */}
        <div 
          onClick={() => setExpiryStatusFilter('expiring')}
          className="p-4 rounded-3xl border border-orange-100 bg-orange-50/50 flex items-center justify-between cursor-pointer hover:bg-orange-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-orange-900 font-bold text-xs">مستندات تنتهي خلال 30 يوماً ⌛</p>
              <p className="text-[10px] text-orange-600/70 mt-0.5">ننصح بالتواصل مع العميل لتفادي غرامات الجوازات والبلديات.</p>
            </div>
          </div>
          <span className="text-2xl font-black text-orange-600">
            {documents.filter(d => d.expiryDate && d.expiryDate >= todayStr && d.expiryDate <= thirtyDaysStr).length}
          </span>
        </div>
      </div>

      {/* Filters Dashboard */}
      <div className="glass-panel p-4 rounded-3xl border border-white shadow-sm flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="ابحث باسم المستند أو العميل..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-2 bg-white/50 border border-gray-200 rounded-xl text-xs focus:outline-none"
          />
        </div>

        {/* Type selector */}
        <div className="flex gap-2 text-xs">
          <select 
            value={docTypeFilter}
            onChange={(e) => setDocTypeFilter(e.target.value)}
            className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
          >
            <option value="all">كل أنواع الملفات</option>
            <option value="national_id">هوية وطنية</option>
            <option value="residence_id">إقامة</option>
            <option value="cr">سجل تجاري</option>
            <option value="license">رخصة بلدية</option>
            <option value="contract">عقود</option>
          </select>

          <select 
            value={expiryStatusFilter}
            onChange={(e) => setExpiryStatusFilter(e.target.value as any)}
            className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
          >
            <option value="all">كل حالات الصلاحية</option>
            <option value="expiring">تنتهي قريباً (30 يوماً)</option>
            <option value="expired">منتهية</option>
          </select>

          {(searchTerm || docTypeFilter !== 'all' || expiryStatusFilter !== 'all') && (
            <button 
              onClick={() => {
                setSearchTerm('');
                setDocTypeFilter('all');
                setExpiryStatusFilter('all');
              }}
              className="text-xs text-red-500 font-bold hover:underline px-2"
            >
              تصفير
            </button>
          )}
        </div>
      </div>

      {/* Document Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocuments.map(doc => {
          const client = clients.find(c => c.id === doc.clientId);
          const tx = transactions.find(t => t.id === doc.transactionId);
          const expiryInfo = getDocExpiryStatus(doc.expiryDate);

          return (
            <div 
              key={doc.id}
              data-testid={`document-card-${doc.id}`}
              onClick={() => onContinueProcedure?.(doc)}
              className="glass-panel group p-5 rounded-3xl border border-white shadow-xs hover:shadow-md hover:border-[#1597B8]/30 transition-all relative flex flex-col justify-between cursor-pointer"
            >
              <div>
                {/* File extension/header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="p-3 bg-[#1597B8]/10 text-[#1597B8] rounded-2xl">
                    <FileText className="w-6 h-6" />
                  </div>
                  
                  {/* Status pills */}
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${expiryInfo.color}`}>
                    {expiryInfo.label}
                  </span>
                </div>

                <h4 className="font-bold text-sm text-[#0F2742] line-clamp-1" title={doc.fileName}>
                  {doc.fileName}
                </h4>
                
                <p className="text-[10px] text-gray-400 mt-1 font-mono">
                  الحجم: {doc.fileSize} KB • النوع: {getDocTypeLabel(doc.documentType)}
                </p>

                {/* Association */}
                <div className="mt-4 pt-3 border-t border-gray-100 space-y-2 text-xs text-gray-600">
                  {client && (
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-gray-400" />
                      <span>العميل: <span className="font-bold text-[#0F2742]">{client.fullName}</span></span>
                    </div>
                  )}

                  {tx && (
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                      <span className="truncate">المعاملة: <span className="font-bold text-[#0F2742]">{tx.title}</span></span>
                    </div>
                  )}
                </div>

                {/* Extra Notes */}
                {doc.notes && (
                  <p className="text-[10px] text-gray-400 bg-gray-50 p-2.5 rounded-xl mt-3 leading-relaxed border border-gray-100">
                    {doc.notes}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onContinueProcedure?.(doc);
                }}
                className="mt-4 flex w-full items-center justify-between rounded-xl bg-[#0F2742] px-3.5 py-2.5 text-[11px] font-bold text-white transition-colors hover:bg-[#1597B8] cursor-pointer"
              >
                <span>{tx ? 'متابعة الإجراء في المعاملة' : 'إنشاء معاملة لإكمال الإجراء'}</span>
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              </button>

              {/* Action buttons */}
              <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
                {doc.hasFile ? <a
                  href={`/api/documents/${doc.id}/content`}
                  onClick={(event) => event.stopPropagation()}
                  className="px-3 py-1.5 bg-gray-50 hover:bg-[#1597B8]/10 hover:text-[#1597B8] rounded-xl text-[10px] font-bold text-gray-500 flex items-center gap-1 transition-colors"
                >
                  <Download className="w-3 h-3" />
                  تحميل المستند
                </a> : <span className="px-3 py-1.5 rounded-xl text-[10px] font-bold text-gray-400 bg-gray-50">ملف قديم غير مرفوع</span>}
                <a 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); alert('تحميل الملف مشفر ومحمي ومتاح في بيئة الإنتاج.'); }}
                  className="hidden"
                >
                  <Download className="w-3 h-3" />
                  تحميل المستند
                </a>

                {!isReadOnly && !isAccountant && (
                  <button 
                    onClick={(event) => {
                      event.stopPropagation();
                      if (confirm('هل أنت متأكد من حذف هذا المستند نهائياً؟ لا يمكن استعادة البيانات.')) {
                        deleteDocument(doc.id);
                      }
                    }}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="حذف المستند نهائياً"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filteredDocuments.length === 0 && (
          <div className="col-span-3 text-center py-16 bg-white border border-gray-100 rounded-3xl text-gray-400 text-xs">
            لا توجد مستندات مرفوعة تطابق شروط البحث والانتهاء الحالية.
          </div>
        )}
      </div>

      {/* Upload Document Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 left-4 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-[#0F2742] mb-1">رفع وأرشفة مستند جديد</h3>
            <p className="text-xs text-gray-400 mb-6">يرجى رفع المستند وتحديد تاريخ الانتهاء لربطه بالتنبيهات التلقائية.</p>

            <form onSubmit={handleSaveDoc} className="space-y-4">
              {uploadError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700">{uploadError}</p>}
              {/* Drag and Drop Zone (Usability Pattern Requirement!) */}
              <div 
                id="file-dropzone"
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={triggerFileInput}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  dragActive 
                    ? 'border-[#1597B8] bg-[#1597B8]/5' 
                    : 'border-gray-200 hover:border-[#1597B8]/40 bg-gray-50/50'
                }`}
              >
                <input 
                  type="file"
                  accept="application/pdf,image/png,image/jpeg"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <UploadCloud className="w-10 h-10 text-[#1597B8] mx-auto mb-2" />
                <p className="text-xs font-bold text-[#0F2742]">اسحب وأفلت المستند هنا، أو اضغط للتصفح</p>
                <p className="text-[10px] text-gray-400 mt-1">يدعم ملفات PDF, PNG, JPG بحد أقصى 5MB</p>
                
                {fileName && (
                  <div className="mt-3 p-2 bg-white rounded-xl border border-gray-200 inline-flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-[#23B78D]" />
                    <span className="text-xs font-mono font-bold text-gray-700">{fileName} ({fileSize} KB)</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">نوع المستند *</label>
                  <select 
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value as any)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none"
                  >
                    <option value="national_id">هوية وطنية</option>
                    <option value="residence_id">إقامة وافد</option>
                    <option value="passport">جواز سفر</option>
                    <option value="cr">سجل تجاري</option>
                    <option value="license">رخصة بلدية / ترخيص دفاع مدني</option>
                    <option value="authorization">خطاب تفويض</option>
                    <option value="contract">عقد موثق</option>
                    <option value="receipt">إيصال دفع</option>
                    <option value="other">أوراق ومستندات أخرى</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">العميل المرتبط (اختياري)</label>
                  <select 
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none"
                  >
                    <option value="">غير مرتبط بعميل معين</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.fullName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">المعاملة المرتبطة (اختياري)</label>
                  <select 
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none"
                  >
                    <option value="">غير مرتبط بمعاملة معينة</option>
                    {transactions.map(t => (
                      <option key={t.id} value={t.id}>{t.title} ({t.referenceNumber})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">تاريخ الصدور (اختياري)</label>
                  <input 
                    type="date" 
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-gray-500 mb-1">تاريخ الانتهاء والصلاحية (هام للتنبيهات)</label>
                  <input 
                    type="date" 
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-orange-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">ملاحظات المستند</label>
                <textarea 
                  rows={2}
                  placeholder="ملاحظات تفصيلية مثل رقم المستند الفعلي أو بنود العقد المالي..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none"
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
                  disabled={!fileName}
                  className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-lg ${
                    fileName 
                      ? 'bg-[#1597B8] hover:bg-cyan-600 shadow-[#1597B8]/10' 
                      : 'bg-gray-300 shadow-none cursor-not-allowed'
                  }`}
                >
                  حفظ وأرشفة المستند
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
