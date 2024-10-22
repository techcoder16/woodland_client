import React, { useEffect, useLayoutEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import { FaAngleRight, FaAngleLeft } from "react-icons/fa";
import { TiArrowSortedDown, TiArrowSortedUp } from "react-icons/ti";
import { IoPersonAddSharp } from "react-icons/io5";


import { RootState, AppDispatch } from "../../redux/store";
import { userData } from "../../redux/dataStore/userSlice";
import SideMenu from "../SideMenu";
import UserDetails from "./UserDetails";
import UserUpdateModal from "./UserUpdateModal";
import CreateUser from "./CreateUser";
import ToasterGen from "../../helper/Toaster";
import { PageContext } from "../../utils/contexts";
import MenuHeader from "../MenuHeader";
import teamSlice, { fetchTeams } from "../../redux/dataStore/teamSlice";
import TeamDetails from "./TeamDetails";
import getApi from "../../helper/getApi";
import { DEFAULT_COOKIE_DELETE, DEFAULT_COOKIE_GETTER } from "../../helper/Cookie";
// Define types for your state and props
interface User {
  id: number;
  name: string;
  email: string;
  company: string;
  website: string;
  // Add other fields as necessary
}

interface UserListProps {
  // Define props if necessary
}

const UserList: React.FC<UserListProps> = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();

  const [circularProgress, setCircularProgress] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [type, setType] = useState<boolean>(false);
  const [deletedState, setDeletedState] = useState<number>(0);
  const [filter, setFilter] = useState<boolean>(true);
  const [showModalCreate, setShowModalCreate] = useState<boolean>(false);
  const [sideMenuShow, setSideMenuShow] = useState<boolean>(false);
  const [userState, setUserState] = useState<any>({});
  const push:any  = useNavigate();

  const[pages,setPages] = useState("1");
  const [selectedFilters, setSelectedFilters] = useState<{ Website: string }>({
    Website: "",
  });
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const itemsPerPage = 100;
  const user = useSelector((state: RootState) => state?.users);
  const teams = useSelector((state: RootState) => state?.teams);
  
  const [collapse,setCollapse] = useState(true);
  

  
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const totalPages = Math.ceil(user.userCount / itemsPerPage) || 0;
  useEffect(()=>{

    const interval =   setInterval(async ()=>{
    const activationToken = await DEFAULT_COOKIE_GETTER("access_token");
    const headers = {
      Authorization: 'Bearer ' + activationToken,
      Accept: "*/*",
      "Access-Control-Allow-Origin": true,
    };
    const accT:any = await DEFAULT_COOKIE_GETTER("access_token");
    
    if (!accT)
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
  
  },[])
  const handleColumnSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prevPage) => prevPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prevPage) => prevPage + 1);
    }
  };

  const getPages = () => {
    const maxVisiblePages = 5;
    const sidePages = Math.floor((maxVisiblePages - 3) / 2);
    const pages: JSX.Element[] = [];

    pages.push(
      <button
        key="1"
        onClick={() => handlePageChange(1)}
        className={`px-3 py-1 font-bold rounded font-novasans mx-1 italic ${
          currentPage === 1 ? "bg-textColor text-white" : "bg-textColor text-white"
        }`}
      >
        1
      </button>
    );

    let startPage = Math.max(2, currentPage - sidePages);
    let endPage = Math.min(totalPages - 1, currentPage + sidePages);
    let addEndDots = endPage < totalPages - 1;

    if (addEndDots) {
      pages.push(
        <span key="end-dots" className="px-0 py-1 text-gray-600">
          ...
        </span>
      );
    }

    for (let page = startPage; page <= endPage; page++) {
      pages.push(
        <button
          key={page}
          onClick={() => handlePageChange(page)}
          className={`px-3 mx-1 py-1 font-bold rounded font-novasans ${
            currentPage === page ? "bg-textColor text-white" : "bg-textColor text-white"
          }`}
        >
          {page}
        </button>
      );
    }

    if (addEndDots) {
      pages.push(
        <span key="end-dots" className="px-0 py-1 text-gray-600">
          ...
        </span>
      );
    }

    pages.push(
      <button
        key={totalPages}
        onClick={() => handlePageChange(totalPages)}
        className={`px-3 py-1 font-bold rounded font-novasans mx-1 italic ${
          currentPage === totalPages ? "bg-textColor text-white" : "bg-textColor text-white"
        }`}
      >
        {totalPages}
      </button>
    );

    return pages;
  };
 
  
  useLayoutEffect(() => {
    if (location.state) {
      setSelectedFilters((prevFilters) => ({
        ...prevFilters,
        category: location.state,
      }));
    }
  }, [location.state]);

  useEffect(() => {
    if (localStorage.getItem("user_data")) {
      const role = JSON.parse(localStorage.getItem("user_data") || '{}').role;
      // Use role if needed
    
    
  }
  }, []);

  useEffect(() => {
    if (user.users && user.users.length > 0) {
      toast.success("User data loaded successfully!");
    }
  }, [user.users]);

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(fetchTeams(      ));

      dispatch(
        userData({
          page: currentPage,
          searchQuery: searchQuery,
          selectedFilters: selectedFilters,
          sortColumn: sortColumn,
          sortDirection: sortDirection,
        })
      );
    }, 500);
    return () => clearTimeout(timer);
  }, [currentPage, searchQuery, selectedFilters, sortColumn, sortDirection, type, dispatch]);

  const isLoading = !user.users;



  return (
    <>
           <MenuHeader></MenuHeader>

  
      <ToasterGen />
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-0 bg-white">
        <div className={`col-span-1 ${collapse == false ?  "lg:col-span-1 transition-width duration-300 ease-in-out": "lg:col-span-1 transition-width duration-300 ease-in-out"}   bg-[#c8ccc7]   `}>
        <PageContext.Provider  value={{ pages, setPages,setCollapse }}>
          <SideMenu></SideMenu>
          </PageContext.Provider>
          
        </div>

        {showModalCreate && <CreateUser props={setShowModalCreate} />}

        <div className="col-span-1 lg:col-span-9  mx-10  justify-center  m-auto ">
          <div className="relative w-full bg-white">
          <div>
          <h2 className="font-semibold  text-2xl">Manager's Setting
          </h2>
          <h5 className="font-semibold text-gray-400">Represents to create Managers and add members in Mangers's Team</h5>
          </div>

          </div>

          <div className="m-auto w-4/5 font-novasans">
            <div className="flex flex-col">
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
                Filters
                <form>
                  <div className="flex justify-end w-full">
                    {filter ? (
                      <TiArrowSortedUp onClick={() => setFilter(false)} />
                    ) : (
                      <TiArrowSortedDown onClick={() => setFilter(true)} />
                    )}
                  </div>

                  <div
                    className={`${
                      filter
                        ? "block transition duration-300 ease-in-out"
                        : "transition duration-500 ease-in-out hidden"
                    }`}
                  >
                    <div className="relative mb-10 w-full flex items-center justify-between rounded-md">
                      <svg
                        className="absolute left-2 block h-5 w-5 text-gray-400"
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      </svg>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        name="search"
                        className="h-12 w-full cursor-text rounded-md border border-gray-100 bg-gray-100 py-4 pr-40 pl-12 shadow-sm outline-none focus:border-green-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        placeholder="Search by Name"
                      />
                    </div>
                    <div className="mt-6 grid w-full grid-cols-2 justify-end space-x-4 md:flex"></div>
                  </div>
                </form>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setShowModalCreate(true);
                  }}
                  className="rounded-lg bg-gray-200 px-8 py-2 font-medium text-gray-700 outline-none hover:opacity-80 focus:ring"
                >
                  Create Managers
                </button>
              </div>
            </div>
          </div>

          <div className="mt-0 bg-white grid-cols-1 sm:grid-cols-5 gap-2 left-0 px-7">
            <div className="col-span-5">
              <UserDetails
                handleColumnSort={handleColumnSort}
                sortColumn={sortColumn}
                sortDirection={sortDirection}

                currentItems={user.users as User[]}
                deletedState={setDeletedState}
                typeNew={setType}
                dispatch={dispatch}
              />
            </div>
          </div>

 <div className="mt-0 bg-white grid-cols-1 sm:grid-cols-5 gap-2 left-0 px-7">
            <div className="col-span-5">
              <TeamDetails

                currentItems={teams && teams.teams }

                
                
              />
            </div>
          </div>
          <div className="flex justify-end bg-white gap-2 sm:px-2 md:px-16 lg:px-28 xl:px-28 2xl:px-28 px-2">
            <div className="flex flex-col">
              <div className="flex flex-1 mb-4">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="font-novasans px-3 py-1 font-medium rounded bg-white text-maincolor md:mb-0 mr-2"
                >
                  <FaAngleLeft />
                </button>
                <div className="italic">{getPages()}</div>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="font-novasans px-3 py-1 font-medium rounded bg-white text-maincolor"
                >
                  <FaAngleRight />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserList;
