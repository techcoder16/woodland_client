
import postApi from "../helper/postApi";
import getApi from "../helper/getApi";
import { DEFAULT_COOKIE_GETTER } from "../helper/Cookie";
import toast from "react-hot-toast";


export async function ValidationUserCreate(values:any) {
    const errors = verify_user_create({}, values);
  
    return errors;
  }
  
  async function verify_user_create(error = {}, values:any) {
    const Values = {
      username: values.username,
      password: values.password,
      name:values.name,
      email: values.email,
    };
  
    const activationToken = await DEFAULT_COOKIE_GETTER("access_token");
    const headers = {
      "Authorization": `Bearer ${activationToken}`,
      "Accept": "*/*",
      "Access-Control-Allow-Origin": "true",
    };
    
    
    const data:any = await postApi("auth/create-user", Values,headers);
   
    return data.data.message || data.error.message;


  }
  
  export async function ValidateTeamUser(values:any) {
    
    const errors = verify_user_team_update({}, values);
  
    return errors;
  }
  
  async function verify_user_team_update(error = {}, values:any) {
    
    const Values = {
      user: values.user,
      email:values.email
      
    };
    
    const activationToken = await DEFAULT_COOKIE_GETTER("access_token");
    const headers = {
      "Authorization": `Bearer ${activationToken}`,
      "Accept": "*/*",
      "Access-Control-Allow-Origin": "true",
    };

    await postApi("auth/update_team", Values,headers);
  }
  

  export async function ValidationAuthUserCreate(values:any) {
    const errors = verify_auth_screen({}, values);
  
    return errors;
  }
  
  async function verify_auth_screen(error = {}, values:any) {
    const data = await getApi(
      "screen/get_screen_id_by_name",
      values.screen_name
    );
    const userData:any = await getApi("auth/get_id_name", values.username);
  
    const Values:any = {
        username: userData ? userData._id : undefined,
        screen_name: userData ? userData._id : undefined,

    };
      const activationToken = await DEFAULT_COOKIE_GETTER("access_token");
    const headers = {
      "Authorization": `Bearer ${activationToken}`,
      "Accept": "*/*",
      "Access-Control-Allow-Origin": "true",
    };
    
    
    const value:any  = await postApi("auth/create_auth_screens", Values,headers);
    return value.data.message || value.error.message;
    
  }
  
  export async function ValiadateUserUpdate(values:any) {
    const errors = verify_user_update_settings({}, values);
  
    return errors;
  }
  
  async function verify_user_update_settings(error = {}, values:any) {
    const data = localStorage.getItem("user_data");
    const newData = JSON.parse(data || '{}');
  
    const Values = {
      username: newData.username,
      password: values.password,
  
      company: values.company,
  
      email: values.email,
      name: values.name,
      website: values.website,
    };
  
    const value:any  =   await postApi("auth/update_user_settings", Values);
    return value.data.message || value.error.message;
    
  }
  

  
  