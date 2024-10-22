


import React from 'react'
import MenuHeader from '../../Component/MenuHeader'
import SideMenu from '../SideMenu'

import { useEffect, useState } from "react";
import { useContext } from 'react';

import { PageContext } from '../../utils/contexts';



import DetailSummary from '../../Component/DetailSummary/DetailSummary';
import Settings from '../Settings/Settings';
import SummaryDetail from '../Data/SummaryDetail';
import { DEFAULT_COOKIE_DELETE, DEFAULT_COOKIE_GETTER } from '../../helper/Cookie';
import getApi from '../../helper/getApi';
import { useNavigate } from 'react-router-dom';
import EmailPlan from '../Data/EmailPlan';
import VendorList from '../Vendor/VendorList';
const DashBoard = () => {
  const push:any  = useNavigate();

  // let pages = useContext<string> (PageContext);

  const[pages,setPages] = useState("1");
  const [collapse,setCollapse] = useState(true);
useEffect(()=>{

  const interval =   setInterval(async ()=>{
  const activationToken:any = await DEFAULT_COOKIE_GETTER("access_token");
  const headers = {
    Authorization: 'Bearer ' + activationToken,
    Accept: "*/*",
    "Access-Control-Allow-Origin": true,
  };

  if (!activationToken)
  {
    
    push("/Login");
  }
  const response:any = await getApi("auth/test-token","",headers);
  
  if (response && Object.keys(response).length > 0 &&  response?.message === "Token is valid")
  {

  }
  else
  {
    await DEFAULT_COOKIE_DELETE("access_token");
    await DEFAULT_COOKIE_DELETE("user");
   
      push("/Login");

  }

}, 4000);

return ()=>clearInterval(interval);

})
  return (
    <>
    
      <div className=' h-screen bg-transparent'> 
        
      <PageContext.Provider  value={{ pages, setPages,setCollapse }}>
        <MenuHeader ></MenuHeader>
        </PageContext.Provider>
 <div className="  lg:h-screen justify-between">
        {/* <div className={`col-span-1 ${collapse == false ?  "lg:col-span-1 transition-width duration-300 ease-in-out": "lg:col-span-1 transition-width duration-300 ease-in-out"}   bg-[#c8ccc7]   `}>
    
        <PageContext.Provider  value={{ pages, setPages,setCollapse }}>
           <SideMenu></SideMenu>
   
          
        </div>
  */}
        <div className=" ">
     
        {pages == "1"?  
          <VendorList></VendorList>:
            pages ==  "2" ? <DetailSummary></DetailSummary>:pages == "3" && (JSON.parse (localStorage.getItem("user_data") || '{}').role == "Admin" ) ? <><Settings></Settings></> : pages==  "4" ?<SummaryDetail></SummaryDetail>: pages == "5" ? <EmailPlan></EmailPlan> :<></> 

          }
      </div>
      </div>
      </div>
      

      </>
  )
}

export default DashBoard