const KEY = 'haveli_token';

export const getToken = () => {
  try { return localStorage.getItem(KEY); } catch { return null; }
};
export const setToken = (t) => {
  try { t ? localStorage.setItem(KEY, t) : localStorage.removeItem(KEY); } catch { /* storage blocked */ }
};

export async function api(path, method = 'GET', body) {
  const token = getToken();
  const res = await fetch('/api' + path, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  let data = {};
  try { data = await res.json(); } catch { /* empty body */ }
  const isAuthCall = path.startsWith('/auth/login') || path.startsWith('/auth/signup');
  if (res.status === 401 && !isAuthCall) {
    setToken(null);
    window.dispatchEvent(new Event('auth:logout'));
  }
  if (!res.ok) throw new Error(data.error || 'Something went wrong. Try again.');
  return data;
}
