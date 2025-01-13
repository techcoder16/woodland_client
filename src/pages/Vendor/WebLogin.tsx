import React, { useState } from 'react';
import InputField from '../../utils/InputField';
import { VscEye, VscEyeClosed } from 'react-icons/vsc';

const WebLogin = ({ register, errors, setValue, clearErrors }: any) => {
  const [accountOption, setAccountOption] = useState<string>('noAccount');
  const [isPasswordVisible, setPasswordVisible] = useState(false);

  const handleOptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log(value)
    setAccountOption(value);
    setValue('accountOption', value, { shouldValidate: true });
    if (value == 'existingAccount')
    {
    
      clearErrors(['username', 'password']);
    }

if (value == 'createAccount')
    {
      clearErrors(['existingUsername']);
    }
    

    if (value === 'noAccount') {

      clearErrors(['username', 'password', 'existingUsername']);
    }

  };

  return (
    <div>
      <div className="text-lg font-medium text-gray-600 flex justify-start underline p-5">Web Login</div>
      <div className="p-5">
        <div className="text-gray-600 mb-2">Please select an option:</div>
        <div className="flex flex-col gap-2">
          {['noAccount', 'createAccount', 'existingAccount'].map((option, idx) => (
            <label key={idx} className="flex items-center gap-2">
              <input
                type="radio"
                name="accountOption"
                value={option}
                onChange={handleOptionChange}
                checked={accountOption === option}
                {...register("accountOption")}

                className="form-radio"
              />
              {option === 'noAccount' && 'Do not create a user account'}
              {option === 'createAccount' && 'Create a new user account'}
              {option === 'existingAccount' && 'This user is already registered, please enter the username below'}
            </label>
          ))}
        </div>
        {errors.accountOption && (
          <p className="text-red-500 text-sm mt-2">{errors.accountOption.message}</p>
        )}
      </div>

      {accountOption === 'createAccount' && (
        <div className="p-5">
          <InputField
            label="User Name"
            name="username"
            register={register}
            error={errors.username?.message?.toString()}
          />
          <div className="relative">
            <InputField
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

      {accountOption === 'existingAccount' && (
        <div className="p-5">
          <InputField
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
