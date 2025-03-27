import { FieldMetadata, getInputProps } from "@conform-to/react";
import { ComponentProps } from "react";
import { Input } from "../ui/input";

export function InputConform({
  meta,
  type,
  ...props
}: {
  meta: FieldMetadata<string>;
  type: Parameters<typeof getInputProps>[1]["type"];
} & ComponentProps<typeof Input>) {
  const { key, ...rest } = getInputProps(meta, { type, ariaAttributes: true });

  return <Input key={key} {...rest} {...props} />;
}
