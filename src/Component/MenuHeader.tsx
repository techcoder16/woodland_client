import React, { useEffect, useRef, useState,useContext } from "react";
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import env from "react-dotenv";
import logo from "../assets/logo.png";
import { Link } from "react-router-dom";
import { DEFAULT_COOKIE_DELETE, DEFAULT_COOKIE_GETTER } from "../helper/Cookie";
import dashboard from '../assets/dashboard.svg';
import landlord from '../assets/landlord_vendorActive.svg';
import { PageContext } from "../utils/contexts";


const MenuHeader = () => {
  const push: any = useNavigate();
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const toggleMenu = (id:any,index:number) => {
    setActiveId(activeId === id ? null : id);
    setPages((index + 1).toString());
  };
  const {pages,setPages,setCollapse}  = useContext<any>(PageContext)
  


  const menuItems = [
    { id: 1, label: 'Dashboard', icon: dashboard },
    { id: 2, label: 'Tenant', icon: landlord },
    { id: 3, label: 'Properties', icon: 'path/to/property-icon.svg' },
    // Add more items as needed
  ];
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await DEFAULT_COOKIE_GETTER('user');
        const parsedUser = JSON.parse(user || "{}");
        setUserName(parsedUser.name || '');
        setEmail(parsedUser.email || '');
      } catch (error) {
        console.error('Error fetching user:', error);
        setUserName('');
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    await DEFAULT_COOKIE_DELETE("access_token");
    await DEFAULT_COOKIE_DELETE("user");
    localStorage.removeItem("user_data");
    push("/Login");
  };

  return (
    <>
      <div className="flex flex-col ">
        <nav className="bg-white h-20 border-b">
          <div className="mx-auto">
            <div className="relative flex h-16 items-center justify-between">
              <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                <Link to="/dashboard" className="flex items-center">
                  <img className="block w-56 h-44 lg:hidden" src={logo} alt="Sip Desk" />
                  <img className="hidden w-32 h-26 lg:block" src={logo} alt="Sip Disk" />
                </Link>
                <div className="flex items-center justify-center px-5">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search"
                      className="w-full p-2 pl-10 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-4.35-4.35"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="relative flex items-center pr-2">
                <button
                  type="button"
                  className="flex bg-maincolor text-sm focus:outline-none ring-2 ring-white focus:ring-white focus:ring-offset-2 focus:ring-offset-white"
                  onClick={() => setOpen(!open)}
                >
                 <div className="col-span-1 w-10 h-10 bg-red-400 text-white font-semibold justify-center items-center flex">
                          {userName ? userName.match(/\b(\w)/g)?.join('') : ''}
                        </div>

                </button>

                {open && (
                  <div className="bg-white p-4 w-96 absolute h-max shadow-lg z-20 top-10 right-2">
                    <ul>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-1 w-10 h-10 bg-red-400 text-white font-semibold justify-center items-center flex">
                          {userName ? userName.match(/\b(\w)/g)?.join('') : ''}
                        </div>
                        <div>
                          {userName}
                          <br />
                          {email}
                        </div>
                      </div>
                      <hr />
                      <li onClick={handleLogout} className="font-dmsans p-2 text-md cursor-pointer rounded hover:bg-[#c8ccc7] bg-opacity-75 hover:text-white">
                        Logout
                      </li>
                    </ul>
                  </div>

                )}

               
              </div>
              
            </div>
          </div>
        </nav>
                <div className="w-full  h-fit bg-[#443F5F]">
                <div className="flex space-x-4">
        {menuItems.map((item,index) => (
           <div 
           key={item.id}
           className={`cursor-pointer flex items-center p-3 rounded-lg transition-all duration-300 
                       ${activeId === item.id ? 'bg-gray-700' : 'bg-transparent'}`}
           onClick={() => toggleMenu(item.id,index)}
         >
           <img 
             src={item.icon} 
             alt={item.label} 
             className={`w-6 h-6 transition-colors duration-300 
                         ${activeId === item.id ? 'text-yellow-400' : 'text-white'}`}
           />
           <span className={`ml-2 text-white ${activeId === item.id ? 'font-bold' : ''}`}>
             {item.label}
           </span>
         </div>
        ))}
      </div>



                </div>


      </div>
    </>
  );
};

export default MenuHeader;
