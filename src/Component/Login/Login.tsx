
import { DEFAULT_COOKIE_GETTER } from '../../helper/Cookie';
import React, { useEffect, useState } from 'react'
import { useNavigate } from "react-router-dom";

import LoginInfo from './LoginInfo';
import DashBoard from '../Dashboard/Dashboard';
import { Provider } from 'react-redux';
import rootStore from '../../redux/store';

const page = () => {
  
  const [loading, setLoading] = useState(true);
  const push:any = useNavigate();
    
  const [accessToken, setAccessToken] = useState<string | null>("");

  useEffect(() => {
    async function fetchData() {
  
      const access_object = await DEFAULT_COOKIE_GETTER("access_token");
  
      if (access_object && access_object && access_object !== null) {

        setAccessToken(access_object);
        push("/dashboard");
      }

  
      setLoading(false);
    }

    fetchData();
  }, []);


  if (loading) {
    return null; 
  }

  return (
    <>
      {
        accessToken == "" || accessToken == null || !accessToken ?
          <LoginInfo></LoginInfo>
          :
          (<>
          <DashBoard></DashBoard>
         
         </>
          )
          
      }
    </>
  );
}

export default page;
