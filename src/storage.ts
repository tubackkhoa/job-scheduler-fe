const TOKEN_KEY = 'access_token';
const TOKEN_TYPE = 'token_type';
const LAYOUT_KEY = 'portal-layout';
const PANEL_OPEN_KEY = 'panel_open';

type LayoutState = {
  order: number[];
  hidden: number[];
};

export default {
  getToken(): LoginResponse {
    return {
      access_token: localStorage.getItem(TOKEN_KEY),
      token_type: localStorage.getItem(TOKEN_TYPE),
    };
  },
  setToken(response: LoginResponse) {
    localStorage.setItem(TOKEN_KEY, response.access_token);
    localStorage.setItem(TOKEN_TYPE, response.token_type);
  },
  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_TYPE);
  },
  saveUser(user: User) {
    localStorage.setItem('user', JSON.stringify(user));
  },
  getUser(): User | null {
    try {
      const raw = localStorage.getItem('user');
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
  clearUser() {
    localStorage.removeItem('user');
  },
  getLanguage(): string {
    return localStorage.getItem('lang');
  },
  saveLanguage(lang: string) {
    localStorage.setItem('lang', lang);
  },

  saveLayout(state: LayoutState) {
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(state));
  },
  loadLayout(): LayoutState {
    const defaultLayout = { order: [], hidden: [] };
    try {
      const raw = localStorage.getItem(LAYOUT_KEY);
      return JSON.parse(raw) ?? defaultLayout;
    } catch {
      return defaultLayout;
    }
  },
  resetStoredLayout() {
    localStorage.removeItem(LAYOUT_KEY);
  },

  getPanelOpen(): boolean {
    try {
      const raw = localStorage.getItem(PANEL_OPEN_KEY);
      return JSON.parse(raw);
    } catch {
      return true;
    }
  },
  setPanelOpen(open: boolean) {
    localStorage.setItem(PANEL_OPEN_KEY, JSON.stringify(open));
  },
};
