import { API_URL } from '../config';

// Thin wrapper around fetch: prefixes the API base URL, handles JSON
// encoding/decoding, and attaches the Authorization header when a token is given.
const request = async (path, { method = 'GET', token, body } = {}) => {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    // Response had no JSON body
  }

  return { ok: response.ok, status: response.status, data };
};

export const api = {
  get: (path, token) => request(path, { token }),
  post: (path, body, token) => request(path, { method: 'POST', body, token }),
  put: (path, body, token) => request(path, { method: 'PUT', body, token }),
  delete: (path, token) => request(path, { method: 'DELETE', token })
};
