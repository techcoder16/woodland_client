

import axios from "axios";
import env from "react-dotenv";
export default async function deleteApi(url: string,headers: object) {
  let data: any = {};
  let error: any = {};
  const API_URL = import.meta.env.VITE_API_URL;  // Accessing the environment variable

  try {
    // Making the POST request using Axios
    const response = await axios.delete(`${API_URL}${url}`, {
      headers: headers, // Include headers such as authentication tokens
    });

    

    // Checking response status
    if (response.status === 200 || response.status === 201) {
      data = response.data;
      

    } else {
      error.message = "Unexpected response status: " + response.status;
    }
  } catch (e: any) {
    // Handling Axios errors

  
    if ( e.response && e.response.status === 400)
    {  console.log(typeof e.response.status)

      error.message = e.response.data.message;

    }
   else if (e.response && e.response.status === 503) {
   
      error.message = "Server is currently unavailable. Please try again later.";
    } else if (e.response && e.response.status === 401) {
       
      error.message = e.response.data.message|| "Unauthorized";

    } else if (e.code === "ECONNREFUSED" || e.code === "ERR_NETWORK") {
      
             
      error.message = "Server is currently unavailable. Please try again later.";

    } else {
      error.message = "An error occurred while fetching data.";
    }
  }
console.log(error)
  return { data, error };
}
