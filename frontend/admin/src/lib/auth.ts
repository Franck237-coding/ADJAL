import { setAuthTokenGetter } from "@adjal/api-contract/react";

export const TOKEN_KEY = "adjal_admin_token";

export function getAuthToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

// Register with the shared API client
setAuthTokenGetter(getAuthToken);
