import {
  FieldMetadata,
  unstable_useControl as useControl,
} from "@conform-to/react";
import { ElementRef, useRef } from "react";
import { Checkbox } from "../ui/checkbox";

export function CheckboxConform({
  meta,
}: {
  meta: FieldMetadata<string | boolean | undefined>;
}) {
  const checkboxRef = useRef<ElementRef<typeof Checkbox>>(null);
  const control = useControl(meta);

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
      />
    </>
  );
}
