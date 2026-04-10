/**
 * Auth helpers — reads/writes localStorage with token expiry validation.
 * Tokens are JWTs — we decode the exp claim client-side to detect expiry
 * without making a network call.
 */

function decodeJwt(token: string): { exp?: number; role?: string; username?: string; id?: string } | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const decoded = decodeJwt(token);
  if (!decoded?.exp) return true;
  // Add 30s buffer to account for clock skew
  return Date.now() / 1000 > decoded.exp - 30;
}

export const auth = {
  getToken(): string {
    const token = localStorage.getItem('lh_token') || '';
    if (token && isTokenExpired(token)) {
      // Auto-clear expired token
      this.logout();
      return '';
    }
    return token;
  },

  getUsername: () => localStorage.getItem('lh_username') || 'Anonymous',
  getRole:     () => localStorage.getItem('lh_role') || 'mentee',

  isLoggedIn(): boolean {
    const token = localStorage.getItem('lh_token');
    if (!token) return false;
    if (isTokenExpired(token)) {
      this.logout();
      return false;
    }
    return true;
  },

  logout() {
    localStorage.removeItem('lh_token');
    localStorage.removeItem('lh_username');
    localStorage.removeItem('lh_role');
  },
};
