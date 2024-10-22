import React from 'react'

import "./Toaster.css";

import { toast, Toaster, ToastBar } from "react-hot-toast";
const ToasterGen = () => {
  return (
    <div>
       <Toaster
    toastOptions={{
      duration: 1500,
      className: "",
      success: {
        style: {
          border: "2px solid #F5F5F5",
          padding: "16px",
          backgroundColor: "#F5F5F5", // Add your desired background color
          color: "#171717",
         fontFamily:"sans-serif"
        },
      },
      error: {
        style: {
          border: "2px solid #F5F5F5",
          padding: "16px",
          color: "#171717",
   
          fontFamily:"sans-serif",
          backgroundColor: "#F5F5F5",

        },
      },
    }}
    position="top-center"

  >
    {(t) => (
      <ToastBar toast={t}>
        {({ icon, message }:any) => (
          <>
            {icon}
            {message}
            {t.type !== "loading" && (
              <button
                className="close-icon"
                onClick={() => toast.dismiss(t.id)}
              ></button>
            )}
          </>
        )}
      </ToastBar>
    )}
  </Toaster>
  
  </div>
  )
}

export default ToasterGen