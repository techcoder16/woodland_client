import React, { useState, useMemo } from "react";

import GetApiData from "../../helper/getApi";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { ValidateTeamUser } from "../../utils/validateApi";

import { useFormik } from "formik";
import { DEFAULT_COOKIE_GETTER } from "../../helper/Cookie";
import getApi from "../../helper/getApi";
import { userData } from "../../redux/dataStore/userSlice";

const UserUpdateModal = ({ userState, props, menudata }:any) => {
  const dispatch = useDispatch();
  
  const formik = useFormik({
    initialValues: {
      user: "",
      email:userState.email

    },
    validate: ValidateTeamUser,
    validateOnBlur: false,
    validateOnChange: false,
    onSubmit: async (values:any) => {
      values = await Object.assign(values);
      props(false);
      dispatch(menudata);
      return false;
    },
  });

  const [options, setOptions] = useState([]);
const [data,setData] =useState("");
  useEffect(() => {
    async function fetchData() {
      
      let id = 1;
      const activationToken = await DEFAULT_COOKIE_GETTER("access_token");
      const headers = {
        "Authorization": `Bearer ${activationToken}`,
        "Accept": "*/*",
        "Access-Control-Allow-Origin": "true",
      };

      const response:any = await getApi("auth/get_team_members","",headers);
      
      const results:any = [];

      response &&  response.data.map((value:any,index:number) => {
        if (index == 0)
        {
          formik.values.user =value.first_name + ":" + value.user  
          setData(value.first_name + ":" + value.user  )
        }
       return results.push({
          key: index,
          value: value.first_name + ":" + value.user ,
          user:value.first_name

        });
    
      });

      results && setOptions(results);
    }

    fetchData();
  }, [userState]);

  const optionElements = useMemo(() => {
    if(options[0])
    {

    }

    return options.map((option:any) => (
      <option key={option.key} value={option.value}>
        {option.value}
      </option>
    ));
  }, [options]);

  return (
    <>
   <div className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
        <div className="container mx-auto">
          <div className="flex items-center  justify-center min-h-screen  bg-transparent">
            <div className="relative flex flex-col m-6 space-y-8 bg-white shadow-2xl rounded-2xl md:flex-row md:space-y-0">
              <div className="flex flex-col justify-center p-8 md:p-14 ">
              <span className="mb-3 text-2xl  font-novasans text-subheading-400  text-black">
                      Add Team Member 
                    </span>

                <div className="flex items-end  justify-end  p-0 ">
                  <button
                    className="p-1 border-0 text-maincolor  ml-auto bg-transparent   text-3xl leading-none font-semibold outline-none focus:outline-none "
                      onClick={()=>{ props(false); }}
                  >
                    <span className="bg-transparent text-maincolor ">×</span>
                  </button>
                </div>

                <form className="py-1" onSubmit={formik.handleSubmit}>
                  {/* <div className="py-4 ">
                    <span className="mb-2 text-md font-novasans font-bold text-gray-500">
                        User Name 
                    </span>
                   
                    <label className="relative left-0 top-1 cursor-text"></label>
                  </div>
                  
                  */}


                  <div className="py-4 ">
                    <span className="mb-2 text-md font-novasans  text-gray-500">
                      Select Team
                    </span>
                    <select
                      {...formik.getFieldProps("user")}
                 
                      id="user"
                      value={data}
                      onChange={(e)=>{
                        
                        setData(e.target.value)
                        formik.values.user = e.target.value;
                        
                      }}
                      className="w-full h-12 bg-transparent border-2  rounded-md border-solid  text-black border-[##FFFFFF] font-novasans  text-center placeholder:font-light  shadow-sm shadow-[#00487452] placeholder:font-novasans text-base focus:outline-none"
                      >
                      {optionElements}
                    </select>
                  </div>

                  {/* <input hidden
                    {...formik.getFieldProps("id")}
                    id="id"
                    type="text"
                    value={userState._id}
                    
                    className="w-full h-12 bg-transparent border-2  rounded-md border-solid  text-black border-[##FFFFFF] font-novasans  text-center placeholder:font-light  shadow-sm shadow-[#00487452] placeholder:font-novasans text-base focus:outline-none"
                    ></input> */}

                  <div className="py-4 ">
                    <button
                      type="submit"
                      className="w-full border h-12 bg-line text-white border-gray-600 bg-gray-600 text-md p-2 rounded-lg mb-6 hover:bg-maincolor hover-text-white"
                    >
                      Add
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="opacity-25 fixed inset-0 z-40 bg-black"></div>
    </>
  );
};

export default React.memo(UserUpdateModal);
