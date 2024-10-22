import React from "react";
import { useState, useEffect } from "react";

import { redirect, useNavigate } from "react-router-dom";
import UserUpdateModal from "./UserUpdateModal";

import { FaEdit } from "react-icons/fa";
import { MdDelete } from "react-icons/md";

import { userData } from "../../redux/dataStore/userSlice";
import { AiOutlineArrowDown } from "react-icons/ai";
import { AiOutlineArrowUp } from "react-icons/ai";
import postApi from "../../helper/postApi";
import "./UserDetail.css";
import { DEFAULT_COOKIE_GETTER } from "../../helper/Cookie";
import deleteApi from "../../helper/deleteApi";
const TeamDetails = ({
  currentItems,


}:any) => {

  
  const [userState, setuserState] = useState({});

  const [showModal, setShowModal] = useState(false);

  useEffect(()=>{
    


  })

  return (
    <>
    {showModal ? (
        <UserUpdateModal
          props={setShowModal}
          userState={userState}
          userData = {userData}
        ></UserUpdateModal>
      ) : null}
      

    <div className="bg-white  rounded-lg border-transparent mt-2 w-full h-full  font-novasans">
      <div className="bg-white py-7 rounded-lg border-transparent mt-2 w-full h-full ">
        <div className="p-5 bg-gray-100">
          <h1 className="text-xl mb-2">Managers's Team</h1>

          <div className="overflow-auto rounded-lg shadow hidden md:block">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
          

                  <th className="px-3 py-7 font-bold text-[#20253F]  font-novasans break-words w-1/2">
                    Email
                  </th>

                  <th className="px-3 py-7 font-bold text-[#20253F]  font-novasans break-words w-1/2">
                    Teams
                  </th>
                

                  <th className="w-32 p-3 text-sm font-semibold tracking-wide text-left"></th>
            
                  
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
             
                {currentItems &&
                  currentItems.map((item:any, index:number) => (
                    
                    <React.Fragment key={index}>
                      <tr className="bg-white">
                    

                       
                      <td className="px-3 py-7 font-bold text-[#20253F]  font-novasans break-words w-1/2">

                        <span className="p-1.5 text-sm font-medium rounded-lg bg-opacity-50">
                          {item && item.User}
                        </span>
                        </td>

                        <td className="px-3 py-7 font-bold text-[#20253F]  font-novasans break-words w-1/2">

                        <span className="p-1.5 text-sm font-medium rounded-lg bg-opacity-50">
  {item && item.team.map((element:any, index:number) => (
    <span className="mx-2 text-black" key={index}>
      {element}
    </span>
  ))}
</span>

</td>   
                        
                      
                  
                 
                      </tr>
                    </React.Fragment>
                  ))}
              </tbody>
            </table>
          </div>
          {currentItems &&
            currentItems.map((item:any, index:number) => (
              <div
                className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden mt-6"
                key={index}
              >
                <div className="bg-white space-y-3 p-4 rounded-lg shadow">
                  <div className="flex items-center space-x-2 text-sm">
                 
                    <div className="text-gray-500">{item && item.email}</div>
                    <div>
                     <span className="p-1.5 text-sm font-medium rounded-lg bg-opacity-50">
  {item && item.team.map((element:any, index:number) => (
    <span className="mx-2 text-black" key={index}>
      {element}
    </span>
  ))}
</span>

                    </div>
                  </div>
           
                  <div className="grid grid-cols-1 gap-3">
                   
                   

            
                  </div>

                

                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
    </>
  );
};

export default TeamDetails;
