import { auth } from './firebase.js';

export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  if (auth.authStateReady) {
    try {
      await auth.authStateReady();
    } catch {
      // ignore error
    }
  }
  let token = '';
  if (auth.currentUser) {
    try {
      token = await auth.currentUser.getIdToken();
    } catch {
      token = '';
    }
  }

  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Ensure content-type is json if body is stringified json
  if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401 && auth.currentUser) {
    try {
      const newToken = await auth.currentUser.getIdToken(true);
      if (newToken && newToken !== token) {
        const retryHeaders = new Headers(options.headers || {});
        retryHeaders.set('Authorization', `Bearer ${newToken}`);
        if (options.body && typeof options.body === 'string' && !retryHeaders.has('Content-Type')) {
          retryHeaders.set('Content-Type', 'application/json');
        }
        const retryResponse = await fetch(url, {
          ...options,
          headers: retryHeaders,
        });
        if (retryResponse.status !== 401) {
          return retryResponse;
        }
      }
    } catch {
      // Refresh failed
    }

    try {
      await auth.signOut();
    } catch {
      // ignore sign out error
    }
  }

  return response;
}

export async function getDeploymentProfile(): Promise<string> {
  try {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/v1/config`);
    if (!res.ok) return 'local-lite';
    const data = await res.json();
    return data.deploymentProfile || 'local-lite';
  } catch (err) {
    return 'local-lite';
  }
}
