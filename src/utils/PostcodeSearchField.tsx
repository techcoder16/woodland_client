import React, { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { lookupPostcode, PostcodeAddress } from "@/helper/postcodeLookup";
import { useToast } from "@/components/ui/use-toast";

interface PostcodeSearchFieldProps {
  postcode: string;
  onPostcodeChange: (value: string) => void;
  onAddressSelect: (address: PostcodeAddress) => void;
}

const PostcodeSearchField: React.FC<PostcodeSearchFieldProps> = ({
  postcode,
  onPostcodeChange,
  onAddressSelect,
}) => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PostcodeAddress[]>([]);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!postcode.trim()) return;
    setLoading(true);
    try {
      const addresses = await lookupPostcode(postcode);
      setResults(addresses);
      if (addresses.length === 0) {
        toast({
          title: "No addresses found",
          description: "Check the postcode or enter the address manually.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Postcode lookup failed",
        description: error.message || "Could not look up this postcode.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-3 rounded-sm">
      <label className="text-gray-700 font-medium text-sm mr-4 w-32">Post Code</label>
      <div className="flex gap-2">
        <Input
          value={postcode}
          onChange={(e) => onPostcodeChange(e.target.value)}
          placeholder="Search postcode..."
        />
        <Button type="button" variant="outline" onClick={handleSearch} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
      </div>

      {results.length > 0 && (
        <div className="mt-2 border rounded-md max-h-48 overflow-y-auto">
          {results.map((address, index) => (
            <button
              key={index}
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-muted border-b last:border-b-0"
              onClick={() => {
                onAddressSelect(address);
                setResults([]);
              }}
            >
              {[address.line1, address.line2, address.town, address.county]
                .filter(Boolean)
                .join(", ")}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PostcodeSearchField;
