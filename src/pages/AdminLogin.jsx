import { useState } from 'react';
import BrandBar from '../components/BrandBar.jsx';
import { adminLogin, getAdminKey } from '../api.js';

export function isAdmin() {
  return !!getAdminKey();
}

export default function AdminLogin({ onOk }) {
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!pass) return;
    setBusy(true); setErr('');
    try {
      if (await adminLogin(pass)) onOk();
      else setErr('Incorrect passcode. Please try again.');
    } catch {
      setErr('Could not reach the server. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <BrandBar />
      <form onSubmit={submit} className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8 mt-4">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-klred to-kldark text-white text-2xl flex items-center justify-center">
          &#128274;
        </div>
        <h1 className="text-lg font-bold text-kldark text-center mb-1">Admin Login</h1>
        <p className="text-[12.5px] text-neutral-500 text-center mb-5">CRT Feedback — Reports &amp; Analysis</p>
        <input
          type="password" autoFocus value={pass} onChange={(e) => { setPass(e.target.value); setErr(''); }}
          placeholder="Enter admin passcode"
          className="w-full px-4 py-3 border-[1.5px] border-stone-200 rounded-xl bg-stone-50 focus:bg-white focus:border-klred focus:outline-none mb-3"
        />
        {err && <div className="text-[13px] text-klred mb-3">{err}</div>}
        <button disabled={busy} className="w-full py-3 font-bold text-white rounded-xl bg-gradient-to-r from-kldark to-klred shadow-md shadow-red-200 disabled:opacity-60">
          {busy ? 'Checking…' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
