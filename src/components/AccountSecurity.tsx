import React, { useState } from 'react';
import { KeyRound, LoaderCircle, X } from 'lucide-react';

export function AccountSecurity({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string }>();
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'كلمتا المرور الجديدتان غير متطابقتين.' });
      return;
    }
    setLoading(true);
    setMessage(undefined);
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setMessage({ type: 'error', text: body.error === 'Current password is incorrect' ? 'كلمة المرور الحالية غير صحيحة.' : 'يجب أن تتكون الكلمة الجديدة من 14 رمزاً وتشمل حرفاً كبيراً وصغيراً ورقماً ورمزاً خاصاً.' });
        return;
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage({ type: 'success', text: 'تم تغيير كلمة المرور وإبطال الجلسات القديمة بنجاح.' });
    } catch {
      setMessage({ type: 'error', text: 'تعذر الاتصال بالخادم.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-[#071729]/60 p-4" dir="rtl">
      <section role="dialog" aria-modal="true" aria-labelledby="security-title" className="w-full max-w-md rounded-3xl bg-white p-6 text-[#0F2742] shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#1597B8]/10 text-[#1597B8]"><KeyRound className="h-5 w-5" /></span>
            <div><h2 id="security-title" className="font-black">أمان الحساب</h2><p className="text-xs text-slate-500">تغيير كلمة المرور</p></div>
          </div>
          <button onClick={onClose} aria-label="إغلاق" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm font-bold">كلمة المرور الحالية<input required minLength={10} type="password" autoComplete="current-password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#1597B8]" /></label>
          <label className="block text-sm font-bold">كلمة المرور الجديدة<input required minLength={14} type="password" autoComplete="new-password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#1597B8]" /></label>
          <label className="block text-sm font-bold">تأكيد كلمة المرور<input required minLength={14} type="password" autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#1597B8]" /></label>
          {message && <p role="status" className={`rounded-xl p-3 text-xs font-bold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{message.text}</p>}
          <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1597B8] py-3 font-black text-white disabled:opacity-60">{loading && <LoaderCircle className="h-4 w-4 animate-spin" />}حفظ كلمة المرور</button>
        </form>
      </section>
    </div>
  );
}
