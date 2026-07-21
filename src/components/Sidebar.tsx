import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { AccountSecurity } from './AccountSecurity';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  FolderOpen, 
  CalendarRange, 
  CreditCard, 
  FileClock, 
  Settings, 
  LogOut, 
  ChevronDown, 
  Building2,
  ShieldCheck,
  UserCheck,
  X
} from 'lucide-react';

interface SidebarProps {
  sidebarOpen?: boolean;
  setSidebarOpen?: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const { 
    workspaces, 
    currentWorkspace, 
    switchWorkspace, 
    users, 
    currentUser, 
    switchUser,
    currentTab,
    setCurrentTab,
    logout
  } = useApp();

  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showAccountSecurity, setShowAccountSecurity] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'clients', label: 'العملاء', icon: Users },
    { id: 'transactions', label: 'المعاملات', icon: FileText },
    { id: 'templates', label: 'قوالب الخدمات', icon: FolderOpen },
    { id: 'documents', label: 'المستندات', icon: FileText }, // Will show custom styling
    { id: 'tasks', label: 'المهام والتقويم', icon: CalendarRange },
    { id: 'accounts', label: 'الحسابات والمدفوعات', icon: CreditCard },
    { id: 'activity', label: 'سجل الأنشطة والتدقيق', icon: FileClock },
  ];

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner': return 'مالك المكتب';
      case 'admin': return 'مدير النظام';
      case 'employee': return 'موظف متابعة';
      case 'accountant': return 'محاسب المكتب';
      case 'viewer': return 'مشاهد (قراءة فقط)';
      default: return 'عضو';
    }
  };

  return (
    <>
    {sidebarOpen && (
      <button
        type="button"
        aria-label="إغلاق القائمة الجانبية"
        className="fixed inset-0 z-30 bg-[#071729]/45 backdrop-blur-[1px] md:hidden"
        onClick={() => setSidebarOpen?.(false)}
      />
    )}
    <aside
      id="sidebar-container"
      aria-label="التنقل الرئيسي"
      className={`fixed inset-y-0 right-0 z-40 flex h-dvh w-68 shrink-0 flex-col overflow-y-auto border-l border-white/5 bg-[#0F2742] font-sans text-white shadow-2xl transition-transform duration-300 md:relative md:z-30 md:h-screen md:translate-x-0 md:shadow-none ${sidebarOpen ? 'translate-x-0 visible' : 'translate-x-full invisible md:visible'}`}
    >
      {/* Brand Header */}
      <div id="brand-header" className="p-6 flex items-center gap-3 border-b border-white/10">
        <div className="w-10 h-10 bg-[#1597B8] rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-[#1597B8]/20">
          ر
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-bold text-white tracking-wide">رتّب</span>
          <span className="text-[10px] text-white/40 font-mono tracking-wider">SMART MU'AQQEB</span>
        </div>
        <button
          type="button"
          aria-label="إغلاق القائمة الجانبية"
          onClick={() => setSidebarOpen?.(false)}
          className="mr-auto rounded-lg p-2 text-white/60 transition hover:bg-white/10 hover:text-white md:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Workspace Selector */}
      <div id="workspace-selector-box" className="px-4 py-3 border-b border-white/5 relative">
        <button 
          onClick={() => {
            setShowWorkspaceDropdown(false);
            setShowUserDropdown(false);
          }}
          className="w-full flex items-center justify-between p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10 text-right text-xs"
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <Building2 className="w-4 h-4 text-[#1597B8] shrink-0" />
            <div className="truncate">
              <p className="text-white/60 text-[9px] font-medium">مساحة العمل النشطة</p>
              <p className="font-bold text-white truncate">{currentWorkspace.name}</p>
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 text-white/50 transition-transform ${showWorkspaceDropdown ? 'rotate-180' : ''}`} />
        </button>

        {showWorkspaceDropdown && (
          <div className="absolute right-4 left-4 mt-2 bg-[#162f4c] border border-white/10 rounded-xl shadow-2xl z-50 p-1.5 max-h-48 overflow-y-auto">
            <p className="text-[10px] text-white/40 px-3 py-1 font-bold">اختر مساحة عمل أخرى:</p>
            {workspaces.map(ws => (
              <button
                key={ws.id}
                onClick={() => {
                  switchWorkspace(ws.id);
                  setShowWorkspaceDropdown(false);
                }}
                className={`w-full text-right p-2 rounded-lg text-xs transition-colors flex items-center gap-2 ${
                  ws.id === currentWorkspace.id 
                    ? 'bg-[#1597B8] text-white font-bold' 
                    : 'text-white/80 hover:bg-white/5'
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-white" />
                <span className="truncate">{ws.name} ({ws.city})</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav id="sidebar-navigation" className="flex-1 p-4 space-y-1.5">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setCurrentTab(item.id);
                setSidebarOpen?.(false);
              }}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-l from-[#1597B8] to-[#1597B8]/70 text-white shadow-lg shadow-[#1597B8]/20 border-r-4 border-white'
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-[#1597B8]/80'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Role Play / Simulation Switcher (CRITICAL for user confidence in testing RBAC) */}
      <div id="role-simulation-box" className="hidden">
        <button
          onClick={() => {
            setShowUserDropdown(false);
            setShowWorkspaceDropdown(false);
          }}
          className="w-full flex items-center justify-between text-right"
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <ShieldCheck className="w-4 h-4 text-yellow-500 shrink-0" />
            <div className="truncate">
              <p className="text-yellow-500 text-[9px] font-bold">محاكاة صلاحيات الأدوار (RBAC)</p>
              <p className="text-[11px] text-white/80 truncate font-semibold">تغيير المستخدم لاختبار الدور</p>
            </div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-yellow-500" />
        </button>

        {showUserDropdown && (
          <div className="absolute right-4 left-4 bottom-24 bg-[#162f4c] border border-white/10 rounded-xl shadow-2xl z-50 p-1.5 max-h-56 overflow-y-auto">
            <p className="text-[10px] text-yellow-500 px-3 py-1 font-bold">اختر مستخدماً لمحاكاة دوره:</p>
            {users.map(u => (
              <button
                key={u.id}
                onClick={() => {
                  switchUser(u.id);
                  setShowUserDropdown(false);
                }}
                className={`w-full text-right p-2.5 rounded-lg text-xs transition-colors flex flex-col ${
                  u.id === currentUser.id 
                    ? 'bg-yellow-500/20 border border-yellow-500/40 text-white font-bold' 
                    : 'text-white/80 hover:bg-white/5'
                }`}
              >
                <span className="font-bold truncate">{u.fullName}</span>
                <span className="text-[9px] text-white/40 font-mono">{getRoleLabel(u.role)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Active User Footer */}
      <div id="active-user-footer" className="p-4 border-t border-white/10 bg-[#071729]">
        <div className="flex items-center gap-3 p-2 bg-white/5 rounded-xl border border-white/10">
          <img 
            src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop'} 
            alt={currentUser.fullName} 
            className="w-10 h-10 rounded-full border-2 border-[#1597B8] object-cover shrink-0"
            referrerPolicy="no-referrer"
          />
          <div className="overflow-hidden flex-1">
            <p className="text-white text-sm font-bold truncate leading-tight">{currentUser.fullName}</p>
            <span className="inline-block mt-0.5 text-[9px] font-bold text-[#23B78D] bg-[#23B78D]/10 px-1.5 py-0.5 rounded">
              {getRoleLabel(currentUser.role)}
            </span>
          </div>
        </div>
        <button onClick={() => void logout()} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-white/70 transition hover:bg-white/10 hover:text-white">
          <LogOut className="h-4 w-4" />
          تسجيل الخروج
        </button>
        <button onClick={() => setShowAccountSecurity(true)} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-white/70 transition hover:bg-white/10 hover:text-white">
          <ShieldCheck className="h-4 w-4" />
          أمان الحساب
        </button>
      </div>
      {showAccountSecurity && <AccountSecurity onClose={() => setShowAccountSecurity(false)} />}
    </aside>
    </>
  );
};
