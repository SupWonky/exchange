import { FieldMetadata, getTextareaProps } from "@conform-to/react";
import { Textarea } from "../ui/textarea";
import { ComponentProps } from "react";

export const TextareaConform = ({
  meta,
  ...props
}: {
  meta: FieldMetadata<string>;
} & ComponentProps<typeof Textarea>) => {
  const { key, ...rest } = getTextareaProps(meta);
  return <Textarea key={key} {...rest} {...props} />;
};
