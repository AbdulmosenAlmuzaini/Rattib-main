import React, { useState } from 'react';
import { LockKeyhole, Mail, LoaderCircle } from 'lucide-react';

export function Login({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState('owner@rattib.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
        return;
      }
      onSuccess();
    } catch {
      setError('تعذر الاتصال بالخادم. حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main dir="rtl" className="min-h-screen bg-[#F4F7FA] flex items-center justify-center p-6">
      <section className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl border border-slate-100">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-[#0F2742] text-2xl font-black text-white">ر</div>
          <h1 className="text-2xl font-black text-[#0F2742]">تسجيل الدخول إلى رتّب</h1>
          <p className="mt-2 text-sm text-slate-500">أدخل بيانات حساب مكتبك للمتابعة</p>
        </div>
        <form onSubmit={submit} className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-700">البريد الإلكتروني</span>
            <span className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 focus-within:border-[#1597B8]">
              <Mail className="h-5 w-5 text-slate-400" />
              <input required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-transparent py-3 outline-none" />
            </span>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-700">كلمة المرور</span>
            <span className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 focus-within:border-[#1597B8]">
              <LockKeyhole className="h-5 w-5 text-slate-400" />
              <input required minLength={10} type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-transparent py-3 outline-none" />
            </span>
          </label>
          {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
          <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1597B8] py-3 font-black text-white transition hover:bg-[#117f9c] disabled:opacity-60">
            {loading && <LoaderCircle className="h-5 w-5 animate-spin" />}
            دخول آمن
          </button>
        </form>
      </section>
    </main>
  );
}
