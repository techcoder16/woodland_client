import React, { useState } from 'react';
import EmployeeDropdown from '@/components/EmployeeDropdown';

/**
 * Example component showing how to use EmployeeDropdown
 * This can be used in any component that needs employee selection
 */
export const EmployeeDropdownUsage: React.FC = () => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  const handleEmployeeSelect = (employeeId: string | null) => {
    setSelectedEmployeeId(employeeId);
    console.log('Selected employee ID:', employeeId);
    
  };

  return (
    <div className="space-y-4">
      <h3>Employee Selection Example</h3>
      
      <EmployeeDropdown
        label="Select Employee"
        onEmployeeSelect={handleEmployeeSelect}
        selectedEmployeeId={selectedEmployeeId}
        placeholder="Choose an employee"
        required={true}
      />
      
      {selectedEmployeeId && (
        <div className="p-3 bg-green-50 rounded">
          <p className="text-sm">
            <strong>Selected Employee ID:</strong> {selectedEmployeeId}
          </p>
          <p className="text-xs text-muted-foreground">
            This ID can be sent to your Notes and Job Type APIs
          </p>
        </div>
      )}
    </div>
  );
};

export default EmployeeDropdownUsage;
