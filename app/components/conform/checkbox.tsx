import {
  FieldMetadata,
  unstable_useControl as useControl,
} from "@conform-to/react";
import { ComponentProps, ElementRef, useRef } from "react";
import { Checkbox } from "../ui/checkbox";

export function CheckboxConform({
  meta,
  ...props
}: {
  meta: FieldMetadata<string | boolean | undefined>;
} & ComponentProps<typeof Checkbox>) {
  const checkboxRef = useRef<ElementRef<typeof Checkbox>>(null);
  const control = useControl(meta);

  console.log(control.value);

  return (
    <>
      <input
        className="sr-only"
        aria-hidden
        ref={control.register}
        name={meta.name}
        tabIndex={-1}
        defaultValue={meta.initialValue}
        onFocus={() => checkboxRef.current?.focus()}
      />

      <Checkbox
        ref={checkboxRef}
        id={meta.id}
        checked={control.value === "on"}
        onCheckedChange={(checked) => {
          control.change(checked ? "on" : "");
        }}
        onBlur={control.blur}
        {...props}
      />
    </>
  );
}
