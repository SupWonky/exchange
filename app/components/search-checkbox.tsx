import { useSearchParams } from "@remix-run/react";
import { Checkbox } from "./ui/checkbox";
import * as React from "react";

interface SearchCheckboxProps extends React.HTMLAttributes<HTMLButtonElement> {
  name: string;
  value: string;
}

export function SearchCheckbox({ name, value, ...props }: SearchCheckboxProps) {
  const [searchParams] = useSearchParams();
  const paramsIncludeValue = searchParams.getAll(name).includes(value);
  const [checked, setChecked] = React.useState(paramsIncludeValue);

  React.useEffect(() => {
    setChecked(paramsIncludeValue);
  }, [paramsIncludeValue]);

  return (
    <Checkbox
      name={name}
      value={value}
      checked={checked}
      onChange={(e) => {
        const target = e.target as HTMLInputElement;
        setChecked(target.checked);
      }}
      {...props}
    />
  );
}
