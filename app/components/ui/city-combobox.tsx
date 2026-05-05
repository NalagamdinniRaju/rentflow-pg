import * as React from "react"
import { Check, ChevronsUpDown, Loader2, Search } from "lucide-react"
import { useDebounce } from "ahooks"
import { cn } from "~/lib/utils"
import { Button } from "~/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover"
import {
  Command,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "~/components/ui/command"
import { useCities } from "~/queries/buildings.query"

export interface CityOption {
  id: string
  name: string
  state?: { name: string } | null
}

interface CityComboboxProps {
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  initialCities?: CityOption[]
}

export function CityCombobox({
  value,
  onValueChange,
  placeholder = "Select city…",
  disabled = false,
  initialCities = [],
}: CityComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const debouncedSearch = useDebounce(search, { wait: 300 })

  console.log('[CityCombobox] current value:', value)
  console.log('[CityCombobox] current search:', search)
  console.log('[CityCombobox] debounced search:', debouncedSearch)

  // Fetch cities based on debounced search
  const { data: cities = [], isFetching } = useCities({
    variables: { searchTerm: debouncedSearch },
    enabled: open, 
  });

  console.log('[CityCombobox] cities fetched:', cities.length)

  // Keep track of the selected city's display name
  const selectedCity = 
    cities.find((c) => c.id === value) || 
    initialCities.find((c) => c.id === value);

  React.useEffect(() => {
    if (open) setSearch(""); // Reset search when opening
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal h-10 px-3 text-sm bg-white"
        >
          <span className="truncate">
            {selectedCity
              ? `${selectedCity.name}${selectedCity.state?.name ? ` (${selectedCity.state.name})` : ""}`
              : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="p-0 sm:w-[350px] !z-[1000] pointer-events-auto" 
        align="start"
        side="bottom"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-slate-500"
              placeholder="Start typing city (e.g. Pune)..."
              value={search}
              onChange={(e) => {
                console.log('[CityCombobox] Input change:', e.target.value);
                setSearch(e.target.value);
              }}
              onKeyDown={(e) => {
                 if (e.key === 'Enter') e.preventDefault();
              }}
            />
            {isFetching && <Loader2 className="ml-2 h-4 w-4 animate-spin text-slate-400" />}
          </div>
          <CommandList>
            {!isFetching && cities.length === 0 && (
              <CommandEmpty>No cities found matching "{search}"</CommandEmpty>
            )}
            <CommandGroup>
              {cities.map((city) => (
                <CommandItem
                  key={city.id}
                  value={city.id}
                  onSelect={() => {
                    console.log('[CityCombobox] onSelect triggered for ID:', city.id);
                    onValueChange(city.id)
                    setOpen(false)
                  }}
                  onPointerDown={(e) => {
                    console.log('[CityCombobox] onPointerDown triggered for ID:', city.id);
                    onValueChange(city.id)
                    setOpen(false)
                    // CRITICAL: Stop propagation so Dialog doesn't steal focus/event
                    e.stopPropagation()
                    e.preventDefault()
                  }}
                  className="cursor-pointer py-3 border-b border-slate-50 last:border-0"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 shrink-0",
                      value === city.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col overflow-hidden">
                    <span className="font-semibold text-slate-900 truncate">{city.name}</span>
                    {city.state?.name && (
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                        {city.state.name}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
