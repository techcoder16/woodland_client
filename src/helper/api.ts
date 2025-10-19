import axios from "axios";
import { refreshTokenIfNeeded, getAccessToken } from "./tokenManager";
import { DEFAULT_COOKIE_GETTER, DEFAULT_COOKIE_SETTER, DEFAULT_COOKIE_DELETE } from "./Cookie";

const API_URL = import.meta.env.VITE_API_URL;

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axiosInstance(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshTokenValue = await DEFAULT_COOKIE_GETTER("refresh_token");
        
        if (!refreshTokenValue) {
          throw new Error("No refresh token available");
        }

        const response = await axios.post(`${API_URL}auth/refresh`, {}, {
          headers: {
            Authorization: `Bearer ${refreshTokenValue}`,
            'Content-Type': 'application/json'
          }
        });

        // Handle different possible response formats
        const responseData = response.data;
        const accessToken = responseData.accessToken || responseData.access_token;
        const newRefreshToken = responseData.refreshToken || responseData.refresh_token;
        
        if (!accessToken) {
          throw new Error('No access token received from refresh endpoint');
        }
        
        await DEFAULT_COOKIE_SETTER("access_token", accessToken, false);
        if (newRefreshToken) {
          await DEFAULT_COOKIE_SETTER("refresh_token", newRefreshToken, false);
        }

        processQueue(null, accessToken);
        
        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axiosInstance(originalRequest);
        
      } catch (refreshError) {
        processQueue(refreshError, null);
        
        // Clear tokens and redirect to login
        await DEFAULT_COOKIE_DELETE("access_token");
        await DEFAULT_COOKIE_DELETE("refresh_token");
        await DEFAULT_COOKIE_DELETE("user");
        
        // Redirect to login page
        window.location.href = "/";
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

interface ApiResponse<T> {
  data: T | null;
  error: { message: string } | null;
}

async function request<T>(
  method: "post" | "patch" | "put" | "delete",
  url: string,
  values?: object,
  headers?: Record<string, string>
): Promise<ApiResponse<T>> {
  let data: T | null = null;
  let error: { message: string } | null = null;

  try {
    // Check and refresh token if needed before making the request
    const tokenValid = await refreshTokenIfNeeded();
    if (!tokenValid) {
      error = { message: "Authentication failed" };
      return { data, error };
    }

    const defaultHeaders: Record<string, string> = {
      Accept: "application/json",
    };

    // Only set Content-Type to JSON if it's not FormData
    // FormData needs to set its own Content-Type with boundary
    if (!(values instanceof FormData)) {
      defaultHeaders["Content-Type"] = "application/json";
    }

    const mergedHeaders = {
      ...defaultHeaders,
      ...(headers || {}),
    };

    // Make the axios request using the instance with interceptors
    const response = await axiosInstance.request<T>({
      method,
      url,
      data: values,
      headers: mergedHeaders,
    });
    
    // Success status check
    if (response.status >= 200 && response.status < 300) {
      data = response.data;
    } else {
      error = { message: `Unexpected response status: ${response.status}` };
    }
  } catch (e: any) {
    if (e.response) {
      console.log("API Error Response:", e.response);
      
      // For validation errors (422), throw the full error so we can parse it properly in the calling code
      if (e.response.status === 422 && e.response.data) {
        throw e;
      }
      
      switch (e.response.status) {
        case 400:
          error = { message: e.response.data.error || "Bad Request" };
          break;
        case 422:
          error = { message: e.response.data.error || "Validation Error" };
          break;
        case 401:
          error = { message: e.response.data.error || "Unauthorized" };
          break;
        case 403:
          error = { message: "Forbidden" };
          break;
        case 404:
          error = { message: "Not Found" };
          break;
        case 503:
          error = { message: "Server is currently unavailable. Please try again later." };
          break;
        default:
          error = { message: e.response.data.error || "An error occurred" };
          break;
      }
    } else if (e.code === "ECONNREFUSED" || e.code === "ERR_NETWORK") {
      error = { message: "Server is currently unavailable. Please try again later." };
    } else {
      error = { message: "An unknown error occurred." };
    }
  }

  return { data, error };
}

// GET request function
async function getRequest<T>(
  url: string,
  headers?: Record<string, string>
): Promise<ApiResponse<T>> {
  let data: T | null = null;
  let error: { message: string } | null = null;

  try {
    // Check and refresh token if needed before making the request
    const tokenValid = await refreshTokenIfNeeded();
    if (!tokenValid) {
      error = { message: "Authentication failed" };
      return { data, error };
    }

    const defaultHeaders: Record<string, string> = {
      Accept: "application/json",
    };

    const mergedHeaders = {
      ...defaultHeaders,
      ...(headers || {}),
    };

    // Make the axios request using the instance with interceptors
    const response = await axiosInstance.get<T>(url, {
      headers: mergedHeaders,
    });
    
    // Success status check
    if (response.status >= 200 && response.status < 300) {
      data = response.data;
    } else {
      error = { message: `Unexpected response status: ${response.status}` };
    }
  } catch (e: any) {
    if (e.response) {
        console.log(e.response)
      switch (e.response.status) {
        case 400:
          error = { message: e.response.data.error || "Bad Request" };
          break;
        case 422:
          error = { message: e.response.data.error || "Unauthorized" };
          break;
        case 401:
          error = { message: e.response.data.error || "Unauthorized" };
          break;
        case 403:
          error = { message: "Forbidden" };
          break;
        case 404:
          error = { message: "Not Found" };
          break;
        case 503:
          error = { message: "Server is currently unavailable. Please try again later." };
          break;
        default:
          error = { message: e.response.data.error || "An error occurred" };
          break;
      }
    } else if (e.code === "ECONNREFUSED" || e.code === "ERR_NETWORK") {
      error = { message: "Server is currently unavailable. Please try again later." };
    } else {
      error = { message: "An unknown error occurred." };
    }
  }

  return { data, error };
}

export async function get<T>(url: string, headers?: Record<string, string>) {
  return getRequest<T>(url, headers);
}

export async function post<T>(url: string, values: object, headers?: Record<string, string>) {
  return request<T>("post", url, values, headers);
}

export async function patch<T>(url: string, values: object, headers?: Record<string, string>) {
  return request<T>("patch", url, values, headers);
}

export async function put<T>(url: string, values: object, headers?: Record<string, string>) {
  return request<T>("put", url, values, headers);
}

export async function del<T>(url: string, headers?: Record<string, string>) {
  return request<T>("delete", url, undefined, headers);
}

