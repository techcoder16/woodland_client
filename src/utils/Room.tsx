import React, { useEffect } from "react";
import { FaPlus, FaTrash, FaSave } from "react-icons/fa";
import InputField from "./InputField";
import TextAreaField from "./TextAreaField";

interface RoomProps {
  register: any;
  watch: any;
  setValue: any;
  clearErrors: any;
  errors: any;
}

const Room: React.FC<RoomProps> = ({
  register,
  watch,
  setValue,
  clearErrors,
  errors,
}) => {
  // Retrieve the current rooms array from the form state; default to empty array.
  let rooms = watch("rooms") || [];
console.log(typeof rooms)
if (typeof rooms == "string")
{
  rooms  = JSON.parse(rooms);

}
  // On mount, check if there's a saved rooms state in localStorage.
  useEffect(() => {
    const savedRooms = localStorage.getItem("rooms");
    if (savedRooms) {
      const parsedRooms = JSON.parse(savedRooms);
      setValue("rooms", parsedRooms, { shouldValidate: true });
    }
  }, [setValue]);

  // Whenever rooms change, save the entire rooms array (including empty rooms) to localStorage.
  useEffect(() => {
    console.log("Rooms:", rooms);
    localStorage.setItem("rooms", JSON.stringify(rooms));
  }, [rooms]);

  // Log rooms for debugging on every update.
  useEffect(() => {
    console.log("Rooms updated:", rooms);
  }, [rooms]);

  // Function to add a new room (this room is empty until filled)
  const addRoom = () => {
    const newRooms = [...rooms, { title: "", description: "", dimensions: "" }];
    setValue("rooms", newRooms, { shouldValidate: true });
  };

  // Function to remove a room at a given index
  const removeRoom = (index: number) => {
    const updatedRooms = rooms.filter((_: any, i: number) => i !== index);
    setValue("rooms", updatedRooms, { shouldValidate: true });
    clearErrors(`rooms.${index}`);
  };

  // Function to explicitly "save" the current rooms into the form state and show a toast.
  const handleSaveRooms = () => {
    setValue("rooms", rooms, { shouldValidate: true });
    clearErrors("rooms");
    console.log("Rooms saved:", rooms);
    // Using a toast is recommended; for example, react-toastify can be used.
    // Here, we'll just log to the console.
    // Replace the below line with your toast implementation.
    console.log("Rooms saved!");
  };

  return (
    <div className="w-full p-4">
      <div className="text-lg font-medium underline p-5">Rooms</div>
      {rooms && rooms.map((room: any, index: number) => (
        <div key={index} className="border p-4 mb-4 rounded shadow-sm">
          <InputField
            label="Room Title"
            name={`rooms.${index}.title`}
            register={register}
            setValue={setValue}
            error={errors?.rooms?.[index]?.title?.message?.toString()}
          />
          <TextAreaField
            label="Room Description"
            name={`rooms.${index}.description`}
            register={register}
            error={errors?.rooms?.[index]?.description?.message?.toString()}
          />
          <InputField
            label="Room Dimensions"
            name={`rooms.${index}.dimensions`}
            register={register}
            setValue={setValue}
            error={errors?.rooms?.[index]?.dimensions?.message?.toString()}
          />
          <button
            type="button"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 mt-2 rounded transition-colors inline-flex items-center"
            onClick={() => removeRoom(index)}
          >
            <FaTrash className="mr-2" />
            Remove Room
          </button>
        </div>
      ))}
      <div className="flex space-x-4">
        <button
          type="button"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 mt-4 rounded transition-colors inline-flex items-center"
          onClick={addRoom}
        >
          <FaPlus className="mr-2" />
          Add Room
        </button>
        <button
          type="button"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 mt-4 rounded transition-colors inline-flex items-center"
          onClick={handleSaveRooms}
        >
          <FaSave className="mr-2" />
          Save Rooms
        </button>
      </div>
      {/* Watch and display the current rooms state */}
      {/* <div className="mt-4 p-2 bg-gray-100 rounded text-sm">
        <strong>Current Rooms State:</strong>
        <pre>{JSON.stringify(rooms, null, 2)}</pre>
      </div> */}
    </div>
  );
};

export default Room;
