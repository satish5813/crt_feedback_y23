// API base:
//  - '' (default): same origin. On Vercel, vercel.json rewrites /api/* to the backend.
//  - VITE_API_BASE can override at build time (e.g. https://api.your-domain.com)
export const API_BASE = import.meta.env.VITE_API_BASE || '';
export const api = (p) => API_BASE + p;

export async function getJSON(path) {
  const r = await fetch(api(path));
  if (!r.ok) throw new Error(`${path} failed (${r.status})`);
  return r.json();
}

// ---- Admin auth (verified by the backend) ----
export const getAdminKey = () => sessionStorage.getItem('crt_admin_key') || '';
export const setAdminKey = (k) => sessionStorage.setItem('crt_admin_key', k);
export const clearAdminKey = () => sessionStorage.removeItem('crt_admin_key');

export async function adminLogin(passcode) {
  const r = await fetch(api('/api/admin/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ passcode }),
  });
  if (r.ok) { setAdminKey(passcode); return true; }
  return false;
}

export async function getJSONAdmin(path) {
  const r = await fetch(api(path), { headers: { 'x-admin-key': getAdminKey() } });
  if (r.status === 401) { clearAdminKey(); throw new Error('unauthorized'); }
  if (!r.ok) throw new Error(`${path} failed (${r.status})`);
  return r.json();
}

export const excelUrl = () => api('/api/export/excel?key=' + encodeURIComponent(getAdminKey()));
