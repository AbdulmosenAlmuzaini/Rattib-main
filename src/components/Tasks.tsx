import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { Task } from '../types';
import { 
  CheckCircle, 
  Circle, 
  Search, 
  Plus, 
  Calendar, 
  Clock, 
  UserCheck, 
  AlertCircle, 
  PhoneCall, 
  MapPin, 
  CircleDollarSign, 
  FileText, 
  Layers, 
  X,
  TrendingUp,
  Sliders
} from 'lucide-react';

interface TasksProps {
  initialFilter?: { overdue?: boolean; notificationId?: string } | null;
}

export const Tasks: React.FC<TasksProps> = ({ initialFilter }) => {
  const { 
    tasks, 
    clients, 
    transactions, 
    users, 
    addTask, 
    completeTask, 
    currentUser 
  } = useApp();

  const isReadOnly = currentUser.role === 'viewer';
  const isAccountant = currentUser.role === 'accountant';

  // State
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  React.useEffect(() => {
    if (initialFilter?.overdue) setStatusFilter('overdue');
  }, [initialFilter]);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [clientId, setClientId] = useState('');
  const [assignedUserId, setAssignedUserId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 16));
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 16));
  const [priority, setPriority] = useState<Task['priority']>('normal');
  const [taskType, setTaskType] = useState<Task['taskType']>('general');

  // Filters
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const isOverdue = !task.isCompleted && !['completed', 'cancelled'].includes(task.status) && task.dueDate.slice(0, 10) < new Date().toISOString().slice(0, 10);
    const matchesStatus = statusFilter === 'all' ? true : statusFilter === 'overdue' ? isOverdue : task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' ? true : task.priority === priorityFilter;
    const matchesType = typeFilter === 'all' ? true : task.taskType === typeFilter;
    return matchesSearch && matchesStatus && matchesPriority && matchesType;
  });

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    addTask({
      title,
      description: description || undefined,
      transactionId: transactionId || undefined,
      clientId: clientId || undefined,
      assignedUserId: assignedUserId || undefined,
      startDate,
      dueDate,
      priority,
      taskType
    });

    // Reset Form
    setShowAddModal(false);
    setTitle('');
    setDescription('');
    setTransactionId('');
    setClientId('');
    setAssignedUserId('');
    setStartDate(new Date().toISOString().slice(0, 16));
    setDueDate(new Date().toISOString().slice(0, 16));
    setPriority('normal');
    setTaskType('general');
  };

  const getTaskIcon = (type: Task['taskType']) => {
    switch (type) {
      case 'call': return <PhoneCall className="w-5 h-5 text-blue-500 bg-blue-50 p-1 rounded-lg shrink-0" />;
      case 'payment_collect': return <CircleDollarSign className="w-5 h-5 text-green-500 bg-green-50 p-1 rounded-lg shrink-0" />;
      case 'doc_request': return <FileText className="w-5 h-5 text-amber-500 bg-amber-50 p-1 rounded-lg shrink-0" />;
      case 'review': return <AlertCircle className="w-5 h-5 text-purple-500 bg-purple-50 p-1 rounded-lg shrink-0" />;
      default: return <MapPin className="w-5 h-5 text-[#1597B8] bg-cyan-50 p-1 rounded-lg shrink-0" />;
    }
  };

  const getTaskTypeLabel = (type: Task['taskType']) => {
    switch (type) {
      case 'call': return 'اتصال ومتابعة العميل';
      case 'payment_collect': return 'تحصيل دفعة مالية';
      case 'doc_request': return 'طلب مستندات ناقصة';
      case 'review': return 'مراجعة وتدقيق داخلي';
      default: return 'مراجعة جهة حكومية/عامة';
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#0F2742]">إدارة المهام والتقويم اليومي</h2>
          <p className="text-gray-500 text-xs mt-1">
            صياغة المهام وتفويضها وتحديد مواعيد زيارات المرور والبلديات ومتابعة الاتصالات بالعملاء لضمان سرعة الإنجاز.
          </p>
        </div>
        {!isReadOnly && !isAccountant && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 bg-[#1597B8] hover:bg-cyan-600 text-white font-bold text-sm rounded-xl flex items-center gap-2 shadow-lg shadow-[#1597B8]/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            جدولة مهمة جديدة
          </button>
        )}
      </div>

      {/* Scheduler Filter Dashboard */}
      <div className="glass-panel p-4 rounded-3xl border border-white shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
          {/* View mode */}
          <div className="flex bg-gray-100 p-1 rounded-xl self-start shrink-0">
            <button 
              onClick={() => setViewMode('list')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'list' ? 'bg-white text-[#0F2742] shadow-xs' : 'text-gray-500'
              }`}
            >
              <Layers className="w-4 h-4" />
              عرض قائمة المهام
            </button>
            <button 
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'calendar' ? 'bg-white text-[#0F2742] shadow-xs' : 'text-gray-500'
              }`}
            >
              <Calendar className="w-4 h-4" />
              التقويم الشهري (Scheduler)
            </button>
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="ابحث بعنوان المهمة أو الوصف..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 bg-white/50 border border-gray-200 rounded-xl text-xs focus:outline-none"
            />
          </div>
        </div>

        {/* Sliders filter */}
        <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t border-gray-100">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none"
          >
            <option value="all">كل الحالات</option>
            <option value="pending">بانتظار البدء</option>
            <option value="in_progress">قيد التنفيذ</option>
            <option value="overdue">متأخرة</option>
            <option value="completed">مكتملة</option>
          </select>

          <select 
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="p-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none"
          >
            <option value="all">كل مستويات الأهمية</option>
            <option value="low">منخفضة</option>
            <option value="normal">عادية</option>
            <option value="high">عالية</option>
          </select>

          <select 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="p-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none"
          >
            <option value="all">كل أنواع المهام</option>
            <option value="general">مراجعة عامة</option>
            <option value="call">اتصال هاتفي</option>
            <option value="payment_collect">تحصيل أموال</option>
            <option value="doc_request">طلب مستندات</option>
          </select>
        </div>
      </div>

      {/* View Rendering */}
      {viewMode === 'list' ? (
        /* Tasks List View */
        <div className="space-y-3">
          {filteredTasks.map(task => {
            const client = clients.find(c => c.id === task.clientId);
            const tx = transactions.find(t => t.id === task.transactionId);
            const user = users.find(u => u.id === task.assignedUserId);
            const isCompleted = task.status === 'completed';

            return (
              <div 
                key={task.id}
                className={`bg-white p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                  isCompleted ? 'border-emerald-100 opacity-70 bg-emerald-50/20' : 'border-gray-100 shadow-xs'
                }`}
              >
                {/* Complete Trigger Checkbox */}
                <button 
                  disabled={isReadOnly}
                  onClick={() => completeTask(task.id, isCompleted ? 'pending' : 'completed')}
                  className="mt-1 text-gray-400 hover:text-[#1597B8] transition-colors shrink-0 cursor-pointer"
                >
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5 text-[#23B78D]" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-300" />
                  )}
                </button>

                {/* Info block */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      task.priority === 'high' ? 'bg-red-50 text-red-600' : (task.priority === 'normal' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600')
                    }`}>
                      أولوية {task.priority === 'high' ? 'عالية' : (task.priority === 'normal' ? 'عادية' : 'منخفضة')}
                    </span>
                    <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded font-bold border border-gray-100">
                      {getTaskTypeLabel(task.taskType)}
                    </span>
                  </div>

                  <h4 className={`text-sm font-bold text-[#0F2742] mt-2 ${isCompleted ? 'line-through text-gray-400' : ''}`}>
                    {task.title}
                  </h4>

                  {task.description && (
                    <p className="text-xs text-gray-500 mt-1.5 leading-relaxed bg-gray-50/50 p-2.5 rounded-xl border border-gray-100/30">
                      {task.description}
                    </p>
                  )}

                  {/* Association footer */}
                  <div className="flex items-center gap-4 text-[10px] text-gray-400 font-bold mt-3 pt-3 border-t border-gray-50 flex-wrap">
                    {client && <span>العميل: <span className="text-[#0F2742]">{client.fullName}</span></span>}
                    {tx && <span>المعاملة: <span className="text-[#0F2742]">{tx.referenceNumber}</span></span>}
                    {user && <span>المكلف: <span className="text-[#1597B8]">{user.fullName}</span></span>}
                    <span className="flex items-center gap-1 font-mono text-gray-500"><Clock className="w-3.5 h-3.5 text-[#1597B8]" /> تاريخ الاستحقاق: {task.dueDate.replace('T', ' ')}</span>
                  </div>
                </div>

                {/* Right task icon */}
                <div className="shrink-0 self-center hidden sm:block">
                  {getTaskIcon(task.taskType)}
                </div>
              </div>
            );
          })}

          {filteredTasks.length === 0 && (
            <div className="text-center py-16 bg-white border border-gray-100 rounded-3xl text-gray-400 text-xs">
              لا توجد مهام مطابقة لخيارات الفلترة والتصفية الحالية.
            </div>
          )}
        </div>
      ) : (
        /* Calendar / Appointments Scheduler View */
        <div className="glass-panel p-6 rounded-3xl border border-white shadow-sm space-y-4">
          <div className="bg-[#0F2742] text-white p-4 rounded-2xl flex justify-between items-center text-xs">
            <span className="font-bold">أجندة مواعيد وزيارات مكتب رتّب الذكي لعام 2026</span>
            <span className="font-bold text-[#23B78D] font-mono">يوليو (July)</span>
          </div>

          {/* Simple Mock Calendar Month view for July 2026 */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold">
            {['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].map(day => (
              <div key={day} className="bg-gray-100 p-2 rounded-lg text-gray-500">{day}</div>
            ))}
            
            {/* Pad leading offset of July 2026 (Wednesday is 1st day of month) */}
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={`pad-${i}`} className="p-3 text-gray-200"></div>
            ))}

            {/* Days of July 2026 */}
            {Array.from({ length: 31 }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `2026-07-${String(dayNum).padStart(2, '0')}`;
              
              // Find tasks expiring or due on this day
              const dayTasks = tasks.filter(t => t.dueDate.startsWith(dateStr));
              const hasTasks = dayTasks.length > 0;

              return (
                <div 
                  key={dayNum} 
                  className={`p-3 rounded-2xl border transition-all flex flex-col items-center justify-between min-h-[75px] ${
                    dayNum === 18 
                      ? 'border-[#1597B8] bg-[#1597B8]/5 font-black text-[#1597B8]' 
                      : (hasTasks ? 'border-emerald-100 bg-emerald-50/10' : 'border-gray-50 bg-white/40')
                  }`}
                >
                  <span className="text-xs leading-none">{dayNum}</span>
                  
                  {/* Task indicator dots */}
                  {hasTasks && (
                    <div className="flex flex-col gap-1 w-full mt-2">
                      {dayTasks.map(t => (
                        <div 
                          key={t.id} 
                          title={t.title}
                          className="bg-[#1597B8] text-white text-[8px] font-bold p-1 rounded-sm truncate w-full text-center"
                        >
                          {t.title}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 left-4 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-[#0F2742] mb-1">جدولة مهمة أو موعد جديد</h3>
            <p className="text-xs text-gray-400 mb-6">يرجى صياغة التفاصيل، وتعيين الموظف المسؤول مع تفعيل الموعد التنبيهي.</p>

            <form onSubmit={handleSaveTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">عنوان المهمة / الموعد *</label>
                <input 
                  type="text" 
                  required
                  placeholder="مثال: مراجعة مرور الرياض لسيارة القحطاني، الاتصال بالعميل خالد"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">نوع المهمة *</label>
                  <select 
                    value={taskType}
                    onChange={(e) => setTaskType(e.target.value as any)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none"
                  >
                    <option value="general">مراجعة جهة حكومية (عامة)</option>
                    <option value="call">اتصال هاتفي ومتابعة</option>
                    <option value="payment_collect">تحصيل مبالغ مالية</option>
                    <option value="doc_request">طلب مستندات ناقصة</option>
                    <option value="review">مراجعة وتدقيق داخلي</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">الموظف المسؤول (المكلف) *</label>
                  <select 
                    value={assignedUserId}
                    onChange={(e) => setAssignedUserId(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none"
                  >
                    <option value="">اختر موظفاً لتفويض المهمة...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.fullName}</option>
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
                    <option value="">لا توجد معاملة مرتبطة</option>
                    {transactions.map(t => (
                      <option key={t.id} value={t.id}>{t.title} ({t.referenceNumber})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">العميل المرتبط (اختياري)</label>
                  <select 
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none"
                  >
                    <option value="">لا يوجد عميل مرتبط</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.fullName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">تاريخ ووقت البدء</label>
                  <input 
                    type="datetime-local" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">تاريخ ووقت الاستحقاق *</label>
                  <input 
                    type="datetime-local" 
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">مستوى الأهمية *</label>
                  <select 
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none"
                  >
                    <option value="low">منخفضة</option>
                    <option value="normal">عادية</option>
                    <option value="high">عالية</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">شرح وتفاصيل المهمة</label>
                <textarea 
                  rows={2}
                  placeholder="اكتب تفاصيل الزيارة أو الأوراق المطلوب إعادتها والموظف البديل..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
                  className="px-5 py-2.5 text-xs font-bold text-white bg-[#1597B8] hover:bg-cyan-600 rounded-xl shadow-lg shadow-[#1597B8]/10"
                >
                  جدولة المهمة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
