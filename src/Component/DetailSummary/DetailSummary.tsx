
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { detailData } from "../../redux/dataStore/detailSlice";
import {callsData} from "../../redux/dataStore/callsSlice";
import { useAppDispatch, useAppSelector } from "../../redux/reduxHooks";
import { RootState, AppDispatch } from '../../redux/store';

import { AiOutlineSearch } from "react-icons/ai";

import toast from "react-hot-toast";
import ToasterGen from "../../helper/Toaster";
import { DEFAULT_COOKIE_GETTER } from "../../helper/Cookie";
import getApi from "../../helper/getApi";


const DetailSummary = () => {
  const data: any = useSelector((state: any) => state?.details);
const [userList,setUserList] = useState([]);

  const [searchQuery, setSearchQuery] = useState<string>("");

  const [selectedItems, setSelectedItems] = useState<any>([]);
  const dispatch = useDispatch<AppDispatch>();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const [filteredData, setFilteredData] = useState<any[]>([]);

  useEffect(() => {

    async function fetchData(){
    let dataEmail = await DEFAULT_COOKIE_GETTER("user");
    dataEmail = JSON.parse(dataEmail || "{}").email;
      
    dispatch(detailData({ searchQuery ,dataEmail}));
    }

    fetchData();


  }, [dispatch, searchQuery]);
  


  const handleSearch = async(data:any) =>{
    setSearchQuery(data);


}

useEffect(() => {
  async function fetchUsers() {
    try {
      // const users = fget
      const activationToken = await DEFAULT_COOKIE_GETTER("access_token");

      const headers = {
        "Authorization": 'Bearer ' + activationToken,
        "Accept": "*/*",
        "Access-Control-Allow-Origin": true
    };
    let dataEmail = await DEFAULT_COOKIE_GETTER("user");
    dataEmail = JSON.parse(dataEmail || "{}").email;
    const emails= dataEmail

 
      const response:any = await getApi("auth/get_team_by_email",emails,headers);
    
      
    setUserList(response.data);

    } catch (error) {

      console.log(error);
      toast.error("Failed to fetch users");
    }
  }

  fetchUsers();
}, []);

const handleUserChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
  setSelectedUser(event.target.value);
};

useEffect(() => {
  if (data && data.details && data.details.details) {
    if (selectedUser) {
      const filtered = data.details.details.filter((item: any) => item.user === selectedUser);
      setFilteredData(filtered);
    } else {
      setFilteredData(data.details.details);
    }
  }
}, [data, selectedUser]);


  return (
    <>
    <ToasterGen></ToasterGen>
    <div>
    <div>
          <h2 className="font-semibold  text-2xl">Detail's Calls of Users
          </h2>
          <h5 className="font-semibold text-gray-400">Represents the Calls from and to Information of Each User</h5>
          </div>


      <div className="flex  mt-20 items-end justify-end sm:justify-end   p-10 ">
        <div className="absolute flex-shrink-0 items-center">
          <label htmlFor="simple-search" className="sr-only">
            Search
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search User Id ..."
              className="bg-gray-50 border border-gray-600 mb-8 text-maincolor text-sm rounded-lg focus:ring-maincolor focus:border-maincolor block w-full pl-10 pr-10 p-2.5 focus:outline-none focus:ring-0"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <AiOutlineSearch className="w-5 h-5 text-maincolor dark:text-maincolor" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex mt-4 p-10">
          <div className="relative">
            <label htmlFor="user-select" className="mr-2">Select User:</label>
            <select
              id="user-select"
              value={selectedUser || ""}
              onChange={handleUserChange}
              className="bg-gray-50 border border-gray-600 text-maincolor text-sm rounded-lg focus:ring-maincolor focus:border-maincolor block w-full pl-3 pr-10 p-2.5"
            >
              <option value="">Select a user</option>
              {userList && userList.map((user) => (
                <option key={user} value={user}>
                  {user}
                </option>
              ))}
            </select>
          </div>
        </div>



      <div className="relative  bg-white shadow-lg rounded-2xl border-1 border-gray-600 border-solid filter drop-shadow-2xl  ">
        <div className="p-8 md:p-14">
          <span className="mb-3 font-Overpass text-subheading-400 text-maincolor">
            Detail Calls
          </span>

          <div className="   overflow-auto     scrollbar-thin scrollbar-thumb-maincolor">
            <table className="min-w-full divide-y divide-gray-200"></table>
            <div className="flex mx-4 mt-10  w-full ">
              <div className="     scrollbar-thin scrollbar-thumb-maincolor  w-full">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-white decoration-gray-100 ">
                    <tr>
              
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date And Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Source
                                    </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Destination
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Direction
                      </th>
                      
                      
                    

                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.map((item: any,index:number) => (

                        <tr key={index}>
                          


                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {item.user}
                            </div>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {item.dateAndTime}
                            </div>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 flex items-center">
                              {item.source}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 flex items-center">
                              {item.destination}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 flex items-center">
                              {item.duration}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 flex items-center">
                              {item.direction}
                            </div>
                          </td>
                        
                      

                        
                        </tr>
              
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default DetailSummary;
