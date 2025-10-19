
import axios from "axios";
import { refreshTokenIfNeeded, getAccessToken } from "./tokenManager";

export default async function getApi(url: string, params: any, headers: any = {}) {
  let getdata = {};
  const API_URL = import.meta.env.VITE_API_URL;
  
  try {
    // Check and refresh token if needed before making the request
    const tokenValid = await refreshTokenIfNeeded();
    if (!tokenValid) {
      return { error: "Authentication failed" };
    }

    // Get the current access token
    const accessToken = await getAccessToken();
    const defaultHeaders = {
      Authorization: `Bearer ${accessToken}`,
      ...headers
    };

    getdata = await axios
      .get(`${API_URL}${url}/${params}`, { headers: defaultHeaders })
      .then((response: any) => {
        if (response.status == 200 || response.status == 201) {
          let results = response.data;
          return results;
        }
      })
      .catch((error: any) => {
        return error.code == "ERR_BAD_REQUEST" ? {} : error;
      });
  } catch (e) {
    console.log(e);
  }
  return getdata;
}
