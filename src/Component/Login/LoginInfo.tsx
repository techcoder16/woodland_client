import React, { useEffect, useState } from "react";
import wall2 from '../../assets/wall2.jpg';
import wall3 from '../../assets/wall3.jpg';
import wall5 from '../../assets/wall5.jpg';
import wall6 from '../../assets/wall6.jpg';
import LoadingBar from "react-top-loading-bar";
import { useNavigate } from "react-router-dom";
import toast, { ToastBar } from "react-hot-toast";
import useToggle from "../../helper/useToggle";
import { VscEye, VscEyeClosed } from "react-icons/vsc";
import { DEFAULT_COOKIE_SETTER } from "../../helper/Cookie";
import postApi from "../../helper/postApi";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import ToasterGen from "../../helper/Toaster";
const Login = () => {
  const [progress, setProgress] = useState(0);
  const push = useNavigate();
  const [currentImage, setCurrentImage] = useState(wall2);

  const images = [wall2, wall3, wall5, wall6];
  const [isPasswordHideShow, setPasswordHideShow] = useToggle(false);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentImage(prevImage => {
        const currentIndex = images.indexOf(prevImage);
        const nextIndex = (currentIndex + 1) % images.length;
        return images[nextIndex];
      });
    }, 3000); 

    return () => clearInterval(intervalId);
  }, [images]);

  const formSchema = z.object({

    email: z.string().email().min(1, { message: "Email is Required!" }),

    password: z.any()


  });

  type LoginSchema = z.infer<typeof formSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },

    control,
  } = useForm<LoginSchema>({
    resolver: zodResolver(formSchema),
  });
  const onSubmit = async (payload: LoginSchema) => {

    setProgress(progress + 10)

    try {

      const { data, error }: any = await postApi("auth/getLogin", payload);
      setProgress((prevProgress) => progress + 20);
      console.log("success", data)

      if (data && data.message != "" && error.message == undefined) {

    
        localStorage.setItem("user_data", JSON.stringify(data.user))
        await DEFAULT_COOKIE_SETTER("access_token", data.accessToken, false);
        await DEFAULT_COOKIE_SETTER("user", JSON.stringify({ email: data.user.email, name: data.user.name }), false);


        toast.success(data.message);

        setProgress(progress + 30);

        push("/dashboard");

        setProgress(100);
      }
      else {
        console.log("asdjhaskjhdsajk")

        toast.error(error.message);
        setProgress(100);
      }

    }
    catch (err) {
      toast.error("Network Error!");
    }



  };



  return (
    <React.Fragment>
      <ToasterGen></ToasterGen>
      <LoadingBar
        color="rgb(95,126,220)"
        progress={progress}
        waitingTime={400}
        onLoaderFinished={() => {
          setProgress(0);
        }}
      />

      <div
        style={{
          width: '100vw',
          height: '100vh',
          backgroundImage: `url(${currentImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transition: 'background-image 1s ease-in-out',
        }}
      >
        <div className="w-full gap-1 lg:h-screen">
          <div className="col-span-5 lg:col-span-5 w-full h-full">
            <div className="min-h-screen flex items-center justify-center text-center">
              <div className="flex items-center justify-center bg-transparent">
                <div className="relative bg-white shadow-2xl rounded-2xl w-full">
                  <div className="flex flex-col justify-center w-full md:p-14">
                    <div className="flex justify-center self-center items-center">
                      <form className="w-full max-w-md"
                        onSubmit={handleSubmit(onSubmit)}
                      >
                        <h1 className="text-4xl font-bold" >Welcome to Woodland  </h1>
                        <h1 className="text-2xl  font-Overpass text-gray-600">
                          Login to Admin
                        </h1>

                        <div className="py-1 w-full">
                          <span className="mb-2 text-md font-Overpass font-normal text-xs text-gray-600">
                            Email
                          </span>
                          <input
                            {...register("email")}
                            id="email"
                            type="email"
                            className="w-full h-12 bg-transparent border-b-2 border-b-solid text-black border-b-gray-200 font-Overpass text-line placeholder:font-Overpass text-center placeholder:font-light focus:border-b-[#c8ccc7] focus:border-b-2 focus:border-b-solid placeholder:font-Overpass text-xs focus:outline-none"
                            placeholder="Email Address"
                          />
                        </div>

                        <div className="py-1 w-full">
                          <span className="mb-2 text-md font-Overpass font-normal text-xs text-gray-600">
                            Password
                          </span>
                          <div className="flex items-center rounded-xl bg-transparent relative">
                            <input
                              {...register("password")}
                              id="password"
                              type={isPasswordHideShow ? "text" : "password"}
                              className="w-full h-12 bg-transparent border-b-2 border-b-solid text-black border-b-gray-200 font-Overpass text-line placeholder:font-Overpass text-center placeholder:font-light focus:border-b-[#c8ccc7] focus:border-b-2 focus:border-b-solid placeholder:font-Overpass text-xs focus:outline-none"
                            />
                            <i
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-line cursor-pointer"
                              onClick={() => setPasswordHideShow(!isPasswordHideShow)}
                            >
                              {isPasswordHideShow ? (
                                <VscEye className="w-6 text-gray-800" />
                              ) : (
                                <VscEyeClosed className="w-6 text-gray-800" />
                              )}
                            </i>
                          </div>
                        </div>

                        <button

                          className="font-Overpass text-xs w-40 font-semibold mt-10 h-12 bg-[#c8ccc7] text-white p-2 rounded-lg"
                          type="submit"
                        >
                          Login
                        </button>
                      </form>
                    </div>
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

export default Login;
