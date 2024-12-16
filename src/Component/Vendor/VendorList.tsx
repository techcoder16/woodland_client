import React, { useState } from 'react';
import StandardInfo from './StandardInfo';
import InternalInfo from './InternalInfo';
import BankDetails from './BankDetails';
import WebLogin from './WebLogin';
import Attachments from './Attachments';

const VendorList = () => {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    { label: "Standard Info", content: <StandardInfo /> },
    { label: "Internal Info", content: <InternalInfo /> },
    { label: "Bank Details", content: <BankDetails /> },
    { label: "Web Login", content: <WebLogin /> },
    { label: "Attachments", content: <Attachments /> },
  ];

  const renderStepLines = () => (
    <div className="flex items-center">
      {tabs.map((_, index) => (
        <React.Fragment key={index}>
          <div className={`w-8 h-8 flex items-center justify-center rounded-full ${index <= activeTab ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
            {index + 1}
          </div>
          {index < tabs.length - 1 && <div className={`flex-1 h-0.5 ${index < activeTab ? 'bg-blue-600' : 'bg-gray-300'}`}></div>}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div className='items-start w-full font-sans'>
      <div className="container mx-auto p-4">
        <div className="bg-white shadow-md rounded-lg p-4">
          <div className="flex items-center mb-4">
            <div className="flex-1">
              <ul className="flex space-x-2">
                {tabs.map((tab, index) => (
                  <li key={index} className={`px-4 py-2 rounded-t-lg cursor-pointer ${index === activeTab ? 'bg-blue-600 text-white' : 'bg-gray-400 text-white'}`} onClick={() => setActiveTab(index)}>
                    {tab.label} <span className="text-xs">Step {index + 1}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="text-sm text-gray-500">
              <a href="#" className="text-green-500">Landlords/Vendors</a> / Add new landlord / vendor
            </div>
          </div>

          {renderStepLines()}

     
          <div className="flex w-full mx-auto bg-white p-6 rounded-lg shadow-md">
            {tabs[activeTab].content}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorList;
