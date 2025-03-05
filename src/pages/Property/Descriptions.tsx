import React, { useState } from "react";
import InputField from "../../utils/InputField";
import TextAreaField from "../../utils/TextAreaField";

const Description = ({ register, watch, clearErrors, setValue, errors }: any) => {
  const [rooms, setRooms] = useState<{ title: string; description: string; dimensions: string }[]>([]);

  const addRoom = () => {
    setRooms([...rooms, { title: "", description: "", dimensions: "" }]);
  };

  const updateRoom = (index: number, field: string, value: string) => {
    const updatedRooms = rooms.map((room, i) =>
      i === index ? { ...room, [field]: value } : room
    );
    setRooms(updatedRooms);
  };

  const removeRoom = (index: number) => {
    setRooms(rooms.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full p-4">
      <div className="text-lg font-medium underline p-5">Descriptions</div>
      <TextAreaField
        label="Short Summary"
        name="shortSummary"
        register={register}
        error={errors.shortSummary?.message?.toString()}
      />

      <TextAreaField
        label="Full Description"
        name="fullDescription"
        register={register}
        error={errors.fullDescription?.message?.toString()}
      />

      <div className="text-lg font-medium underline p-5">Rooms</div>
      {rooms.map((room, index) => (
        <div key={index} className="border p-4 mb-4">
          <InputField
            label="Room Title"
            name={`roomTitle${index}`}
            register={register}
            setValue={setValue}
            error={errors[`roomTitle${index}`]?.message?.toString()}
          />
          <TextAreaField
            label="Room Description"
            name={`roomDescription${index}`}
            register={register}
            error={errors[`roomDescription${index}`]?.message?.toString()}
          />
          <InputField
            label="Room Dimensions"
            name={`roomDimensions${index}`}
            register={register}
            setValue={setValue}
            error={errors[`roomDimensions${index}`]?.message?.toString()}
          />
          <button
            type="button"
            className="bg-red-500 text-white px-3 py-1 mt-2 rounded"
            onClick={() => removeRoom(index)}
          >
            Remove Room
          </button>
        </div>
      ))}
      <button
        type="button"
        className="bg-blue-500 text-white px-4 py-2 mt-4 rounded"
        onClick={addRoom}
      >
        Add Room
      </button>
    </div>
  );
};

export default Description;
