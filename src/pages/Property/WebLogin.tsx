import React, { useState, useEffect } from 'react';
import InputField from '../../utils/InputField';
import { VscEye, VscEyeClosed } from 'react-icons/vsc';

const WebLogin = ({ register, clearErrors, setValue, unregister, errors, watch }: any) => {
  // Get the current value from the form state
  const savedOption = watch("accountOption");
  console.log(savedOption);
  // Initialize local state with the saved value if available, otherwise default to 'noAccount'
  const [accountOption, setAccountOption] = useState<string>(savedOption || 'noAccount');
  const [isPasswordVisible, setPasswordVisible] = useState(false);

 useEffect(()=>{

  if (savedOption === 'existingAccount') {
    clearErrors(['username', 'password']);
    unregister(['username', 'password']); // Unregister unnecessary fields
  } else if (savedOption === 'createAccount') {
    clearErrors(['existingUsername']);
    unregister('existingUsername'); // Unregister the existing username field
  } else if (savedOption === 'noAccount') {
    clearErrors(['username', 'password', 'existingUsername']);
    unregister(['username', 'password', 'existingUsername']); // Unregister all input fields
  }
  
  
 },[savedOption])
  // Register 'accountOption' field on mount
  useEffect(() => {
    register('accountOption', { required: 'Please select an option' });
  }, [register]);

  // Whenever the saved option changes (for example, when navigating back), update local state
  useEffect(() => {
    if (savedOption) {
      setAccountOption(savedOption);
    }
  }, [savedOption]);

  const handleOptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAccountOption(value);
    setValue('accountOption', value, { shouldValidate: true });

    // Unregister fields from previous selections
    if (value === 'existingAccount') {
      clearErrors(['username', 'password']);
      unregister(['username', 'password']); // Unregister unnecessary fields
    } else if (value === 'createAccount') {
      clearErrors(['existingUsername']);
      unregister('existingUsername'); // Unregister the existing username field
    } else if (value === 'noAccount') {
      clearErrors(['username', 'password', 'existingUsername']);
      unregister(['username', 'password', 'existingUsername']); // Unregister all input fields
    }

  };

  return (
    <div>
      <div className="text-lg font-medium text-gray-600 flex justify-start underline p-5">
        Web Login
      </div>
      <div className="p-5">
        <div className="text-gray-600 mb-2">Please select an option:</div>
        <div className="flex flex-col gap-2">
          {[
            { value: 'noAccount', label: 'Do not create a user account' },
            { value: 'createAccount', label: 'Create a new user account' },
            { value: 'existingAccount', label: 'This user is already registered, please enter the username below' },
          ].map((option, idx) => (
            <label key={idx} className="flex items-center gap-2">
              <input
                type="radio"
                name="accountOption"
                value={option.value}
                {...register("accountOption")}
                onChange={handleOptionChange}
                checked={accountOption === option.value}
                className="form-radio"
              />
              {option.label}
            </label>
          ))}
        </div>
        {errors.accountOption && (
          <p className="text-red-500 text-sm mt-2">{errors.accountOption.message}</p>
        )}
      </div>

      {/* Fields for Create Account */}
      {accountOption === 'createAccount' && (
        <div className="p-5">
          <InputField 
            setValue={setValue}
            label="User Name"
            name="username"
            register={register}
            error={errors.username?.message?.toString()}
          />
          <div className="relative">
            <InputField 
              setValue={setValue}
              name="password"
              label="Password"
              type={isPasswordVisible ? 'text' : 'password'}
              register={register}
              error={errors.password?.message?.toString()}
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setPasswordVisible(!isPasswordVisible)}
              className="absolute right-5 top-6 text-gray-500 hover:text-gray-700"
            >
              {isPasswordVisible ? <VscEye /> : <VscEyeClosed />}
            </button>
          </div>
        </div>
      )}

      {/* Fields for Existing Account */}
      {accountOption === 'existingAccount' && (
        <div className="p-5">
          <InputField 
            setValue={setValue}
            label="Existing Username"
            name="existingUsername"
            register={register}
            error={errors.existingUsername?.message?.toString()}
          />
        </div>
      )}
    </div>
  );
};

export default WebLogin;
