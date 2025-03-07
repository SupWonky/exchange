import { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";
import { cn } from "~/lib/utils";

type ComboboxProps = {
  title: string;
  list: { value: any; label: string }[];
  onSelect?: (value: string) => void;
  selectedValue: string | null;
};

export function Combobox({
  title,
  list,
  onSelect,
  selectedValue,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(selectedValue);

  useEffect(() => {
    setValue(selectedValue);
  }, [selectedValue]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "justify-between w-[200px]",
            !value && "text-muted-foreground"
          )}
        >
          <span className="text-ellipsis overflow-x-clip max-w-36">
            {list.find((item) => item.value === value)?.label || title}
          </span>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Поиск..." className="h-9" />
          <CommandList>
            <CommandEmpty>Ничего не найдено.</CommandEmpty>
            <CommandGroup>
              {list.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.value}
                  onSelect={(value) => {
                    setValue(value);
                    setOpen(false);
                    onSelect?.(value);
                  }}
                >
                  {item.label}
                  <Check
                    className={`ml-auto transition-opacity ${
                      value === item.value ? "opacity-100" : "opacity-0"
                    }`}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
