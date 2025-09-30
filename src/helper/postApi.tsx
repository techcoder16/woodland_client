import axios from "axios";
export default async function postApi(url: string, values: object, headers: any = {}) {
  let data: any = {};
  let error: any = {};


  const API_URL = import.meta.env.VITE_API_URL;  // Accessing the environment variable

  try {

    const response = await axios.post(`${API_URL}${url}`, values, { headers });

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



    }

    else if (e.response && e.response.status === 400) {
      error.message = e.response.data.message || "Unauthorized";
    }


    else if (e.code === "ECONNREFUSED" || e.code === "ERR_NETWORK") {
      error.message = "Server is currently unavailable. Please try again later.";
    } else {
      error.message = "An error occurred while updating data.";

    }
  }

  return { data, error };
}
