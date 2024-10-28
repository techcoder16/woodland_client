import React from 'react';

const InternalInfo = () => (
  <div>

<div className="max-w-4xl mx-auto bg-white p-6 rounded shadow">
        <div className="border-b pb-4 mb-4">
            <h2 className="text-lg font-semibold text-gray-700">Other info</h2>
        </div>
        <div className="space-y-4">
            <div className="flex items-center space-x-4">
                <input type="checkbox" className="form-checkbox h-5 w-5 text-gray-600"/>
                <label className="text-gray-700">Do not receive viewing feedback notifications</label>
            </div>
            <div className="grid grid-cols-1 gap-4">
                <div>
                    <label className="block text-gray-700">Label</label>
                    <select className="mt-1 block w-full bg-gray-100 border border-gray-300 rounded py-2 px-3 text-gray-700">
                        <option>--Select--</option>
                    </select>
                </div>
                <div>
                    <label className="block text-gray-700">Status</label>
                    <input type="text" value="Active" className="mt-1 block w-full bg-gray-100 border border-gray-300 rounded py-2 px-3 text-gray-700"/>
                </div>
                <div>
                    <label className="block text-gray-700">Branch</label>
                    <select className="mt-1 block w-full bg-gray-100 border border-gray-300 rounded py-2 px-3 text-gray-700">
                        <option>Woodland</option>
                    </select>
                </div>
                <div>
                    <label className="block text-gray-700">Negotiator</label>
                    <select className="mt-1 block w-full bg-gray-100 border border-gray-300 rounded py-2 px-3 text-gray-700">
                        <option>skumar (Santosh Kumar)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-red-500">Lead source</label>
                    <select className="mt-1 block w-full bg-gray-100 border border-gray-300 rounded py-2 px-3 text-gray-700">
                        <option></option>
                    </select>
                </div>
            </div>
        </div>
    
    </div>


  </div>
);

export default InternalInfo;
