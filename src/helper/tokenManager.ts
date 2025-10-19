import { DEFAULT_COOKIE_GETTER, DEFAULT_COOKIE_SETTER, DEFAULT_COOKIE_DELETE } from "./Cookie";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

// Function to check if access token is expired or about to expire
export async function isTokenExpired(): Promise<boolean> {
  try {
    const tokenExpiry = await DEFAULT_COOKIE_GETTER("token_expiry");
    if (!tokenExpiry) return true;
    
    const expiryTime = parseInt(tokenExpiry);
    const currentTime = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = expiryTime - currentTime;
    
    // For very short token lifetimes, refresh much earlier
    // If token expires in less than 1 second, consider it expired
    return timeUntilExpiry <= 1;
  } catch (error) {
    console.error('Error checking token expiry:', error);
    return true;
  }
}

// Function to refresh token proactively
export async function refreshTokenIfNeeded(): Promise<boolean> {
  try {
    if (!(await isTokenExpired())) {
      return true; // Token is still valid
    }

    const refreshTokenValue = await DEFAULT_COOKIE_GETTER("refresh_token");
    if (!refreshTokenValue) {
      console.error('No refresh token available');
      return false;
    }

    console.log('Refreshing token due to expiry...');
    const response = await axios.post(`${API_URL}auth/refresh`, {}, {
      headers: {
        Authorization: `Bearer ${refreshTokenValue}`,
        'Content-Type': 'application/json'
      }
    });

    const responseData = response.data;
    const accessToken = responseData.accessToken || responseData.access_token;
    const newRefreshToken = responseData.refreshToken || responseData.refresh_token;
    const expiresIn = responseData.expiresIn || responseData.expires_in;

    if (!accessToken) {
      throw new Error('No access token received from refresh endpoint');
    }

    // Calculate expiry time
    const expiryTime = Math.floor(Date.now() / 1000) + (expiresIn || 3600);
    
    await DEFAULT_COOKIE_SETTER("access_token", accessToken, false);
    await DEFAULT_COOKIE_SETTER("token_expiry", expiryTime.toString(), false);
    
    if (newRefreshToken) {
      await DEFAULT_COOKIE_SETTER("refresh_token", newRefreshToken, false);
    }

    console.log('Token refreshed successfully, new expiry:', new Date(expiryTime * 1000).toLocaleTimeString());
    return true;
  } catch (error) {
    console.error('Token refresh failed:', error);
    
    // Clear tokens and redirect to login
    await DEFAULT_COOKIE_DELETE("access_token");
    await DEFAULT_COOKIE_DELETE("refresh_token");
    await DEFAULT_COOKIE_DELETE("token_expiry");
    await DEFAULT_COOKIE_DELETE("user");
    
    window.location.href = "/";
    return false;
  }
}

// Function to get current access token
export async function getAccessToken(): Promise<string | null> {
  return await DEFAULT_COOKIE_GETTER("access_token");
}

// Function to get token expiry information for debugging
export async function getTokenInfo(): Promise<{expiry: number, timeLeft: number, isExpired: boolean} | null> {
  try {
    const tokenExpiry = await DEFAULT_COOKIE_GETTER("token_expiry");
    if (!tokenExpiry) return null;
    
    const expiryTime = parseInt(tokenExpiry);
    const currentTime = Math.floor(Date.now() / 1000);
    const timeLeft = expiryTime - currentTime;
    
    return {
      expiry: expiryTime,
      timeLeft: timeLeft,
      isExpired: timeLeft <= 1
    };
  } catch (error) {
    console.error('Error getting token info:', error);
    return null;
  }
}

// Function to store tokens after login
export async function storeTokens(loginData: any): Promise<void> {
  const { accessToken, refreshToken, expiresIn } = loginData;
  
  if (!accessToken) {
    throw new Error('No access token received');
  }

  // Calculate expiry time
  const expiryTime = Math.floor(Date.now() / 1000) + (expiresIn || 3600);
  
  await DEFAULT_COOKIE_SETTER("access_token", accessToken, false);
  await DEFAULT_COOKIE_SETTER("token_expiry", expiryTime.toString(), false);
  
  if (refreshToken) {
    await DEFAULT_COOKIE_SETTER("refresh_token", refreshToken, false);
  }
}

// Function to clear all tokens
export async function clearTokens(): Promise<void> {
  await DEFAULT_COOKIE_DELETE("access_token");
  await DEFAULT_COOKIE_DELETE("refresh_token");
  await DEFAULT_COOKIE_DELETE("token_expiry");
  await DEFAULT_COOKIE_DELETE("user");
}

// Function to check token info and handle refresh token expiration
export async function checkTokenInfo(): Promise<boolean> {
  try {
    const tokenInfo = await getTokenInfo();
    
    
    // First, try to refresh the access token if it's expired
    const refreshSuccess = await refreshTokenIfNeeded();
    if (!refreshSuccess) {
      console.log('Token refresh failed, logging out...');
      await clearTokens();
      window.location.href = "/";
      return false;
    }

    // Now check if the refresh token is still valid by calling token-info
    const response = await axios.get(`${API_URL}auth/token-info`, {
      headers: {
        Authorization: `Bearer ${await getAccessToken()}`,
        'Content-Type': 'application/json'
      }
    });

    return true;
  } catch (error: any) {
    console.error('Token info check failed:', error);
    
    // If token-info fails, it means the refresh token is expired
    // Clear all tokens and redirect to login
    console.log('Refresh token expired, logging out...');
    await clearTokens();
    window.location.href = "/";
    return false;
  }
}

// Function to check refresh token expiration specifically
export async function checkRefreshTokenExpiration(): Promise<boolean> {
  try {
    // Try to call token-info endpoint to check if refresh token is still valid
    const response = await axios.get(`${API_URL}auth/token-info`, {
      headers: {
        Authorization: `Bearer ${await getAccessToken()}`,
        'Content-Type': 'application/json'
      }
    });

    return true;
  } catch (error: any) {
    console.error('Refresh token expired or invalid:', error);
    return false;
  }
}

// Function to start periodic token validation
export function startTokenValidation(intervalMinutes: number = 5): NodeJS.Timeout {
  return setInterval(async () => {
    console.log('Performing periodic token validation...');
    
    // First check if refresh token is still valid
    const refreshTokenValid = await checkRefreshTokenExpiration();
    
    if (!refreshTokenValid) {
      console.log('Refresh token expired, logging out...');
      await clearTokens();
      window.location.href = "/";
      return;
    }
    
    // If refresh token is valid, do full token check
    await checkTokenInfo();
  }, intervalMinutes * 60 * 1000);
}

// Function to stop periodic token validation
export function stopTokenValidation(intervalId: NodeJS.Timeout): void {
  clearInterval(intervalId);
}
