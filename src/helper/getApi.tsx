
import axios from "axios";
import env from "react-dotenv";

export default async function getApi(url: string, params: any,headers:any = {}) {
  let getdata = {};

  try {

    getdata = await axios

      .get( `${env.API_URL}${url}/${params}`,{headers})
      .then((response:any) => {
        if (response.status == 200 || response.status == 201) {
          let results = response.data;
                
          return results;
        }
      })
      .catch((error:any) => {

        return error.code == "ERR_BAD_REQUEST" ? {} : error;
      });
  } catch (e) {
    console.log(e);
        
  }
  return getdata;
}
