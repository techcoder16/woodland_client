import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface RoomRow {
  name: string;
  length: number | "";
  width: number | "";
}

interface RoomsTableProps {
  rooms: RoomRow[];
  onChange: (rooms: RoomRow[]) => void;
}

const calculateArea = (length: number | "", width: number | "") => {
  if (length === "" || width === "" || isNaN(Number(length)) || isNaN(Number(width))) {
    return 0;
  }
  return Number(length) * Number(width);
};

const RoomsTable: React.FC<RoomsTableProps> = ({ rooms, onChange }) => {
  const updateRoom = (index: number, patch: Partial<RoomRow>) => {
    const updated = rooms.map((room, i) => (i === index ? { ...room, ...patch } : room));
    onChange(updated);
  };

  const addRoom = () => {
    onChange([...rooms, { name: "", length: "", width: "" }]);
  };

  const removeRoom = (index: number) => {
    onChange(rooms.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full">
      <div className="text-lg font-medium underline p-2">Rooms / Floor Numbers</div>
      <div className="overflow-x-auto">
        <table className="w-full border">
          <thead>
            <tr className="text-left border-b bg-muted/50">
              <th className="p-2">Room Name</th>
              <th className="p-2">Length (m)</th>
              <th className="p-2">Width (m)</th>
              <th className="p-2">Area (m²)</th>
              <th className="p-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((room, index) => (
              <tr key={index} className="border-b">
                <td className="p-2">
                  <Input
                    value={room.name}
                    onChange={(e) => updateRoom(index, { name: e.target.value })}
                    placeholder="e.g. Living Room"
                  />
                </td>
                <td className="p-2">
                  <Input
                    type="number"
                    step="any"
                    min={0}
                    value={room.length}
                    onChange={(e) =>
                      updateRoom(index, {
                        length: e.target.value === "" ? "" : Number(e.target.value),
                      })
                    }
                  />
                </td>
                <td className="p-2">
                  <Input
                    type="number"
                    step="any"
                    min={0}
                    value={room.width}
                    onChange={(e) =>
                      updateRoom(index, {
                        width: e.target.value === "" ? "" : Number(e.target.value),
                      })
                    }
                  />
                </td>
                <td className="p-2 font-medium">
                  {calculateArea(room.length, room.width).toFixed(2)}
                </td>
                <td className="p-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRoom(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
            {rooms.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-sm text-muted-foreground">
                  No rooms added yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Button type="button" variant="outline" className="mt-3" onClick={addRoom}>
        <Plus className="mr-2 h-4 w-4" /> Add Room
      </Button>
    </div>
  );
};

export default RoomsTable;
