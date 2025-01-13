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
  const userRole = JSON.parse(localStorage.getItem("user_data") || "{}").role;
  const isAdmin = userRole === "Admin";
  const {pages,setPages,setCollapse}  = useContext<any>(PageContext)
  
  const navigate = useNavigate();

  const ProfileMenu = [
    {
      name: "Summary",
      icon: <FaDatabase className="text-lg" />,
    },
    {
      name: "Summary Details",
      icon: <FcViewDetails className="text-lg" />,
    },
    ...(isAdmin
      ? [
          {
            name: "Settings",
            icon: <CiSettings className="text-lg" />,
          },
        ]
      : []),
    {
      name: "Summary Data",
      icon: <AiFillDatabase className="text-lg" />,
    },
    {
      name: "Email Plan",
      icon: <MdEmail className="text-lg" />,
    },
  ];

  const handleCollapseToggle = () => {
    setIsCollapsed(!isCollapsed);
    setCollapse(!isCollapsed);
  };

  return (
    <div
      className={`filter h-screen bg-gray-800 text-white border-r p-5 transition-all duration-300 ease-in-out ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Logo Section */}
      <div className={`flex items-center justify-center mb-6 ${isCollapsed ? "hidden" : "block"}`}>
        <img src={logo} alt="Logo" className="w-20 h-20" />
      </div>

      {/* Collapse Button */}
      <button
        className="mb-4 flex justify-end w-full"
        onClick={handleCollapseToggle}
      >
        {isCollapsed ? (
          <TbLayoutSidebarRightCollapseFilled className="text-2xl" />
        ) : (
          <TbLayoutSidebarLeftCollapseFilled className="text-2xl" />
        )}
      </button>

      <hr className="border-gray-700 my-4" />

      {/* Menu Items */}
      <div className="flex flex-col gap-4">
        {ProfileMenu.map((item, index) => (
          <button
            key={index}
            onClick={() => {
              setPages((index + 1).toString());
              if (window.location.pathname !== "/dashboard") {
                navigate("/dashboard");
              }
            }}
            className={`flex items-center gap-4 px-4 py-2 rounded-lg transition-all duration-200 hover:bg-gray-700 ${
              isCollapsed ? "justify-center" : "justify-start"
            }`}
          >
            <span>{item.icon}</span>
            {!isCollapsed && <span className="text-base font-medium">{item.name}</span>}
          </button>
        ))}
      </div>

      {/* Footer Section */}
      <div className="absolute bottom-4 left-0 w-full px-4">
        <hr className="border-gray-700 mb-4" />
        {!isCollapsed && <p className="text-sm text-center">© 2025 Your Company</p>}
      </div>
    </div>
  );
};

export default SideMenu;
