import React, { useState, useEffect } from 'react';
import { get } from '@/helper/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
}

interface EmployeeDropdownProps {
  onEmployeeSelect: (employeeId: string | null) => void;
  selectedEmployeeId?: string;
  placeholder?: string;
  label?: string;
  required?: boolean;
}

export const EmployeeDropdown: React.FC<EmployeeDropdownProps> = ({
  onEmployeeSelect,
  selectedEmployeeId,
  placeholder = "Select an employee",
  label = "Employee",
  required = false
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: apiError } = await get<User[]>('users/all');
      
      if (apiError) {
        setError(apiError.message || 'Failed to fetch users');
        return;
      }
      
      if (data) {
        setUsers(data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = (value: string) => {
    if (value === 'none') {
      onEmployeeSelect(null);
    } else {
      onEmployeeSelect(value);
    }
  };

  const getDisplayName = (user: User) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name} (${user.email})`;
    }
    return user.email;
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {label && <Label>{label} {required && <span className="text-red-500">*</span>}</Label>}
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">Loading employees...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        {label && <Label>{label} {required && <span className="text-red-500">*</span>}</Label>}
        <div className="text-sm text-red-500">
          {error}
          <button 
            onClick={fetchUsers}
            className="ml-2 text-blue-500 hover:underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label && <Label>{label} {required && <span className="text-red-500">*</span>}</Label>}
      <Select 
        value={selectedEmployeeId || 'none'} 
        onValueChange={handleValueChange}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No employee selected</SelectItem>
          {users.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              <div className="flex flex-col">
                <span>{getDisplayName(user)}</span>
                <span className="text-xs text-muted-foreground capitalize">
                  {user.role}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default EmployeeDropdown;
