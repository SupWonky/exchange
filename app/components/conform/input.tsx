import { FieldMetadata, getInputProps } from "@conform-to/react";
import { ComponentProps } from "react";
import { Input } from "../ui/input";
import { cn } from "~/lib/utils";

export function InputConform({
  meta,
  type,
  className,
  ...props
}: {
  meta: FieldMetadata<string>;
  type: Parameters<typeof getInputProps>[1]["type"];
} & ComponentProps<typeof Input>) {
  const { key, ...rest } = getInputProps(meta, { type, ariaAttributes: true });

  return (
    <Input
      key={key}
      className={cn(className, meta.errors && "border-destructive")}
      {...rest}
      {...props}
    />
  );
}
