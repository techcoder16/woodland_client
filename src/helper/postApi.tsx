import axios from "axios";
import env from "react-dotenv";
export default async function postApi(url: string, values: object,headers:any = {}) {
  let data: any = {};
  let error: any = {};
  


  try {
    
    const response = await axios.post(`${env.API_URL}${url}` ,values,{headers});

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
    }
  }

  return { data, error };
}