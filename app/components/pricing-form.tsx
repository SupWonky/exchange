import { useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";
import type {
  PricingTier,
  PricingTierOption,
  PricingVariant,
} from "@prisma/client";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { useMemo, useState } from "react";
import { PricingSchema } from "~/constants/schemas";
import { getPricingVariantLabel } from "~/utils";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Label } from "./ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Cross1Icon } from "@radix-ui/react-icons";
import { Field } from "./field";
import type { action } from "~/routes/_dl.services_.new_.step-2";
import { CheckboxConform } from "./conform/checkbox";

type PricingFormProps = {
  mode: "single" | "multiple";
  defaultValue?: Array<PricingTier & { options: PricingTierOption[] }>;
};

export function PricingForm({ mode, defaultValue }: PricingFormProps) {
  console.log(mode, defaultValue);
  const lastResult = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting =
    navigation.formAction?.includes("/services/new/step-2") ?? false;
  const variants: PricingVariant[] =
    mode === "single" ? ["BASIC"] : ["BASIC", "STANDARD", "BUSINESS"];

  const pricingVariants = useMemo(() => {
    if (!defaultValue || defaultValue.length === 0) {
      return variants.map((variant, index) => ({
        id: undefined,
        variant,
        price: (index + 1) * 500,
        duration: 1440,
        volume: "",
        description: "",
        options: [],
      }));
    }

    return variants.map((variant, index) => {
      const existingVariant = defaultValue.find((v) => v.variant === variant);

      if (existingVariant) {
        return {
          id: existingVariant.id,
          variant: existingVariant.variant,
          price: existingVariant.price,
          duration: existingVariant.duration,
          volume: existingVariant.volume || "",
          description: existingVariant.description || "",
          options: existingVariant.options || [],
        };
      }

      return {
        id: undefined,
        variant,
        price: (index + 1) * 500,
        duration: 1440,
        volume: "",
        description: "",
        options: [],
      };
    });
  }, [defaultValue, variants]);

  const [form, fields] = useForm({
    lastResult,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: PricingSchema });
    },
    defaultValue: {
      mode,
      pricingVariants: pricingVariants.map((pricingVariant) => ({
        id: pricingVariant.id,
        variant: pricingVariant.variant,
        price: pricingVariant.price,
        duration: pricingVariant.duration,
        volume: pricingVariant.volume,
        description: pricingVariant.description,
        options: pricingVariant.options.map((option) => ({
          name: option.name,
          type: option.type,
          value:
            option.type === "BOOLEAN"
              ? option.booleanValue
              : option.stringValue,
        })),
      })),
    },
  });

  const pricingList = fields.pricingVariants.getFieldList();

  return (
    <Form method="post" className="flex flex-col gap-y-4" id={form.id}>
      <input type="hidden" name="mode" value={mode} />

      {pricingList.map((pricing, index) => {
        const pricingFields = pricing.getFieldset();
        const options = pricingFields.options.getFieldList();

        return (
          <div
            key={pricing.key}
            className={`${
              mode === "multiple" ? "border p-4" : ""
            } rounded-md mb-4`}
          >
            <input
              type="hidden"
              name={pricingFields.variant.name}
              value={variants[index]}
            />

            <input
              type="hidden"
              name={pricingFields.id.name}
              value={pricingFields.id.initialValue}
            />

            {mode === "multiple" && (
              <h3 className="text-xl uppercase font-semibold mb-2">
                {getPricingVariantLabel(variants[index])}
              </h3>
            )}

            <div className="flex flex-col gap-y-4">
              {/* Description Field */}
              <div className={`${mode === "single" ? "hidden" : ""}`}>
                <Label className="text-base font-medium">
                  Короткое описание
                </Label>
                <div className="mt-1">
                  <Input
                    name={pricingFields.description.name}
                    defaultValue={pricingFields.description.initialValue}
                    type="text"
                    placeholder="Описание..."
                    hidden={mode === "single"}
                  />

                  {pricingFields.description.errors && (
                    <div className="p-1 text-destructive text-sm">
                      {pricingFields.description.errors}
                    </div>
                  )}
                </div>
              </div>

              {/* Price Field */}
              <div>
                <Label className="text-base font-medium">Стоимость</Label>
                <div className="mt-1">
                  <Select
                    name={pricingFields.price.name}
                    defaultValue={
                      pricingFields.price.initialValue?.toString() ||
                      ((index + 1) * 500).toString()
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[...Array(10).keys()].map((idx) => (
                        <SelectItem
                          key={idx}
                          value={((idx + 1) * 500).toString()}
                        >
                          {(idx + 1) * 500} ₽
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {pricingFields.price.errors && (
                    <div className="p-1 text-destructive text-sm">
                      {pricingFields.price.errors}
                    </div>
                  )}
                </div>
              </div>

              {/* Duration Field */}
              <div>
                <Label className="text-base font-medium">Срок выполнения</Label>
                <div className="mt-1">
                  <Select
                    name={pricingFields.duration.name}
                    defaultValue={
                      pricingFields.duration.initialValue?.toString() || "1440"
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[...Array(10).keys()].map((idx) => (
                        <SelectItem
                          key={idx}
                          value={((idx + 1) * 24 * 60).toString()}
                        >
                          {`${idx + 1} ${idx === 0 ? "День" : "Дней"}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {pricingFields.duration.errors && (
                    <div className="p-1 text-destructive text-sm">
                      {pricingFields.duration.errors}
                    </div>
                  )}
                </div>
              </div>

              {/* Volume Field */}
              <div>
                <Label className="text-base font-medium">Объем услуги</Label>
                <div className="mt-1">
                  <Input
                    name={pricingFields.volume.name}
                    type="text"
                    placeholder="Пример: 1 лендинг"
                    defaultValue={pricingFields.volume.initialValue}
                  />
                  {pricingFields.volume.errors && (
                    <div className="p-1 text-destructive text-sm">
                      {pricingFields.volume.errors}
                    </div>
                  )}
                </div>
              </div>

              {/* Options Table */}
              <div>
                <Label className="text-base font-medium">Опции</Label>

                <div className="border rounded-lg mt-1">
                  <Table>
                    {options.length > 0 && (
                      <>
                        <TableHeader>
                          <TableRow>
                            {options.length > 0 && (
                              <>
                                <TableHead>Название</TableHead>
                                <TableHead>Значение</TableHead>
                                <TableHead></TableHead>
                              </>
                            )}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {options.map((option, idx) => {
                            const optionFields = option.getFieldset();

                            return (
                              <TableRow key={option.key}>
                                <TableCell>
                                  <input
                                    readOnly
                                    className="bg-transparent outline-none"
                                    placeholder="Название"
                                    name={optionFields.name.name}
                                    defaultValue={
                                      optionFields.name.initialValue || ""
                                    }
                                  />
                                  <input
                                    type="hidden"
                                    name={optionFields.type.name}
                                    value={
                                      optionFields.type.initialValue ||
                                      "BOOLEAN"
                                    }
                                  />
                                </TableCell>
                                <TableCell>
                                  {(optionFields.type.initialValue ||
                                    "BOOLEAN") === "BOOLEAN" ? (
                                    <div className="flex items-center justify-start">
                                      <CheckboxConform
                                        meta={optionFields.value}
                                        className="h-5 w-5"
                                      />
                                    </div>
                                  ) : (
                                    <Input
                                      name={optionFields.value.name}
                                      defaultValue={
                                        optionFields.value.initialValue || ""
                                      }
                                      placeholder="Пример: трудная (сложность)"
                                    />
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="destructive"
                                    size="icon"
                                    type="button"
                                    onClick={() => {
                                      form.remove({
                                        name: pricingFields.options.name,
                                        index: idx,
                                      });
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </>
                    )}

                    <TableFooter
                      className={`${options.length === 0 && "border-t-0"}`}
                    >
                      <TableRow>
                        <TableCell colSpan={3}>
                          <OptionDialog
                            onAdd={(value) =>
                              form.insert({
                                name: pricingFields.options.name,
                                defaultValue: {
                                  type: value.type,
                                  name: value.name,
                                  value: value.type === "BOOLEAN" ? false : "",
                                },
                              })
                            }
                          />
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Отправляю..." : "Отправить"}
      </Button>
    </Form>
  );
}

interface OptionDialogProps {
  onAdd?: (option: { name: string; type: "BOOLEAN" | "STRING" }) => void;
}

function OptionDialog({ onAdd }: OptionDialogProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"BOOLEAN" | "STRING">("BOOLEAN");
  const [name, setName] = useState("");

  const handleAdd = () => {
    if (name.trim()) {
      onAdd?.({ name: name.trim(), type });
      setOpen(false);
      setName("");
      setType("BOOLEAN");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        asChild
        className="flex items-center justify-center w-full hover:bg-muted/50 hover:text-primary"
      >
        <Button variant="ghost" size="icon" type="button">
          <Plus className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <div className="flex items-center h-16 px-6">
          <DialogClose className="ml-auto opacity-70 hover:opacity-100 transition-opacity">
            <Cross1Icon className="h-5 w-5" />
          </DialogClose>
        </div>
        <div className="px-6 pb-6 overflow-x-hidden overflow-y-auto">
          <div className="w-[320px] min-h-96 mx-auto">
            <DialogHeader className="mb-8 items-center">
              <DialogTitle className="mt-8 text-2xl font-medium">
                Добавить опцию
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Field>
                <Label className="text-base font-medium">Название опции</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={18}
                />
              </Field>
              <Field>
                <Label className="text-base font-medium">
                  Вид отображения опции
                </Label>
                <RadioGroup
                  value={type}
                  onValueChange={(value) =>
                    setType(value as "STRING" | "BOOLEAN")
                  }
                  className="flex flex-row gap-3"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="BOOLEAN" id="option-boolean" />
                    <Label htmlFor="option-boolean">Галка</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="STRING" id="option-string" />
                    <Label htmlFor="option-string">Текст</Label>
                  </div>
                </RadioGroup>
              </Field>

              <Button
                onClick={handleAdd}
                className="w-full"
                type="button"
                disabled={!name.trim()}
              >
                Сохранить
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
