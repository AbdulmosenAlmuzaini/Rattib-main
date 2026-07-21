import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { ServiceTemplate, ServiceCategory } from '../types';
import { 
  Plus, 
  FolderOpen, 
  Clock, 
  DollarSign, 
  ClipboardList, 
  FileCheck, 
  Layers, 
  X, 
  ArrowLeft,
  ChevronRight,
  Sparkles,
  Zap
} from 'lucide-react';

interface TemplatesProps {
  openQuickAction: (action: string, templateId?: string) => void;
}

export const Templates: React.FC<TemplatesProps> = ({ openQuickAction }) => {
  const { 
    templates, 
    categories, 
    addServiceTemplate, 
    addCategory, 
    currentUser 
  } = useApp();

  const isReadOnly = currentUser.role === 'viewer';
  const isAccountant = currentUser.role === 'accountant';

  // State
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Create template form state
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [expectedDurationDays, setExpectedDurationDays] = useState('3');
  const [defaultServiceFee, setDefaultServiceFee] = useState('300');
  const [defaultGovernmentFee, setDefaultGovernmentFee] = useState('200');
  
  // Document and step builders
  const [docInput, setDocInput] = useState('');
  const [requiredDocuments, setRequiredDocuments] = useState<string[]>([]);
  const [stepInput, setStepInput] = useState('');
  const [checklistSteps, setChecklistSteps] = useState<string[]>([]);

  // Category creation
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showCatInput, setShowCatInput] = useState(false);

  const handleAddDoc = () => {
    if (!docInput.trim()) return;
    setRequiredDocuments([...requiredDocuments, docInput.trim()]);
    setDocInput('');
  };

  const handleRemoveDoc = (index: number) => {
    setRequiredDocuments(requiredDocuments.filter((_, i) => i !== index));
  };

  const handleAddStep = () => {
    if (!stepInput.trim()) return;
    setChecklistSteps([...checklistSteps, stepInput.trim()]);
    setStepInput('');
  };

  const handleRemoveStep = (index: number) => {
    setChecklistSteps(checklistSteps.filter((_, i) => i !== index));
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !categoryId) return;

    addServiceTemplate({
      categoryId,
      name,
      description: description || undefined,
      expectedDurationDays: Number(expectedDurationDays),
      defaultServiceFee: Number(defaultServiceFee),
      defaultGovernmentFee: Number(defaultGovernmentFee),
      requiredDocuments,
      checklistSteps
    });

    // Reset Form
    setShowAddModal(false);
    setName('');
    setDescription('');
    setExpectedDurationDays('3');
    setDefaultServiceFee('300');
    setDefaultGovernmentFee('200');
    setRequiredDocuments([]);
    setChecklistSteps([]);
  };

  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) return;
    addCategory(newCategoryName.trim());
    setNewCategoryName('');
    setShowCatInput(false);
  };

  // Filter templates
  const filteredTemplates = templates.filter(t => {
    return selectedCategory === 'all' || t.categoryId === selectedCategory;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#0F2742]">قوالب الخدمات والعمل القياسي</h2>
          <p className="text-gray-500 text-xs mt-1">
            صياغة قوالب خدمات قياسية شاملة للتسعير والمستندات المطلوبة وقوائم التدقيق لتبسيط إطلاق المعاملات.
          </p>
        </div>
        {!isReadOnly && !isAccountant && (
          <button 
            onClick={() => {
              if (categories.length > 0) {
                setCategoryId(categories[0].id);
              }
              setShowAddModal(true);
            }}
            className="px-5 py-2.5 bg-[#1597B8] hover:bg-cyan-600 text-white font-bold text-sm rounded-xl flex items-center gap-2 shadow-lg shadow-[#1597B8]/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            إنشاء قالب خدمة جديد
          </button>
        )}
      </div>

      {/* Category Tabs & Quick Config */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-xs">
        <div className="flex flex-wrap gap-1.5">
          <button 
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedCategory === 'all' 
                ? 'bg-[#1597B8] text-white shadow-xs' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            الكل ({templates.length})
          </button>
          {categories.map(cat => {
            const count = templates.filter(t => t.categoryId === cat.id).length;
            return (
              <button 
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedCategory === cat.id 
                    ? 'bg-[#1597B8] text-white shadow-xs' 
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Create Category Trigger */}
        {!isReadOnly && !isAccountant && (
          <div className="flex items-center gap-2">
            {showCatInput ? (
              <div className="flex items-center gap-1">
                <input 
                  type="text" 
                  placeholder="تصنيف جديد..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="p-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none"
                />
                <button 
                  onClick={handleCreateCategory}
                  className="px-2.5 py-1.5 bg-[#23B78D] text-white rounded-lg text-xs font-bold"
                >
                  حفظ
                </button>
                <button 
                  onClick={() => setShowCatInput(false)}
                  className="text-xs text-gray-400 hover:text-gray-600 px-1"
                >
                  إلغاء
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowCatInput(true)}
                className="text-xs text-[#1597B8] font-bold hover:underline cursor-pointer"
              >
                + إضافة فئة تصنيف جديدة
              </button>
            )}
          </div>
        )}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(tmpl => {
          const cat = categories.find(c => c.id === tmpl.categoryId);
          return (
            <div 
              key={tmpl.id}
              className="glass-panel p-5 rounded-3xl border border-white shadow-xs flex flex-col justify-between hover:shadow-md hover:translate-y-[-2px] transition-all relative group"
            >
              {/* Category label */}
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-50 text-[#1597B8] inline-block mb-3">
                  {cat?.name || 'عام'}
                </span>

                <h3 className="text-sm font-black text-[#0F2742] group-hover:text-[#1597B8] transition-colors leading-relaxed">
                  {tmpl.name}
                </h3>
                
                <p className="text-[11px] text-gray-500 mt-2 line-clamp-3 leading-relaxed">
                  {tmpl.description || 'لا يوجد وصف مفصل مضاف لهذا القالب.'}
                </p>

                {/* Specs */}
                <div className="grid grid-cols-2 gap-3 pt-4 mt-4 border-t border-gray-100 text-xs">
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <Clock className="w-4 h-4 text-[#1597B8] shrink-0" />
                    <div>
                      <p className="text-[9px] text-gray-400 leading-none">المدة المتوقعة</p>
                      <p className="font-bold text-[#0F2742] mt-0.5">{tmpl.expectedDurationDays} أيام</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-gray-500">
                    <DollarSign className="w-4 h-4 text-[#23B78D] shrink-0" />
                    <div>
                      <p className="text-[9px] text-gray-400 leading-none">الرسوم الافتراضية</p>
                      <p className="font-bold text-[#0F2742] mt-0.5">{(tmpl.defaultServiceFee + tmpl.defaultGovernmentFee)} ر.س</p>
                    </div>
                  </div>
                </div>

                {/* Requirement list counts */}
                <div className="flex justify-between mt-4 pt-3 border-t border-dashed border-gray-100 text-[10px] text-gray-400 font-bold">
                  <span className="flex items-center gap-1"><FileCheck className="w-3.5 h-3.5" /> {tmpl.requiredDocuments.length} وثائق مطلوبة</span>
                  <span className="flex items-center gap-1"><ClipboardList className="w-3.5 h-3.5" /> {tmpl.checklistSteps.length} خطوة تدقيق</span>
                </div>
              </div>

              {/* Action: Quick Launch Transaction from Template! */}
              {!isReadOnly && !isAccountant && (
                <div className="mt-5 pt-3 border-t border-gray-100">
                  <button 
                    onClick={() => openQuickAction('transaction', tmpl.id)}
                    className="w-full py-2 bg-gray-50 hover:bg-[#1597B8] hover:text-white rounded-xl text-xs font-bold text-[#1597B8] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    إطلاق معاملة سريعة من هذا القالب
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {filteredTemplates.length === 0 && (
          <div className="col-span-3 text-center py-16 bg-white border border-gray-100 rounded-3xl text-gray-400 text-xs">
            لا توجد قوالب مضافة تحت هذا التصنيف حالياً.
          </div>
        )}
      </div>

      {/* Create Template Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 left-4 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-[#0F2742] mb-1">إنشاء قالب خدمة جديد</h3>
            <p className="text-xs text-gray-400 mb-6">صغ معايير الخدمة والتسعير وقائمة التحقق التلقائية الخاصة بها.</p>

            <form onSubmit={handleSaveTemplate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">اسم الخدمة القياسي *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="مثال: تجديد إقامة مهنية، نقل كفالة"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#1597B8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">فئة التصنيف *</label>
                  <select 
                    required
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#1597B8]"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 mb-1">الوصف العام وسير العمل للخدمة</label>
                  <textarea 
                    rows={2}
                    placeholder="اكتب تفاصيل الخدمة والاشتراطات الأساسية للعميل وموقع التقديم..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#1597B8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">المدة المتوقعة للإنجاز (بالأيام) *</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    value={expectedDurationDays}
                    onChange={(e) => setExpectedDurationDays(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#1597B8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">أتعاب سعي المكتب الافتراضية (ر.س) *</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    value={defaultServiceFee}
                    onChange={(e) => setDefaultServiceFee(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#1597B8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">الرسوم الحكومية التقريبية (ر.س) *</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    value={defaultGovernmentFee}
                    onChange={(e) => setDefaultGovernmentFee(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#1597B8]"
                  />
                </div>
              </div>

              {/* Required Documents Checklist Builder */}
              <div className="border-t border-gray-100 pt-4 space-y-2">
                <label className="block text-xs font-bold text-[#1597B8]">الأوراق والمستندات المطلوبة للتقديم</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="مثال: فحص طبي معتمد، خطاب كفيل مصدق"
                    value={docInput}
                    onChange={(e) => setDocInput(e.target.value)}
                    className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none"
                  />
                  <button 
                    type="button"
                    onClick={handleAddDoc}
                    className="px-4 bg-[#1597B8] hover:bg-cyan-600 text-white rounded-xl text-xs font-bold"
                  >
                    إضافة
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {requiredDocuments.map((doc, idx) => (
                    <span key={idx} className="bg-gray-100 text-gray-700 text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 border border-gray-200">
                      {doc}
                      <button type="button" onClick={() => handleRemoveDoc(idx)} className="text-red-500 font-bold hover:text-red-700">×</button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Checklist Steps Builder */}
              <div className="border-t border-gray-100 pt-4 space-y-2">
                <label className="block text-xs font-bold text-[#1597B8]">خطوات التحقق وسير العمل الإلزامي (الـ Checklist)</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="مثال: التحقق من سداد المخالفات، طلب التجديد في قوى"
                    value={stepInput}
                    onChange={(e) => setStepInput(e.target.value)}
                    className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none"
                  />
                  <button 
                    type="button"
                    onClick={handleAddStep}
                    className="px-4 bg-[#1597B8] hover:bg-cyan-600 text-white rounded-xl text-xs font-bold"
                  >
                    إضافة
                  </button>
                </div>

                <div className="space-y-1 pt-1">
                  {checklistSteps.map((step, idx) => (
                    <div key={idx} className="bg-gray-100 text-gray-700 text-[11px] font-bold p-2 rounded-xl flex items-center justify-between border border-gray-200">
                      <span>{idx + 1}. {step}</span>
                      <button type="button" onClick={() => handleRemoveStep(idx)} className="text-red-500 font-bold hover:text-red-700">حذف</button>
                    </div>
                  ))}
                </div>
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
                  حفظ القالب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
