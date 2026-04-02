import * as SecureStore from "expo-secure-store";
import { AuthTokens } from "./types";

const ACCESS_KEY = "auth_access_token";
const REFRESH_KEY = "auth_refresh_token";

export async function saveTokens(tokens: AuthTokens) {
  await SecureStore.setItemAsync(ACCESS_KEY, tokens.accessToken);
  await SecureStore.setItemAsync(REFRESH_KEY, tokens.refreshToken);
}

export async function readTokens(): Promise<AuthTokens | null> {
  const accessToken = await SecureStore.getItemAsync(ACCESS_KEY);
  const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

export async function clearTokens() {
  await SecureStore.deleteItemAsync(ACCESS_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}
