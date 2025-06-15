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
const watchedRooms = watch("rooms");
const rooms = typeof watchedRooms === "string" ? JSON.parse(watchedRooms) : watchedRooms || [];

  useEffect(() => {

   rooms &&  rooms.map((room: any, index: number) => {

    console.log(room.title)
      setValue(`rooms.${index}.title`, room.title || "");
      setValue(`rooms.${index}.description`, room.description || "");
      setValue(`rooms.${index}.dimensions`, room.dimensions || "");
    });
  }, [rooms, setValue]);
  const addRoom = () => {
    const newRooms = [...rooms, { title: "", description: "", dimensions: "" }];
    setValue("rooms", newRooms, { shouldValidate: true });
  };

  const removeRoom = (index: number) => {
    const updatedRooms = rooms.filter((_, i) => i !== index);
    setValue("rooms", updatedRooms, { shouldValidate: true });
    clearErrors(`rooms.${index}`);
  };

  const handleSaveRooms = () => {
    setValue("rooms", rooms, { shouldValidate: true });
    clearErrors("rooms");
    console.log("Rooms saved:", rooms);
  };

  return (
    <div className="w-full p-4">
      <div className="text-lg font-medium underline p-5">Rooms</div>
      {rooms.map((room: any, index: number) => (
        <div key={index} className="border p-4 mb-4 rounded shadow-sm">
          {room.title}
          <InputField
            label="Room Title"
            name={`rooms.${index}.title`}
            register={register}
            setValue={setValue}
            error={errors?.rooms?.[index].title?.message?.toString()}
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
            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 mt-2 rounded inline-flex items-center"
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
          className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 mt-4 rounded inline-flex items-center"
          onClick={addRoom}
        >
          <FaPlus className="mr-2" />
          Add Room
        </button>
        <button
          type="button"
          className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 mt-4 rounded inline-flex items-center"
          onClick={handleSaveRooms}
        >
          <FaSave className="mr-2" />
          Save Rooms
        </button>
      </div>
    </div>
  );
};

export default Room;
