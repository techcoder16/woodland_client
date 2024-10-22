import React from 'react';
import logo from './logo.svg';

import './App.css';
import { Route, RouterProvider } from 'react-router-dom';
import router from './utils/router';

function App() {
  return (

    <div className="App">
    <>
    <RouterProvider router={router}></RouterProvider>

    </>
    </div>
  );
}

export default App;
