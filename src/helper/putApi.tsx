

import axios from "axios";
import { refreshTokenIfNeeded, getAccessToken } from "./tokenManager";

export default async function putApi(url: string, values: string, headers: object) {
  let data: any = {};
  let error: any = {};
  const API_URL = import.meta.env.VITE_API_URL;

  try {
    // Check and refresh token if needed before making the request
    const tokenValid = await refreshTokenIfNeeded();
    if (!tokenValid) {
      error.message = "Authentication failed";
      return { data, error };
    }

    // Get the current access token
    const accessToken = await getAccessToken();
    const defaultHeaders = {
      Authorization: `Bearer ${accessToken}`,
      ...headers
    };

    const response = await axios.put(`${API_URL}${url}/${values}`, {}, { headers: defaultHeaders });

    // Checking response status
    if (response.status === 200 || response.status === 201) {
      data = response.data;
    } else {
      error.message = "Unexpected response status: " + response.status;
    }
  } catch (e: any) {
    // Handling Axios errors
    if (e.response && e.response.status === 503) {
      error.message = "Server is currently unavailable. Please try again later.";
    } else if (e.response && e.response.status === 401) {
      error.message = e.response.data.message || "Unauthorized";
    } else if (e.code === "ECONNREFUSED" || e.code === "ERR_NETWORK") {
      error.message = "Server is currently unavailable. Please try again later.";
    } else {
      error.message = "An error occurred while updating data.";
    }
  }

  return { data, error };
}
