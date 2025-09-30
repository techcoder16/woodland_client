import React, { useEffect, useState } from "react";
import { FaPlus, FaTrash, FaSave, FaEdit } from "react-icons/fa";
import InputField from "./InputField";
import TextAreaField from "./TextAreaField";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

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
  const [open, setOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const { toast } = useToast();
  const watchedRooms = watch("rooms");
  const rooms =
    typeof watchedRooms === "string"
      ? JSON.parse(watchedRooms)
      : watchedRooms || [];



  const addRoom = () => {
    const newRooms = [...rooms, { title: "", description: "", dimensions: "" }];
    setValue("rooms", newRooms, { shouldValidate: true });
    setEditIndex(newRooms.length - 1);
    setOpen(true);
  };

  const removeRoom = (index: number) => {
    const updatedRooms = rooms.filter((_: any, i: number) => i !== index);
    setValue("rooms", updatedRooms, { shouldValidate: true });
    clearErrors(`rooms.${index}`);
  };

  
  const handleSaveRoomsEdit = () => {
    console.log("Saving rooms:", rooms);
    setValue("rooms", rooms, { shouldValidate: true });
    clearErrors("rooms");
    setOpen(false);
  toast({ title: "Room updated", description: "Room updated successfully!" });
  };


  const handleSaveRooms = () => {
    console.log("Saving rooms:", rooms);
    setValue("rooms", rooms, { shouldValidate: true });
    clearErrors("rooms");
    setOpen(false);
          toast({ title: "Success", description: "All Rooms Saved successfully!" });
  };

  const handleEdit = (index: number) => {
    setEditIndex(index);
    setOpen(true);
  };

  return (
    <div className="w-full p-4">
      <div className="text-lg font-medium underline p-5">Rooms</div>

      {/* Rooms Table */}
      {rooms.length > 0 ? (
        <table className="w-full border">
          <thead>
            <tr className="text-left border-b">
              <th className="p-2">#</th>
              <th className="p-2">Title</th>
              <th className="p-2">Description</th>
              <th className="p-2">Dimensions</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((room: any, index: number) => (
              <tr key={index} className="border-b">
                <td className="p-2">{index + 1}</td>
                <td className="p-2">{room.title}</td>
                <td className="p-2">{room.description}</td>
                <td className="p-2">{room.dimensions}</td>
                <td className="p-2 space-x-2">
                  <Button type="button" onClick={() => handleEdit(index)}>
                    <FaEdit className="mr-2" /> Edit
                  </Button>
                  <Button type="button" onClick={() => removeRoom(index)}>
                    <FaTrash className="mr-2" /> Remove
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="text-center text-sm mt-2">No rooms added yet</div>
      )}

      {/* Add / Save Buttons */}
      <div className="flex space-x-4 mt-4">
        <Button type="button" onClick={addRoom}>
          <FaPlus className="mr-2" /> Add Room
        </Button>
        <Button type="button" onClick={handleSaveRooms}>
          <FaSave className="mr-2" /> Save Rooms
        </Button>
      </div>

      {/* Modal for Add/Edit */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editIndex !== null ? "Edit Room" : "Add Room"}
            </DialogTitle>
          </DialogHeader>

          {editIndex !== null && (
            <div className="space-y-4">
              <InputField
                label="Room Title"
                name={`rooms.${editIndex}.title`}
                register={register}
                setValue={setValue}
                error={errors?.rooms?.[editIndex]?.title?.message?.toString()}
              />
              <TextAreaField
                label="Room Description"
                name={`rooms.${editIndex}.description`}
                register={register}
                error={errors?.rooms?.[editIndex]?.description?.message?.toString()}
              />
              <InputField
                label="Room Dimensions"
                name={`rooms.${editIndex}.dimensions`}
                register={register}
                setValue={setValue}
                error={errors?.rooms?.[editIndex]?.dimensions?.message?.toString()}
              />
              <div className="flex justify-end space-x-2">
                <Button type="button" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleSaveRoomsEdit}>
                  <FaSave className="mr-2" /> Save
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Room;
