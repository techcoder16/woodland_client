import React, { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { TypeAnimation } from "react-type-animation";
import logo from "../../assets/logo.png";

import { useForm, Controller } from "react-hook-form";
import { DEFAULT_COOKIE_GETTER, DEFAULT_COOKIE_SETTER } from "../../helper/Cookie";

import LoadingBar from "react-top-loading-bar";
import { useNavigate } from "react-router-dom";
import postApi from "../../helper/postApi";
import ToasterGen from "../../helper/Toaster";
import toast from "react-hot-toast";
import { VscEye, VscEyeClosed } from "react-icons/vsc";
import useToggle from "../../helper/useToggle";
import getApi from "../../helper/getApi";

const Settings = () => {
  const Employees: Array<string> = [
    "None",
    "1-10",
    "1-100",
    "1-1000",
    "1-2000",
  ];
  const [progress, setProgress] = useState(0);
  const push: any = useNavigate();
const [time,setTime] =useState<string >("");
const [email,setEmail] = useState<string >("");

  const [isPasswordHideShow, setPasswordHideShow] = useToggle(false);
  const ChangePasswordHideShow = () => {
    setPasswordHideShow();
  };

  const formSchema = z.object({
    email: z.string().email().min(1, { message: "Email is Required!" }),
    time: z.string().min(1, { message: "Time is Required!" }),
  });
useEffect(()=>{

       async  function fetchData(){
        try {
        const activationToken = await DEFAULT_COOKIE_GETTER("access_token");
        const headers = {
          "Authorization": 'Bearer ' + activationToken,
          "Accept": "*/*",
          "Access-Control-Allow-Origin": true
      };

      const { data, error }: any = await getApi("data/settings_data",{},headers);

      if (data && data.message != "" ) {
          setTime(data.time);
          setEmail(data.email);
          setValue('time', data.time.toString());
          setValue('email', data.email);

    } else {
 

    }
  } catch (err) {
    
    toast.error("Network Error!");
  }
}



        
          fetchData();
});
  type SettingsSchema = z.infer<typeof formSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    control,
  } = useForm<SettingsSchema>({
    resolver: zodResolver(formSchema),
  });
  const onSubmit = async (payload: SettingsSchema) => {
    setProgress(progress + 10);
    
    try {
      const activationToken = await DEFAULT_COOKIE_GETTER("access_token");
      const headers = {
          "Authorization": 'Bearer ' + activationToken,
          "Accept": "*/*",
          "Access-Control-Allow-Origin": true
      };

      const { data, error }: any = await postApi("data/settings", payload,headers);

      setProgress((prevProgress) => progress + 20);

      if (data && data.message != "" && error.message == undefined) {
        // localStorage.setItem(
        //   "Activation-Token",
        //   data && data?.activationToken?.token
        // );

        // await DEFAULT_COOKIE_SETTER("time",data.payload.time,false);
        
        // await DEFAULT_COOKIE_SETTER("email",data.payload.time,false);
        
        // await DEFAULT_COOKIE_SETTER("user",JSON.stringify({email: data.user.email,name:data.user.name}),false);


        toast.success(data.message);

        setProgress(progress + 30);

        setProgress(100);
      } else {
        toast.error(error.message);
        setProgress(100);
      }
    } catch (err) {
      toast.error("Network Error!");
    }
  };

  return (
    <React.Fragment >
      {/* <LoadingBar
        color="rgb(95,126,220)"
        progress={progress}
        waitingTime={400}
        onLoaderFinished={() => {
          setProgress(0);
        }}
      /> */}
      <ToasterGen></ToasterGen>
      <div>
          <h2 className="font-semibold  text-2xl">Email Settings
          </h2>
          <h5 className="font-semibold text-gray-400">Represents Settings to set Email admin</h5>
          </div>

      <div className=" lg:h-screen  flex   w-full">
     

        <div className="  h-full m-auto w-full">
          <div className="w-full flex  justify-center my-auto py-44">
            <div className="flex items-center justify-center bg-transparent">
              <div className="relative bg-white shadow-2xl rounded-2xl">
                <div className="flex flex-col justify-center p-8 md:p-14">
                  <div className="flex justify-center self-center items-center">
                    <form
                      className="w-full max-w-md"
                      onSubmit={handleSubmit(onSubmit)}
                    >
                      <h1 className="text-2xl font-Overpass text-gray-600 "></h1>
                      <div className="py-1 w-full ">
                        <div className="py-1 w-full">
                          <span className="mb-2 text-md font-Overpass font-normal text-xs text-gray-600  font-Overpass leading-5 text-line">
                            Trigger Time
                          </span>
                          <input
                            {...register("time")}
                            id="time"
                            type="number"
                            pattern="[0-9]{0,5}"
                            max={60}
                            defaultValue={time}

                            min={1}
                            className="w-full h-12 bg-transparent border-b-2 border-b-solid text-black border-b-gray-200 font-Overpass text-line placeholder:font-Overpass text-center placeholder:font-light focus:border-b-[#c8ccc7] focus:border-b-2 focus:border-b-solid placeholder:font-Overpass text-xs focus:outline-none"
                            placeholder="Time"
                            autoComplete="on"
                          />
                          {errors.time && (
                            <span className="text-red-500 block mt-1 text-Overpass text-xs">
                              {`${errors.time.message}`}
                            </span>
                          )}
                        </div>
                        <div className="py-1 w-full">
                          <span className="mb-2 text-md font-Overpass font-normal text-xs text-gray-600  font-Overpass leading-5 text-line">
                            Trigger Email
                          </span>
                          <input
                            {...register("email")}
                            id="email"
                            defaultValue={email && email}
                            type="email"
                            className="w-full h-12 bg-transparent border-b-2 border-b-solid text-black border-b-gray-200 font-Overpass text-line placeholder:font-Overpass text-center placeholder:font-light focus:border-b-[#c8ccc7] focus:border-b-2 focus:border-b-solid placeholder:font-Overpass text-xs focus:outline-none"
                            placeholder="Email Address"
                            autoComplete="on"
                          />
                          {errors.email && (
                            <span className="text-red-500 block mt-1 text-Overpass text-xs">
                              {`${errors.email.message}`}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        className="font-Overpass text-xs w-40  font-semibold mt-10 h-12 bg-[#c8ccc7] text-white  p-2 rounded-lg "
                        type="submit"
                      >
                        Apply
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default Settings;
