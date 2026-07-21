import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { 
  FileClock, 
  ShieldAlert, 
  UserCheck, 
  Trash2, 
  Layers, 
  Search, 
  Activity, 
  AlertTriangle,
  Info
} from 'lucide-react';

export const ActivityLog: React.FC = () => {
  const { activityLogs, auditLogs, currentUser, clearAllState } = useApp();

  const isOwner = currentUser.role === 'owner';

  // State
  const [activeTab, setActiveTab] = useState<'activity' | 'audit'>('activity');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter logs
  const filteredActivities = activityLogs.filter(log => {
    return log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
           log.userName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const filteredAudits = auditLogs.filter(log => {
    return log.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  return (
    <div className="space-y-6 font-sans text-right" dir="rtl">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#0F2742]">سجلات النظام والرقابة الأمنية</h2>
          <p className="text-gray-500 text-xs mt-1">
            سجل شامل ومضاد للتلاعب للعمليات التشغيلية وكشف الهويات الحساسة لتعزيز التدقيق المالي والأمني للمكتب.
          </p>
        </div>
        {false && isOwner && (
          <button 
            onClick={() => {
              if (confirm('تحذير: هل أنت متأكد من رغبتك في مسح كافة البيانات محلياً واستعادة تهيئة البذور الافتراضية للمكتب؟')) {
                clearAllState();
              }
            }}
            className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            استعادة بيانات البذور الافتراضية
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 p-1 rounded-xl self-start max-w-sm">
        <button 
          onClick={() => { setActiveTab('activity'); setSearchTerm(''); }}
          className={`flex-1 px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'activity' ? 'bg-white text-[#0F2742] shadow-xs' : 'text-gray-500'
          }`}
        >
          <Activity className="w-4 h-4" />
          سجل العمليات اليومية ({activityLogs.length})
        </button>
        <button 
          onClick={() => { setActiveTab('audit'); setSearchTerm(''); }}
          className={`flex-1 px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'audit' ? 'bg-white text-[#0F2742] shadow-xs' : 'text-gray-500'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          سجل الرقابة والتدقيق ({auditLogs.length})
        </button>
      </div>

      {/* Filter Box */}
      <div className="relative">
        <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
        <input 
          type="text" 
          placeholder={activeTab === 'activity' ? "ابحث باسم الموظف أو نوع العملية..." : "ابحث بحدث الرقابة الأمنية..."}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pr-10 pl-4 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none"
        />
      </div>

      {/* Content Rendering */}
      {activeTab === 'activity' ? (
        /* Daily Activities list */
        <div className="glass-panel rounded-3xl border border-white shadow-sm p-6 space-y-4">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="text-sm font-black text-[#0F2742] flex items-center gap-1.5">
              <FileClock className="w-5 h-5 text-[#1597B8]" />
              سجل نشاطات الموظفين وسير عمل المعاملات
            </h3>
            <p className="text-[10px] text-gray-400 mt-1">تتبع في الوقت الفعلي لكل عملية إضافة عميل أو تحديث معاملة أو دفعات مستلمة.</p>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {filteredActivities.map(log => (
              <div key={log.id} className="p-3 bg-white border border-gray-100 rounded-2xl flex items-start gap-3.5 text-xs">
                <div className="p-2 bg-gray-50 rounded-xl text-gray-500 mt-0.5 shrink-0">
                  <Activity className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[#0F2742]">{log.action}</p>
                  <p className="text-[10px] text-gray-400 mt-1">القائم بالعملية: <span className="text-[#1597B8] font-bold">{log.userName}</span></p>
                  <p className="text-[8px] font-mono text-gray-400 mt-0.5">{new Date(log.createdAt).toLocaleString('ar-SA')}</p>
                </div>
              </div>
            ))}

            {filteredActivities.length === 0 && (
              <p className="text-center py-12 text-gray-400 text-xs">لا توجد سجلات مطابقة للبحث.</p>
            )}
          </div>
        </div>
      ) : (
        /* Security Audits list with critical eye icon reveals, etc. */
        <div className="glass-panel rounded-3xl border border-white shadow-sm p-6 space-y-4">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="text-sm font-black text-red-600 flex items-center gap-1.5">
              <ShieldAlert className="w-5 h-5 text-red-500" />
              سجل تدقيق الأمان وكشف الهويات الحساسة (Audit Trails)
            </h3>
            <p className="text-[10px] text-gray-400 mt-1">يتتبع هذا السجل بدقة متناهية عمليات فك تشفير البيانات أو كشف أرقام الهويات الوطنية لتجنب تسريب المعلومات.</p>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {filteredAudits.map(log => (
              <div 
                key={log.id} 
                className={`p-4 rounded-2xl border flex items-start gap-3.5 text-xs ${
                  log.severity === 'critical' ? 'bg-red-50/30 border-red-200' : 'bg-orange-50/20 border-orange-100'
                }`}
              >
                <div className={`p-2 rounded-xl mt-0.5 shrink-0 ${
                  log.severity === 'critical' ? 'bg-red-500/10 text-red-600' : 'bg-orange-500/10 text-orange-600'
                }`}>
                  {log.severity === 'critical' ? <AlertTriangle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[#0F2742]">{log.event}</p>
                  {log.details && <p className="text-[10px] text-gray-500 mt-1">{log.details}</p>}
                  <p className="text-[10px] text-gray-400 mt-1">القائم بالعملية: <span className="font-bold text-gray-700">{log.userName}</span></p>
                  <p className="text-[8px] font-mono text-gray-400 mt-0.5">{new Date(log.createdAt).toLocaleString('ar-SA')}</p>
                </div>
              </div>
            ))}

            {filteredAudits.length === 0 && (
              <p className="text-center py-12 text-gray-400 text-xs">لا توجد سجلات رقابية مطابقة.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
