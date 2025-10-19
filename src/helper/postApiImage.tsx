import axios from "axios";
import { refreshTokenIfNeeded, getAccessToken } from "./tokenManager";

export default async function postApiImage(
  url: string,
  values: object,
  headers: any = {},
  files: any[] = [] // Accept files as an array
) {
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

    // Create a FormData object
    const formData = new FormData();

    // Append the values (non-file data)
    Object.keys(values).forEach((key) => {
      formData.append(key, values[key]);
    });

    // Append files to FormData
    if (files.length > 0) {
      files.forEach((file: any) => {
        formData.append("files", file);  // You can change 'files' to whatever field name the server expects
      });
    }

    // If headers are provided, include them, but don't overwrite Content-Type because FormData will automatically set it
    const config = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...headers,
        // Do NOT manually set Content-Type as it will be automatically set by FormData
      },
    };

    // Make the API request
    const response = await axios.post(`${API_URL}${url}`, formData, config);

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
      error.message = "An error occurred while fetching data.";
      console.log(e);
    }
  }

  return { data, error };
}
