import React, { useContext, useState } from "react";
import { IoMdClose } from "react-icons/io";

import logo from "../assets/logo.png";
import { IoMdHome } from "react-icons/io";
import { AiFillDatabase } from "react-icons/ai";

import { TbLayoutSidebarRightCollapseFilled } from "react-icons/tb";
import { TbLayoutSidebarLeftCollapseFilled } from "react-icons/tb";
import { HiUsers } from "react-icons/hi2";
import { PageContext } from "../utils/contexts";

import { FaDatabase } from "react-icons/fa";

import { FcViewDetails } from "react-icons/fc";
import { CiSettings } from "react-icons/ci";
import { useNavigate } from "react-router-dom";
import { MdEmail } from "react-icons/md";

const SideMenu = () => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const userRole = JSON.parse(localStorage.getItem("user_data") || '{}').role;
  const isAdmin = userRole === "Admin";
  const {pages,setPages,setCollapse}  = useContext<any>(PageContext)
  
  const push:any  = useNavigate();

  const ProfileMenu = [
    {
      name: "Summary",
      icon: <FaDatabase className={` ${isCollapsed ? "w-7 h-7" : ""} `} />,
    },
    {
      name: "Summary Details",
      icon: <FcViewDetails className={` ${isCollapsed ? "w-7 h-7" : ""} `} />,
    },
    ...(isAdmin ? [{
      name: "Settings",
      icon: <CiSettings className={` ${isCollapsed ? "w-7 h-7" : ""} `} />,
    }] : []),
    {
      name: "Summary Data",
      icon: <AiFillDatabase className={` ${isCollapsed ? "w-7 h-7" : ""} `} />,
    },
    {
      name: "Email Plan",
      icon: <MdEmail className={` ${isCollapsed ? "w-7 h-7" : ""} `} />,
    },

  ];


  const handleCollapseToggle = () => {
    setIsCollapsed(!isCollapsed);
    setCollapse(!isCollapsed);
  };

  return (
    <>
      <div
        className={`filter lg:h-screen h-screen bg-[#c8ccc7] border-st p-10 bg-opacity-95 ${
          isCollapsed ? "w-39" : "w-full"
        } transition-width duration-300 ease-in-out`}
      >
         {/* {!isCollapsed && (
            <img src={logo} alt={"logo"} className="w-20 h-20 ml-4" />
          )} */}
        <button
          className="mb-4 text-black justify-end  flex right-0 float-end"
          onClick={handleCollapseToggle}
        >

          {!isCollapsed ? (
            <TbLayoutSidebarLeftCollapseFilled className="text-white font-semibold w-7 h-7" />
          ) : (
            <TbLayoutSidebarRightCollapseFilled className="text-white font-semibold w-7 h-7" />
          )}
        </button>
        <hr className="w-full mt-7 "></hr>

        <div className="bg-opacity-85 mt-16">
         
          {ProfileMenu.map((element, index) => (
            <div className="bg-opacity-65" key={index}>

              <button
                type="button"
                onClick={()=>{
                 
    // Update pages state
    setPages((index + 1).toString());

    // Check if the current URL is not the dashboard
    if (window.location.pathname !== '/dashboard') {
      // Redirect to dashboard
      push('/dashboard');
    }

                }}
                className={`text-white hover:border-solid hover:border-1 hover:rounded-2xl hover:border-[#5C5C5C] hover:text-[#5C5C5C] hover:bg-white font-Overpass h-12 focus:outline-none w-full font-medium rounded-lg text-lg text-center inline-flex items-center mb-2 
    ${
      isCollapsed
        ? "justify-center "
        : "justify-start flex left-2 float-start justify-items-start    py-2.5   md:left-9 "
    }`}
              >
                <div className={` ${!isCollapsed ? "mx-2 " : ""} `}>
                  {element.icon}
                </div>
                {!isCollapsed && <span  className=" block md:block md:break-words ">{element.name}</span>}


              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default SideMenu;
