import React from "react";
import { FaPlus, FaTrash, FaEdit } from "react-icons/fa";
import { Button } from "@/components/ui/button";

interface RoomTableProps {
  rooms: any[];
  onAdd: () => void;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
}

const RoomTable: React.FC<RoomTableProps> = ({ rooms, onAdd, onEdit, onDelete }) => {
  return (
    <div className="w-full p-4 border rounded shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold underline">Rooms</h3>
        <Button className="bg-red-600 text-white" onClick={onAdd}>
          <FaPlus className="mr-2" /> Add Room
        </Button>
      </div>

      {rooms.length === 0 ? (
        <p className="text-gray-500 text-sm italic">No rooms added yet.</p>
      ) : (
        <table className="min-w-full text-sm border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2 text-left">#</th>
              <th className="border p-2 text-left">Title</th>
              <th className="border p-2 text-left">Description</th>
              <th className="border p-2 text-left">Dimensions</th>
              <th className="border p-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((room, index) => (
              <tr key={index}>
                <td className="border p-2">{index + 1}</td>
                <td className="border p-2">{room.title}</td>
                <td className="border p-2">{room.description}</td>
                <td className="border p-2">{room.dimensions}</td>
                <td className="border p-2 text-center">
                  <button
                    className="text-blue-600 hover:text-blue-800 mx-2"
                    onClick={() => onEdit(index)}
                  >
                    <FaEdit />
                  </button>
                  <button
                    className="text-red-600 hover:text-red-800 mx-2"
                    onClick={() => onDelete(index)}
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default React.memo(RoomTable);
