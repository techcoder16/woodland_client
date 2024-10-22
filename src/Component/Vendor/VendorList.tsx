import React, { useState } from 'react';

const VendorList = () => {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    { label: "Standard Info", content: <StandardInfo /> },
    { label: "Internal Info", content: <InternalInfo /> },
    { label: "Bank Details", content: <BankDetails /> },
    { label: "Web Login", content: <WebLogin /> },
    { label: "Attachments", content: <Attachments /> },
  ];

  const renderStepLines = () => {
    return (
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
  };

  return (
    <div className='items-start w-full'>
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

          <div className="flex justify-between mb-4">
            {/* <div className="flex space-x-2">
              <button className="bg-gray-300 text-gray-700 px-4 py-2 rounded">Cancel</button>
              <button className="bg-orange-500 text-white px-4 py-2 rounded">Next</button>
            </div>
             */}
          </div>

          <div className="text-lg font-semibold">Personal information</div>
          <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
            {tabs[activeTab].content}
          </div>
        </div>
      </div>
    </div>
  );
};

const StandardInfo = () => (
  <FormContent />
);

const InternalInfo = () => (
  <div>Internal Info Content</div>
);

const BankDetails = () => (
  <div>Bank Details Content</div>
);

const WebLogin = () => (
  <div>Web Login Content</div>
);

const Attachments = () => (
  <div>Attachments Content</div>
);

const FormContent = () => (
  <form className=''>
    <div className="mb-4">
      <label className="block text-gray-700 font-bold mb-2">Landlord** <input type="checkbox" className="ml-2" /></label>
      <label className="block text-gray-700 font-bold mb-2">Vendor** <input type="checkbox" className="ml-2" checked /></label>
    </div>
    <div className="mb-4">
      <label className="block text-gray-700 font-bold mb-2">Type</label>
      <select className="w-full p-2 border border-gray-300 rounded">
        <option>Individual</option>
      </select>
    </div>
    <div className="mb-4">
      <label className="block text-gray-700 font-bold mb-2">Title</label>
      <select className="w-full p-2 border border-gray-300 rounded">
        <option>Please select</option>
      </select>
    </div>
    <div className="mb-4">
      <label className="block text-red-500 font-bold mb-2">First name*</label>
      <input type="text" className="w-full p-2 border border-red-500 rounded bg-red-100" />
    </div>
    <div className="mb-4">
      <label className="block text-red-500 font-bold mb-2">Last name*</label>
      <input type="text" className="w-full p-2 border border-red-500 rounded bg-red-100" />
    </div>
    <div className="mb-4">
      <label className="block text-gray-700 font-bold mb-2">Company</label>
      <input type="text" className="w-full p-2 border border-gray-300 rounded" />
    </div>
    <div className="mb-4">
      <label className="block text-gray-700 font-bold mb-2">Salutation</label>
      <select className="w-full p-2 border border-gray-300 rounded">
        <option>Full Name</option>
      </select>
    </div>
  </form>
);

export default VendorList;
