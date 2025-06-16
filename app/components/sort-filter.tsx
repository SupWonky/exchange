import { useSearchParams, useSubmit } from "@remix-run/react";
import { defaultSort, SortFilterItem, sorting } from "~/lib/constants";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { ListFilter } from "lucide-react";

export function SortFilter({
  options = sorting,
  label,
}: {
  options?: SortFilterItem[];
  label?: string;
}) {
  const [searchParams] = useSearchParams();
  const submit = useSubmit();
  const currentSortSlug = searchParams.get("sort");
  const currentSort =
    options.find((option) => option.slug === currentSortSlug) || defaultSort;

  const handleSelect = (value: string) => {
    const params = new URLSearchParams(searchParams);
    const selectedSort = options.find((option) => option.sort_key === value);

    if (selectedSort && selectedSort.slug) {
      params.set("sort", selectedSort.slug);
    } else {
      params.delete("sort");
    }

    submit(params, { preventScrollReset: true });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Sort"
          className="p-1 rounded-full text-muted-foreground hover:bg-muted/80 hover:text-foreground focus-visible:!outline-none data-[state=open]:text-foreground"
        >
          <ListFilter className="w-5 h-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-44" align="end">
        {label && (
          <>
            <DropdownMenuLabel>{label}</DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuRadioGroup
          value={currentSort.sort_key}
          onValueChange={handleSelect}
        >
          {options.map((option) => (
            <DropdownMenuRadioItem key={option.slug} value={option.sort_key}>
              {option.title}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
