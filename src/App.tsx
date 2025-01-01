import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from './ThemeContext';
import router from './utils/router';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <div className="App dark:bg-gray-900 min-h-screen transition-colors duration-200">
        <RouterProvider router={router} />
      </div>
    </ThemeProvider>
  );
}

export default App;