import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { get } from "@/helper/api";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

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
}

interface AddressSearchFieldProps {
  onSelect: (address: ResolvedAddress) => void;
}

// Search-as-you-type UK address lookup, backed by our own /address-lookup
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
  const debouncedQuery = useDebouncedValue(query, 300);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setIsSearching(true);
      try {
        const { data } = await get<{ suggestions: AddressSuggestion[] }>(
          `address-lookup/autocomplete?q=${encodeURIComponent(debouncedQuery)}`
        );
        if (!cancelled) {
          setSuggestions(data?.suggestions || []);
          setIsOpen(true);
        }
      } catch {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

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
      <label className="text-muted-foreground font-medium text-sm">Search for an address</label>
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          placeholder="Start typing an address or postcode..."
          className="pl-9"
        />
        {(isSearching || isResolving) && (
          <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
        )}
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
      <p className="text-xs text-muted-foreground">Fills in the address fields below — you can still edit them after.</p>
    </div>
  );
};

export default AddressSearchField;
