import React, { useEffect, useRef } from "react";
import {
  Form,
  useNavigate,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { cn } from "~/lib/utils";
import { SlidersHorizontal } from "lucide-react";
import { Separator } from "./ui/separator";
import { useMediaQuery } from "~/hooks/use-media-query";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerFooter,
} from "./ui/drawer";
import { Badge } from "./ui/badge";
import { SearchCheckbox } from "./search-checkbox";

// Type definitions
export interface FilterOptionType {
  value: string;
  label: string;
}

export interface FilterSectionType {
  id: string;
  title: string;
  type: "checkbox" | "radio" | "range";
  paramName: string;
  options?: FilterOptionType[];
  minPlaceholder?: string;
  maxPlaceholder?: string;
}

// Utility function to check if any filter is active
function hasActiveFilters(searchParams: URLSearchParams): boolean {
  const excludedParams = ["page", "sort", "q"];
  return Array.from(searchParams.keys()).some(
    (key) => !excludedParams.includes(key) && searchParams.get(key)
  );
}

// Filter section component
function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <h3 className="font-semibold text-sm tracking-wide mb-3">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

// Filter checkbox item component
function FilterCheckboxItem({
  name,
  value,
  label,
}: {
  name: string;
  value: string;
  label: string;
}) {
  const id = `${name}-${value}`;

  return (
    <div className="flex items-center gap-2">
      <SearchCheckbox id={id} name={name} value={value} />
      <Label htmlFor={id} variant="button">
        {label}
      </Label>
    </div>
  );
}

// Filter radio item component
function FilterRadioItem({
  name,
  value,
  label,
}: {
  name: string;
  value: string;
  label: string;
}) {
  const [searchParams] = useSearchParams();
  const id = `${name}-${value}`;
  const paramsIncludeValue = searchParams.get(name) === value;
  const [checked, setChecked] = React.useState(paramsIncludeValue);

  React.useEffect(() => {
    setChecked(paramsIncludeValue);
  }, [paramsIncludeValue]);

  return (
    <div className="flex items-center gap-2">
      <input
        type="radio"
        id={id}
        name={name}
        value={value}
        checked={checked}
        onChange={(e) => {
          setChecked(e.target.checked);
        }}
        className="sr-only"
      />
      <Label
        htmlFor={id}
        className={cn(checked && "font-semibold")}
        variant="button"
      >
        {label}
      </Label>
    </div>
  );
}

// Range filter component
function RangeFilter({
  name,
  minPlaceholder = "От",
  maxPlaceholder = "До",
}: {
  name: string;
  minPlaceholder?: string;
  maxPlaceholder?: string;
}) {
  const [searchParams] = useSearchParams();
  const submit = useSubmit();

  const initialValues = searchParams.get(name)?.split("_") || ["", ""];
  const [minValue, setMinValue] = React.useState(initialValues[0] || "");
  const [maxValue, setMaxValue] = React.useState(initialValues[1] || "");

  // Sync state with URL parameters
  React.useEffect(() => {
    const currentParam = searchParams.get(name);
    const [newMin, newMax] = currentParam ? currentParam.split("_") : ["", ""];

    // Only update state if URL values differ from current state
    if (newMin !== minValue || newMax !== maxValue) {
      setMinValue(newMin);
      setMaxValue(newMax);
    }
  }, [searchParams, name]);

  // Update URL when values change
  React.useEffect(() => {
    const newParams = new URLSearchParams(searchParams);

    if (minValue || maxValue) {
      newParams.set(name, `${minValue}_${maxValue}`);
    } else {
      newParams.delete(name);
    }

    submit(newParams, {
      method: "get",
      replace: true,
      preventScrollReset: true,
    });
  }, [minValue, maxValue, name, submit, searchParams]);

  return (
    <div className="flex flex-row gap-2 items-center">
      <Input
        type="number"
        className="h-9 appearance-none [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        placeholder={minPlaceholder}
        value={minValue}
        onChange={(e) => setMinValue(e.target.value.replace(/-/g, ""))}
        aria-label={`Minimum ${name}`}
      />
      <span className="text-gray-400">–</span>
      <Input
        type="number"
        className="h-9 appearance-none [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        placeholder={maxPlaceholder}
        value={maxValue}
        onChange={(e) => setMaxValue(e.target.value.replace(/-/g, ""))}
        aria-label={`Maximum ${name}`}
      />
    </div>
  );
}

// Filter container component
function FilterContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <aside
      className={cn(
        "bg-card shadow rounded-lg border flex flex-col gap-y-4 p-4",
        className
      )}
    >
      {children}
    </aside>
  );
}

