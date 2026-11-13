import axios from "axios";
import { refreshTokenIfNeeded, refreshAccessToken, getAccessToken } from "./tokenManager";
import { extractApiMessage } from "./parseApiError";

const API_URL = import.meta.env.VITE_API_URL;

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_URL,
  // Set VITE_API_TIMEOUT_MS in the client .env to change this (default 30s).
  timeout: Number(import.meta.env.VITE_API_TIMEOUT_MS) || 30000,
});

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
      originalRequest._retry = true;

      // Shared single-flight refresh (also updates token_expiry and only logs the user
      // out on a genuine auth rejection, never on a timeout or network error).
      const refreshed = await refreshAccessToken();
      if (!refreshed) {
        return Promise.reject(error);
      }

      const newToken = await getAccessToken();
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return axiosInstance(originalRequest);
    }

    return Promise.reject(error);
  }
);

interface ApiResponse<T> {
  data: T | null;
  error: { message: string } | null;
}

// OCR and other document work runs far longer than the 10s instance default —
// a file upload was being aborted client-side long before the server answered,
// which surfaced as a generic network error rather than a timeout.
const UPLOAD_TIMEOUT_MS = 300000;

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

    // One key per logical submission: a 401-triggered retry reuses this same
    // axios config/headers object, so it carries the same key automatically.
    // A fresh call to post() (e.g. the user resubmitting the form) gets a new one.
    if (method === "post") {
      defaultHeaders["Idempotency-Key"] = crypto.randomUUID();
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
      ...(values instanceof FormData ? { timeout: UPLOAD_TIMEOUT_MS } : {}),
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
        // Replace axios's "Request failed with status code 422" with the real reason.
        e.message = extractApiMessage(e.response.data) ?? e.message;
        throw e;
      }

      switch (e.response.status) {
        case 400:
          error = { message: extractApiMessage(e.response.data) || "Bad Request" };
          break;
        case 422:
          error = { message: extractApiMessage(e.response.data) || "Validation Error" };
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
          error = { message: extractApiMessage(e.response.data) || "An error occurred" };
          break;
      }
    } else if (e.code === "ECONNABORTED" || e.code === "ETIMEDOUT") {
      error = { message: "The request timed out. Large documents can take a minute — please try again." };
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
          error = { message: extractApiMessage(e.response.data) || "Bad Request" };
          break;
        case 422:
          error = { message: extractApiMessage(e.response.data) || "Validation Error" };
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

