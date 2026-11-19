import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import { get } from "@/helper/api";

// Full UK postcode, e.g. "SW1A 1AA" or "M11AE". Lookups are paid per call, so we only
// search when the user presses Search and the text is a complete postcode.
export const UK_POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;

interface AddressSuggestion {
  id: number | string;
  suggestion: string;
}

interface ResolvedAddress {
  addressLine1?: string;
  addressLine2?: string;
  town?: string;
  postCode?: string;
  country?: string;
  council?: string;
}

interface AddressSearchFieldProps {
  onSelect: (address: ResolvedAddress) => void;
}

// Button-triggered UK postcode address lookup, backed by our own /address-lookup
// proxy (which holds the Ideal Postcodes API key server-side). Selecting a
// suggestion resolves the full address and hands it to the caller to
// populate the surrounding form fields — this component holds no form state
// of its own beyond the search box.
const AddressSearchField: React.FC<AddressSearchFieldProps> = ({ onSelect }) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const cache = useRef<Record<string, AddressSuggestion[]>>({});

  const runSearch = async () => {
    const q = query.trim().toUpperCase();
    if (!UK_POSTCODE.test(q)) {
      setError("Enter a full UK postcode, e.g. SW1A 1AA");
      setSuggestions([]);
      setIsOpen(false);
      return;
    }
    setError(null);
    const key = q.replace(/\s+/g, "");
    if (cache.current[key]) {
      setSuggestions(cache.current[key]);
      setIsOpen(true);
      return;
    }
    setIsSearching(true);
    try {
      const { data } = await get<{ suggestions: AddressSuggestion[] }>(
        `address-lookup/autocomplete?q=${encodeURIComponent(q)}`
      );
      const list = data?.suggestions || [];
      cache.current[key] = list;
      setSuggestions(list);
      setIsOpen(true);
      if (list.length === 0) setError("No addresses found for that postcode.");
    } catch {
      setSuggestions([]);
      setError("Address search failed. Try again.");
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = async (suggestion: AddressSuggestion) => {
    setIsResolving(true);
    setIsOpen(false);
    try {
      const { data } = await get<ResolvedAddress>(`address-lookup/resolve/${suggestion.id}`);
      if (data) {
        onSelect(data);
        setQuery(suggestion.suggestion);
      }
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div className="space-y-1.5" ref={boxRef}>
      <label className="text-muted-foreground font-medium text-sm">Search by postcode</label>
      <div className="relative">
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setError(null); }}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void runSearch(); } }}
            placeholder="Enter a postcode, e.g. SW1A 1AA"
            aria-label="Postcode"
          />
          <Button type="button" variant="outline" onClick={() => void runSearch()} disabled={isSearching || isResolving}>
            {isSearching || isResolving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Search className="mr-1.5 h-4 w-4" />}Search
          </Button>
        </div>
        {isOpen && suggestions.length > 0 && (
          <div className="absolute z-50 top-full mt-1 w-full rounded-md border bg-popover shadow-md max-h-72 overflow-y-auto">
            {suggestions.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSelect(s)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted border-b last:border-b-0"
              >
                {s.suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
      <p className="text-xs text-muted-foreground">Press Search to list the addresses at that postcode. Fills in the address fields below; you can still edit them.</p>
    </div>
  );
};

export default AddressSearchField;