// Active filters display
function ActiveFilters({
  filterSections,
  compact = false,
}: {
  filterSections: FilterSectionType[];
  compact?: boolean;
}) {
  const [searchParams] = useSearchParams();
  const submit = useSubmit();

  const activeFilters: Array<{
    section: FilterSectionType;
    value: string;
    label: string;
  }> = [];

  const processedParams = new Set<string>();

  filterSections.forEach((section) => {
    if (processedParams.has(section.paramName)) return;

    if (section.type === "checkbox" || section.type === "radio") {
      const values =
        section.type === "checkbox"
          ? searchParams.getAll(section.paramName)
          : ([searchParams.get(section.paramName)].filter(Boolean) as string[]);

      values.forEach((value) => {
        const option = section.options?.find((opt) => opt.value === value);
        if (option) {
          activeFilters.push({
            section,
            value,
            label: option.label,
          });
          processedParams.add(section.paramName);
        }
      });
    } else if (section.type === "range") {
      const rangeValue = searchParams.get(section.paramName);
      if (rangeValue) {
        const [min, max] = rangeValue.split("_");
        if (min || max) {
          activeFilters.push({
            section,
            value: rangeValue,
            label: `${min || "0"} - ${max || "∞"}`,
          });
          processedParams.add(section.paramName);
        }
      }
    }
  });

  if (activeFilters.length === 0) return null;

  // Remove a single filter
  const removeFilter = (section: FilterSectionType, value: string) => {
    const formData = new FormData();

    // Copy all existing params
    for (const [key, val] of searchParams.entries()) {
      if (key !== section.paramName) {
        formData.append(key, val);
      } else if (section.type === "checkbox") {
        // For checkboxes, we need to preserve other values for the same param
        if (val !== value) {
          formData.append(key, val);
        }
      } else if (section.type === "range") {
        // For range, we reset it completely
      } else {
        // For radio buttons, we remove the value
      }
    }

    submit(formData, {
      method: "get",
      replace: true,
      preventScrollReset: true,
    });
  };

  return (
    <div className={cn("mb-2")}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm tracking-wide">
          Активные фильтры
        </h3>
        <ClearFiltersButton />
      </div>
      <div className="flex flex-wrap gap-2">
        {activeFilters.map((filter, index) => (
          <Badge
            variant="outline"
            className="cursor-pointer hover:bg-gray-50 transition-colors"
            key={`${filter.section.paramName}-${filter.value}-${index}`}
            onClick={() => removeFilter(filter.section, filter.value)}
          >
            {compact
              ? filter.label
              : `${filter.section.title}: ${filter.label}`}
          </Badge>
        ))}
      </div>
    </div>
  );
}

// Clear all filters button
function ClearFiltersButton({
  className,
  label = "Сбросить",
}: {
  className?: string;
  label?: string;
}) {
  const [searchParams] = useSearchParams();
  const submit = useSubmit();

  const handleClear = () => {
    const formData = new FormData();
    const preserveParams = ["page", "sort", "q"];

    searchParams.forEach((value, key) => {
      if (preserveParams.includes(key)) formData.append(key, value);
    });

    submit(formData, {
      method: "get",
      replace: true,
      preventScrollReset: true,
    });
  };

  return (
    <Button
      variant="link"
      size="sm"
      onClick={handleClear}
      className={cn("text-sm text-primary h-auto px-2", className)}
      type="button"
    >
      {label}
    </Button>
  );
}

// Main filter component
export function ConfigurableFilter({
  filterSections,
  className,
}: {
  filterSections: FilterSectionType[];
  className?: string;
}) {
  const submit = useSubmit();
  const [searchParams] = useSearchParams();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [open, setOpen] = React.useState(false);

  const handleChange = (e: React.FormEvent<HTMLFormElement>) => {
    const formData = new FormData(e.currentTarget);

    const preserveParams = ["q", "page", "sort"];

    preserveParams.forEach((param) => {
      const value = searchParams.get(param);
      if (value && !formData.has(param)) {
        formData.append(param, value);
      }
    });

    submit(formData, { replace: true, preventScrollReset: true });
  };

  const filterContent = (
    <Form method="get" onChange={handleChange} preventScrollReset>
      {filterSections.map((section) => (
        <FilterSection key={section.id} title={section.title}>
          {section.type === "checkbox" &&
            section.options?.map((option) => (
              <FilterCheckboxItem
                key={option.value}
                name={section.paramName}
                value={option.value}
                label={option.label}
              />
            ))}

          {section.type === "radio" &&
            section.options?.map((option) => (
              <FilterRadioItem
                key={option.value}
                name={section.paramName}
                value={option.value}
                label={option.label}
              />
            ))}

          {section.type === "range" && (
            <RangeFilter
              name={section.paramName}
              minPlaceholder={section.minPlaceholder}
              maxPlaceholder={section.maxPlaceholder}
            />
          )}
        </FilterSection>
      ))}
    </Form>
  );

  if (isMobile) {
    const activeFilterCount = Array.from(searchParams.entries()).filter(
      ([key]) => !["page", "sort", "q"].includes(key)
    ).length;

    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="w-full flex justify-between items-center gap-2"
          >
            <span>
              Фильтры {activeFilterCount > 0 && `(${activeFilterCount})`}
            </span>
            <SlidersHorizontal size={16} />
          </Button>
        </DrawerTrigger>
        <DrawerContent className="max-h-[90vh]">
          <div className="overflow-auto">
            <DrawerHeader className="px-4">
              <DrawerTitle>Фильтры</DrawerTitle>
            </DrawerHeader>
            <Separator />

            <div className="px-4 py-4">
              {hasActiveFilters(searchParams) && (
                <ActiveFilters filterSections={filterSections} compact />
              )}
              {filterContent}
            </div>

            <DrawerFooter className="px-4 pb-6 pt-4 sticky bottom-0 bg-white border-t">
              <DrawerClose asChild>
                <Button>Закрыть</Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <FilterContainer className={className}>
      {hasActiveFilters(searchParams) && (
        <ActiveFilters filterSections={filterSections} />
      )}
      {filterContent}
    </FilterContainer>
  );
}
