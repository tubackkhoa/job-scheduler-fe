const TOKEN_KEY = 'access_token';
const TOKEN_TYPE = 'token_type';

export function getToken(): LoginResponse {
  return {
    access_token: localStorage.getItem(TOKEN_KEY),
    token_type: localStorage.getItem(TOKEN_TYPE)
  };
}

export function setToken(response: LoginResponse) {
  localStorage.setItem(TOKEN_KEY, response.access_token);
  localStorage.setItem(TOKEN_TYPE, response.token_type);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_TYPE);
}
