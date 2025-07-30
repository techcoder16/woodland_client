import axios from "axios";
import { DEFAULT_COOKIE_GETTER } from "./Cookie";

const API_URL = import.meta.env.VITE_API_URL;

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
    // Retrieve token asynchronously
    const token = await DEFAULT_COOKIE_GETTER("access_token");

    const defaultHeaders: Record<string, string> = {
      Accept: "application/json",
      Authorization: "Bearer " + (token || ""),
      "Content-Type": "application/json",
    };

    const mergedHeaders = {
      ...defaultHeaders,
      ...(headers || {}),
    };

    // Make the axios request
    const response = await axios.request<T>({
      method,
      url: `${API_URL}${url}`,
      data: values,
      headers: mergedHeaders,
    });
    console.log(response)
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
