import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../redux/store';
import { summaryData } from '../../redux/dataStore/dataSlice';
import { AiOutlineSearch } from 'react-icons/ai';
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import { DEFAULT_COOKIE_GETTER } from '../../helper/Cookie';
import getApi from '../../helper/getApi';
import postApi from '../../helper/postApi';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { CircularLoader } from '../../helper/circularLoader';

const SummaryDetail = () => {
  const data: any = useSelector((state: RootState) => state.summary);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [userList, setUserList] = useState<string[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  var parseDate = (dateStr: string): Date | null => {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  };
  
  const [startDate, setStartDate] = useState<Date | null>(parseDate("2024-02-02"));
  const [endDate, setEndDate] = useState<Date | null>(parseDate("2024-02-02"));
 

  const [circularProgress, setCircularProgress] = useState(false);
  
const [count,setcount] = useState(0);
const [isSubmitting, setIsSubmitting] = useState(false);

  const dispatch = useDispatch<AppDispatch>();

  // Handle search input change
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Handle sorting
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Handle user selection change
  const handleUserChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedUser(event.target.value);
  };

  // Handle date range submission
  const handleDate = async () => {
    const activationToken = await DEFAULT_COOKIE_GETTER('access_token');

    const headers = {
      'Authorization': 'Bearer ' + activationToken,
      'Accept': '*/*',
      'Access-Control-Allow-Origin': true,
    };
    setCircularProgress(true);
    
    await postApi('data/setFilter', { start_date: startDate, end_date: endDate }, headers);
    setcount((prev)=>prev+1);

    let dataEmail = await DEFAULT_COOKIE_GETTER('user');
    dataEmail = JSON.parse(dataEmail || '{}').email;
    dispatch(summaryData({ searchQuery, sortColumn, sortDirection, dataEmail, startDate, endDate }));
    setFilteredData(data.summary.summary)
    setCircularProgress(false);

  };

  // Fetch users
  useEffect(() => {
    async function fetchUsers() {
      try {
        const activationToken = await DEFAULT_COOKIE_GETTER('access_token');
        const headers = {
          'Authorization': 'Bearer ' + activationToken,
          'Accept': '*/*',
          'Access-Control-Allow-Origin': true,
        };

        let dataEmail = await DEFAULT_COOKIE_GETTER('user');
        dataEmail = JSON.parse(dataEmail || '{}').email;
        const response: any = await getApi('auth/get_team_by_email', dataEmail, headers);
        setUserList(response.data);
      } catch (error) {
        console.log(error);
      }
    }

    fetchUsers();
  }, []);

  // Handle data fetch and interval management
  useEffect(() => {
    const interval = (async () => {
      let dataEmail = await DEFAULT_COOKIE_GETTER('user');
      dataEmail = JSON.parse(dataEmail || '{}').email;
      console.log(dataEmail);
      
      dispatch(summaryData({ searchQuery, sortColumn, sortDirection, dataEmail, startDate, endDate }));
    })();

    // return () => clearInterval(interval); // Clear interval on component unmount or dependency change

  }, [dispatch, searchQuery, sortColumn, sortDirection, startDate, endDate]);

  // Filter data based on selected user and date range
  useEffect(() => {
    if (data && data.summary && data.summary.summary) {
      let filtered = data.summary.summary;

      if (selectedUser) {
        filtered = filtered.filter((item: any) => item.user_id === selectedUser);
      }

      if (startDate && endDate) {
        filtered = filtered.filter((item: any) => {
          const itemDate = new Date(item.date); // Assuming there's a 'date' field
          return itemDate >= (startDate || new Date(0)) && itemDate <= (endDate || new Date());
        });
      }

        if (filtered.length <= 0) {
      setFilteredData(filtered);
        }
    }

  }, [ selectedUser


  ]);

  // Get sort icon based on current column and direction
  const getSortIcon = (column: string) => {
    if (sortColumn === column) {
      return sortDirection === 'asc' ? <FaSortUp className="ml-1" /> : <FaSortDown className="ml-1" />;
    } else {
      return <FaSort className="ml-1" />;
    }
  };

  return (
    <div>
        <>
        {circularProgress ? (
          <div className="text-center ">
            <CircularLoader></CircularLoader>
          </div>

        ) : (
          <>{/* Render the product list */}</>
        )}
      </>


      <div>
        <h2 className="font-semibold text-2xl">Summary Detail of each User</h2>
        <h5 className="font-semibold text-gray-400 text-base">Represents the Calling History of Each User</h5>
      </div>

      <div className="flex mt-20 items-end justify-end sm:justify-end p-10">
        <div className="absolute flex-shrink-0 items-center">
          <label htmlFor="simple-search" className="sr-only">Search</label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search Agent Name ..."
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

      <div className="flex mt-4 p-10">
        <div className="relative">
          <label htmlFor="date-range" className="mr-2">Select Date Range:</label>
          <div className="flex">
            <DatePicker
              selected={startDate || undefined}
              onChange={(date: Date | null) => setStartDate(date)}
              selectsStart
              startDate={startDate || undefined}
              endDate={endDate || undefined}
              placeholderText="Start Date"
              className="bg-gray-50 border border-gray-600 text-maincolor text-sm rounded-lg focus:ring-maincolor focus:border-maincolor p-2.5 mr-2"
            />
            <DatePicker
              selected={endDate || undefined}
              onChange={(date: Date | null) => setEndDate(date)}
              selectsEnd
              startDate={startDate || undefined}
              endDate={endDate || undefined}
              minDate={startDate || undefined}
              placeholderText="End Date"
              className="bg-gray-50 border border-gray-600 text-maincolor text-sm rounded-lg focus:ring-maincolor focus:border-maincolor p-2.5"
            />
          </div>
          <button
              className={`font-Overpass text-xs w-40 justify-center items-center font-semibold mt-10 h-12 ${isSubmitting ? 'bg-gray-400' : 'bg-[#c8ccc7]'} text-white p-2 rounded-lg`}
              onClick={async () => {
                await handleDate();
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
        </div>
      </div>

      <div className="relative bg-white shadow-lg rounded-2xl border-1 border-gray-600 border-solid filter drop-shadow-2xl">
        <div className="p-8 md:p-14">
          <span className="mb-3 font-Overpass text-subheading-400 text-maincolor">Summary</span>
          <div className="overflow-auto scrollbar-thin scrollbar-thumb-maincolor">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-white decoration-gray-100">
                <tr>
                  {['userId', 'agentName', 'totalCalls', 'totalTalkTime', 'incomingTotal', 'incomingMissed', 'incomingAvgPerHour', 'incomingTalkTime', 'outgoingTotal', 'outgoingAvgPerHour'].map((col, index) => (
                    <th
                      key={index}
                      onClick={() => handleSort(col)}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    >
                      <div className="flex items-center">
                        {col}
                        {getSortIcon(col)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData && filteredData.map((item: any, index: number) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.user_id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.agentName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.totalCalls}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.totalTalkTime}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.incomingTotal}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.incomingMissed}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.incomingAvgPerHour.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.incomingTalkTime}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.outgoingTotal}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{ item.outgoingAvgPerHour && item.outgoingAvgPerHour.toFixed(2)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryDetail;




