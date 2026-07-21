import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { Bell, Menu, X, Check, Clock, ChevronLeft } from 'lucide-react';
import { AppNotification } from '../types';

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  onNotificationNavigate: (notification: AppNotification) => void;
}

export const Header: React.FC<HeaderProps> = ({ sidebarOpen, setSidebarOpen, onNotificationNavigate }) => {
  const { notifications, markNotificationAsRead, currentUser } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadNotifications = notifications.filter(n => !n.isRead);

  const handleNotificationClick = async (notification: AppNotification) => {
    if (!notification.isRead) await markNotificationAsRead(notification.id);
    setShowNotifications(false);
    onNotificationNavigate(notification);
  };

  return (
    <header className="h-16 border-b border-gray-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-4 md:px-6 z-20 shrink-0 font-sans text-right" dir="rtl">
      {/* Right side: Mobile toggle & Disclaimer */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          type="button"
          aria-label={sidebarOpen ? 'إغلاق القائمة الجانبية' : 'فتح القائمة الجانبية'}
          aria-expanded={sidebarOpen}
          aria-controls="sidebar-container"
          className="p-1.5 text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl md:hidden shrink-0 cursor-pointer"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Left side: Notification Center */}
      <div className="flex items-center gap-4 relative">
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            type="button"
            aria-label="فتح مركز الإشعارات"
            aria-expanded={showNotifications}
            className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors relative cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4.5 h-4.5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[8px] text-white font-bold leading-none">
                {unreadNotifications.length}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotifications && (
            <div className="absolute left-0 mt-2 w-[calc(100vw-2rem)] max-w-80 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 p-3 overflow-hidden text-right">
              <div className="flex justify-between items-center pb-2 border-b border-gray-100 mb-2">
                <span className="font-black text-xs text-[#0F2742]">التنبيهات والإشعارات التلقائية</span>
                {unreadNotifications.length > 0 && (
                  <span className="text-[9px] bg-[#1597B8]/10 text-[#1597B8] px-2 py-0.5 rounded-full font-bold">
                    {unreadNotifications.length} جديد
                  </span>
                )}
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-0.5">
                {notifications.map(n => (
                  <div
                    key={n.id} 
                    className={`rounded-xl text-xs border transition-all ${
                      n.isRead 
                        ? 'bg-gray-50 border-gray-100 opacity-60' 
                        : 'bg-orange-50/20 border-orange-100'
                    }`}
                  >
                    <div className="flex items-start gap-1 p-2.5">
                      <button
                        type="button"
                        onClick={() => void handleNotificationClick(n)}
                        className="min-w-0 flex-1 text-right cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1597B8]"
                        aria-label={`فتح التنبيه: ${n.title}`}
                      >
                        <span className="flex items-start justify-between gap-2">
                          <span className={`font-bold text-[11px] ${n.isRead ? 'text-gray-500' : 'text-[#0F2742]'}`}>
                            {n.title}
                          </span>
                          <ChevronLeft className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#1597B8]" />
                        </span>
                        <span className="block text-[10px] text-gray-500 mt-1 leading-normal">{n.message}</span>
                        <span className="text-[8px] text-gray-400 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {new Date(n.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </button>
                      {!n.isRead && (
                        <button 
                          type="button"
                          onClick={() => void markNotificationAsRead(n.id)}
                          className="p-0.5 bg-white border border-orange-200 rounded text-[9px] text-orange-600 font-bold hover:bg-orange-50 cursor-pointer flex items-center"
                          title="تحديد كمقروء"
                          aria-label={`تحديد التنبيه كمقروء: ${n.title}`}
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {notifications.length === 0 && (
                  <p className="text-center py-6 text-gray-400 text-xs">لا توجد تنبيهات جديدة حالياً.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
