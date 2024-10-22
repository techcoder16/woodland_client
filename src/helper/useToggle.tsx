import { useState } from "react";

const useToggle = (intialValue:any) => {
  const [toggleValue, setToggleValue] = useState(intialValue);

  const toggle = () => {
    setToggleValue(!toggleValue);
  };

  return [toggleValue, toggle];
};
export default useToggle;
