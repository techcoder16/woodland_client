import React, { useEffect, useState } from 'react';
import { DEFAULT_COOKIE_GETTER } from '../../helper/Cookie';
import getApi from '../../helper/getApi';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import postApi from '../../helper/postApi';
import toast from 'react-hot-toast';

const EmailPlan = () => {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userList, setUserList] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);

  // Form schema validation with Zod
  const formSchema = z.object({
    email: z.string().email().min(1, { message: 'Email is Required!' }),
    time: z.string().min(1, { message: 'Time is Required!' }),
    user: z.string().min(1, { message: 'User is Required!' }),
  });

  // Form submission handler
  const onSubmit = async (payload: SettingsSchema) => {
    setProgress(progress + 10);

    try {
      const activationToken = await DEFAULT_COOKIE_GETTER('access_token');
      const headers = {
        'Authorization': 'Bearer ' + activationToken,
        'Accept': '*/*',
        'Access-Control-Allow-Origin': true,
      };


      if (selectedUser) {
        payload.user = selectedUser;
      } else {
        
        toast.error('User selection is required.');
        return; // Early exit if user is not selected
      }
      const { data, error }: any = await postApi('auth/setTime', payload, headers);

      setProgress((prevProgress) => progress + 20);

      if (data && data.message !== '' && !error.message) {
        toast.success(data.message);
        setProgress(100);
      } else {
        toast.error(error.message);
        setProgress(100);
      }
    } catch (err) {
      toast.error('Network Error!');
    }
  };

  // Fetch user list based on email
  useEffect(() => {
    async function fetchUsers() {
      try {
        const activationToken = await DEFAULT_COOKIE_GETTER('access_token');
        const headers = {
          'Authorization': 'Bearer ' + activationToken,
          'Accept': '*/*',
          'Access-Control-Allow-Origin': true,
        };
        let dataEmail = await DEFAULT_COOKIE_GETTER('user');
        dataEmail = JSON.parse(dataEmail || '{}').email;
        const response: any = await getApi('auth/get_team_by_email', dataEmail, headers);
        setUserList(response.data);
      } catch (error) {
        console.log(error);
      }
    }
    fetchUsers();
  }, []);

  // React Hook Form setup
  type SettingsSchema = z.infer<typeof formSchema>;
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SettingsSchema>({
    resolver: zodResolver(formSchema),
  });

  // Handle user selection change
  const handleUserChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedUser(event.target.value);
  };

  return (
    <div>
        

        <div>
          <h2 className="font-semibold  text-2xl">Email Alert
          </h2>
          <h5 className="font-semibold text-gray-400">Represents Email Plan to Adjust email alerts for Managers</h5>
          </div>


      <div className="flex mt-4 p-10">
        <div className="relative">
          <label htmlFor="user-select" className="mr-2">Select User:</label>
          <select
            id="user-select"
            value={selectedUser || ''}
            onChange={handleUserChange}
            className="bg-gray-50 border border-gray-600 text-maincolor text-sm rounded-lg focus:ring-maincolor focus:border-maincolor block w-full pl-3 pr-10 p-2.5"
          >
            <option value="">Select a user</option>
            {userList.map((user) => (
              <option key={user} value={user}>
                {user}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="h-full m-auto w-full">
        <div className="w-full flex justify-center my-auto py-44">
          <div className="flex items-center justify-center bg-transparent">
            <div className="relative bg-white shadow-2xl rounded-2xl">
              <div className="flex flex-col justify-center p-8 md:p-14">
                <form
                  className="w-full max-w-md"
                  onSubmit={handleSubmit(onSubmit)}
                >
                  <h1 className="text-2xl font-Overpass text-gray-600 "></h1>
                  <div className="py-1 w-full ">
                    <div className="py-1 w-full">
                      <span className="mb-2 text-md font-Overpass font-normal text-xs text-gray-600 font-Overpass leading-5 text-line">
                        Trigger Time
                      </span>
                      <input
                        {...register('time')}
                        id="time"
                        type="number"
                        pattern="[0-9]{0,5}"
                        max={60}
                        min={1}
                        className="w-full h-12 bg-transparent border-b-2 border-b-solid text-black border-b-gray-200 font-Overpass text-line placeholder:font-Overpass text-center placeholder:font-light focus:border-b-[#c8ccc7] focus:border-b-2 focus:border-b-solid placeholder:font-Overpass text-xs focus:outline-none"
                        placeholder="Time"
                        autoComplete="on"
                      />
                      {errors.time && (
                        <span className="text-red-500 block mt-1 text-Overpass text-xs">
                          {`${errors.time.message}`}
                        </span>
                      )}
                    </div>
                    <div className="py-1 w-full">
                      <span className="mb-2 text-md font-Overpass font-normal text-xs text-gray-600 font-Overpass leading-5 text-line">
                        Trigger Email
                      </span>
                      <input
                        {...register('email')}
                        id="email"
                        type="email"
                        className="w-full h-12 bg-transparent border-b-2 border-b-solid text-black border-b-gray-200 font-Overpass text-line placeholder:font-Overpass text-center placeholder:font-light focus:border-b-[#c8ccc7] focus:border-b-2 focus:border-b-solid placeholder:font-Overpass text-xs focus:outline-none"
                        placeholder="Email Address"
                        autoComplete="on"
                      />
                      {errors.email && (
                        <span className="text-red-500 block mt-1 text-Overpass text-xs">
                          {`${errors.email.message}`}
                        </span>
                      )}
                    </div>
                    <div className="py-1 w-full">
                      <span className="mb-2 text-md font-Overpass font-normal text-xs text-gray-600 font-Overpass leading-5 text-line">
                        Selected User
                      </span>
                      <input
                        {...register('user')}
                        id="user"
                        value={selectedUser || ''}
                        readOnly
                 
                        className="w-full h-12 bg-transparent border-b-2 border-b-solid text-black border-b-gray-200 font-Overpass text-line placeholder:font-Overpass text-center placeholder:font-light focus:border-b-[#c8ccc7] focus:border-b-2 focus:border-b-solid placeholder:font-Overpass text-xs focus:outline-none"
                        autoComplete="on"
                      />
                      {errors.user && (
                        <span className="text-red-500 block mt-1 text-Overpass text-xs">
                          {`${errors.user.message}`}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    className="font-Overpass text-xs w-40 font-semibold mt-10 h-12 bg-[#c8ccc7] text-white p-2 rounded-lg"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    Apply
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailPlan;
