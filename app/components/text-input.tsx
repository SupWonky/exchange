import { useRef, useState, forwardRef } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { cn } from "~/lib/utils"; // Assumes your project uses tailwindcss-merge

interface TextInputProps extends React.ComponentProps<"input"> {
  limit: number;
  title: string;
  description?: string;
  errors?: string[];
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ limit, name, title, errors, className, ...props }, forwardedRef) => {
    const localRef = useRef<HTMLInputElement>(null);
    const inputRef = forwardedRef || localRef;
    const [counter, setCounter] = useState(
      props.defaultValue?.toString().length || 0
    );
    const isOverLimit = counter > limit;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setCounter(e.target.value.length);
      props.onChange?.(e);
    };

    return (
      <div>
        <div className="flex justify-between items-center">
          <Label className="text-base" htmlFor={name}>
            {title}
          </Label>
          <span
            className={cn(
              "text-sm font-normal text-muted-foreground",
              isOverLimit && "text-destructive"
            )}
          >
            {counter} из {limit} символов
          </span>
        </div>

        {/* {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )} */}

        <div className="mt-1">
          <Input
            ref={inputRef}
            id={name}
            name={name}
            type="text"
            className={cn(
              isOverLimit && "focus-visible:ring-destructive",
              //error && "focus-visible:ring-destructive",
              className
            )}
            onChange={handleChange}
            {...props}
            placeholder={props.placeholder || title}
          />

          {errors && (
            <div className="p-1 text-sm text-destructive">{errors}</div>
          )}
        </div>
      </div>
    );
  }
);

TextInput.displayName = "TextInput";
