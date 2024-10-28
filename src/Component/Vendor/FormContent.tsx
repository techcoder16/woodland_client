import React from 'react';



const FormContent = () => (



  <form>
    <div className="mb-4">
      <label className="block text-gray-700 font-bold mb-2">Landlord** <input type="checkbox" className="ml-2" /></label>
      <label className="block text-gray-700 font-bold mb-2">Vendor** <input type="checkbox" className="ml-2" checked /></label>
    </div>
    <div className="mb-4">
      <label className="block text-gray-700 font-bold mb-2">Type</label>
      <select className="w-full p-2 border border-gray-300 rounded">
        <option>Individual</option>
        <option>Company</option>
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

export default FormContent;
