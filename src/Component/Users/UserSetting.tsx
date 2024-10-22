import React, { useEffect, useState } from "react";
import Header from "../MenuHeader";
import MenuHeader from "../MenuHeader";

import { useFormik, FormikHelpers } from "formik";
import { ValiadateUserUpdate } from "../../utils/validateApi";
import { MdAddAPhoto } from "react-icons/md";
import convertToBase64 from "../../utils/convert";

import { toast, Toaster, ToastBar } from "react-hot-toast";

// Define interfaces for the user and form values
interface User {
  username?: string;
  company?: string;
  email?: string;
  name?: string;
  website?: string;
}

interface FormValues {
  password: string;
  company?: string;
  email?: string;
  name?: string;
  website?: string;
}

const UserSetting: React.FC = () => {
  // Retrieve user data from local storage and parse it
  const [user, setUser] = useState<User | null>(() => {
    const userData = localStorage.getItem("user_data");
    return userData ? JSON.parse(userData) : null;
  });

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const formik = useFormik<FormValues>({
    initialValues: {
      password: "",
      company: user?.company || "",
      email: user?.email || "",
      name: user?.name || "",
      website: user?.website || "",
    },
    validate: ValiadateUserUpdate,
    validateOnBlur: false,
    validateOnChange: false,
    onSubmit: async (values: FormValues, { setSubmitting }: FormikHelpers<FormValues>) => {
      try {
        const nvalues = { ...values };
        // Add your submit logic here
        
      } catch (error) {
        console.error("Error submitting form", error);
      } finally {
        setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    // Add any side effects or cleanup logic here
  }, []);

  return (
    <>
      <Toaster
        toastOptions={{
          duration: 1000,
          className: "",
          success: {
            style: {
              border: "2px solid #f5621c",
              padding: "16px",
            },
          },
          error: {
            style: {
              border: "2px solid #f5621c",
              padding: "16px",
              color: "#f5621c",
            },
          },
        }}
        position="top-center"
        reverseOrder={false}
      >
        {(t) => (
          <ToastBar toast={t}>
            {({ icon, message }) => (
              <>
                {icon}
                {message}
                {t.type !== "loading" && (
                  <button
                    className="close-icon"
                    onClick={() => {
                      toast.dismiss(t.id);
                    }}
                  ></button>
                )}
              </>
            )}
          </ToastBar>
        )}
      </Toaster>

      <Header />
      <MenuHeader />
      <div className="flex items-center justify-center min-h-auto bg-transparent">
        <div className="flex flex-col justify-center">
          <span className="mb-3 text-2xl font-bold font-novasans text-subheading-400 text-maincolor">
            Change Profile Settings
          </span>

          <div className="container mx-auto">
            <div className="flex items-center justify-center min-h-screen bg-transparent">
              <div className="relative flex flex-col m-6 space-y-8 bg-white shadow-2xl rounded-2xl md:flex-row md:space-y-0">
                <div className="flex flex-col justify-center p-8 md:p-14">
                  <form className="py-4" onSubmit={formik.handleSubmit}>
                    <div className="py-4">
                      <span className="mb-2 text-md font-novasans font-bold text-gray-500">
                        Name
                      </span>
                      <input
                        {...formik.getFieldProps("name")}
                        id="name"
                        type="text"
                        className="w-full placeholder:font-novasans border-b p-2 focus:outline-none text-center focus:border-maincolor focus:border-b-2 transition-colors placeholder:font-light"
                        placeholder="Name"
                      />
                    </div>

                    <div className="py-4">
                      <span className="mb-2 text-md font-novasans font-bold text-gray-500">
                        Password
                      </span>
                      <input
                        {...formik.getFieldProps("password")}
                        id="password"
                        type="password"
                        className="w-full placeholder:font-novasans border-b p-2 focus:outline-none text-center focus:border-maincolor focus:border-b-2 transition-colors placeholder:font-light"
                        placeholder="Password"
                      />
                    </div>

                    <div className="py-4">
                      <span className="mb-2 text-md font-novasans font-bold text-gray-500">
                        Email
                      </span>
                      <input
                        {...formik.getFieldProps("email")}
                        id="email"
                        type="email"
                        className="w-full placeholder:font-novasans border-b p-2 focus:outline-none text-center focus:border-maincolor focus:border-b-2 transition-colors placeholder:font-light"
                        placeholder="Email"
                      />
                    </div>

                    <div className="py-4">
                      <span className="mb-2 text-md font-novasans font-bold text-gray-500">
                        Company
                      </span>
                      <input
                        {...formik.getFieldProps("company")}
                        id="company"
                        type="text"
                        className="w-full placeholder:font-novasans border-b p-2 focus:outline-none text-center focus:border-maincolor focus:border-b-2 transition-colors placeholder:font-light"
                        placeholder="Company"
                      />
                    </div>

                    <div className="py-4">
                      <span className="mb-2 text-md font-novasans font-bold text-gray-500">
                        Website
                      </span>
                      <input
                        {...formik.getFieldProps("website")}
                        id="website"
                        type="text"
                        className="w-full placeholder:font-novasans border-b p-2 focus:outline-none text-center focus:border-maincolor focus:border-b-2 transition-colors placeholder:font-light"
                        placeholder="Website"
                      />
                    </div>

                    <div className="py-4">
                      <span className="mb-2 text-md font-novasans font-bold text-gray-500">
                        User Name {user?.username}
                      </span>
                      <input
                        id="username"
                        type="text"
                        value={user?.username || ""}
                        className="w-full placeholder:font-novasans border-b p-2 focus:outline-none text-center focus:border-maincolor focus:border-b-2 transition-colors placeholder:font-light"
                        placeholder="User Name"
                        readOnly
                      />
                    </div>

                    <div className="py-4">
                      <button
                        type="submit"
                        className="w-full border h-12 bg-maincolor text-white border-gray-300 text-md p-2 rounded-lg mb-6 hover:bg-maincolor hover:text-white"
                      >
                        Update Profile
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserSetting;
