export function sanitizeText(value) {
  return String(value ?? '').replace(/[<>]/g, '').trim().slice(0, 100);
}

export function sanitizeAccountId(value) {
  const candidate = String(value ?? '').trim();
  return /^[a-fA-F0-9-]{36}$/.test(candidate) ? candidate : null;
}

export function buildApiUrl(path) {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
  const normalizedPath = String(path ?? '').replace(/[^a-zA-Z0-9/_:-]/g, '');
  return `${API_URL}${normalizedPath}`;
}
