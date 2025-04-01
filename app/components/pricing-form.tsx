import { SubmissionResult, useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";
import { PricingTier, PricingVariant } from "@prisma/client";
import { Form } from "@remix-run/react";
import { useEffect, useState } from "react";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Checkbox } from "./ui/checkbox";
import { Cross1Icon } from "@radix-ui/react-icons";
import { Field } from "./field";

type PricingFormProps = {
  mode: "single" | "multiple";
  lastResult: SubmissionResult<string[]> | undefined;
  onChangeFormErrors?: (value: string[] | undefined) => void;
  defualtValue?: PricingTier[];
};

export function PricingForm({
  mode,
  lastResult,
  defualtValue,
  onChangeFormErrors,
}: PricingFormProps) {
  const variants =
    mode === "single"
      ? [PricingVariant.BASIC]
      : [
          PricingVariant.BASIC,
          PricingVariant.STANDARD,
          PricingVariant.BUSINESS,
        ];

  const pricingVariants =
    defualtValue !== undefined
      ? defualtValue
      : variants.map((variant) => ({
          variant,
          price: 500,
          duration: 1440,
          volume: "",
          description: "",
          options: [],
        }));

  const [form, fields] = useForm({
    lastResult,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: PricingSchema });
    },
    defaultValue: {
      mode,
      pricingVariants: pricingVariants,
    },
    shouldRevalidate: "onInput",
  });

  const pricingList = fields.pricingVariants.getFieldList();

  useEffect(() => {
    onChangeFormErrors?.(form.errors);
  }, [form.errors, onChangeFormErrors]);

  // Handle adding a new option

  return (
    <Form method="post" className="flex flex-col gap-y-4" id={form.id}>
      <input type="hidden" name="mode" value={mode} />

      {/* Global dialog for adding options */}

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
              {/* Price Field */}

              <div className={`${mode === "single" ? "hidden" : ""}`}>
                <Label className="text-base font-medium">
                  Короткое описание
                </Label>
                <div className="mt-1">
                  <Input
                    name={pricingFields.description.name}
                    defaultValue={pricingFields.description.value}
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
              <div>
                <Label className="text-base font-medium">Стоимость</Label>
                <div className="mt-1">
                  <Select
                    name={pricingFields.price.name}
                    defaultValue={((index + 1) * 500).toString()}
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
                    defaultValue="1440"
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
                    defaultValue={pricingFields.volume.value}
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
                                className="bg-transparent  outline-none"
                                placeholder="Название"
                                name={optionFields.name.name}
                                defaultValue={optionFields.name.value || ""}
                              />
                              <input
                                type="hidden"
                                name={optionFields.type.name}
                                value={optionFields.type.value || "BOOLEAN"}
                              />
                            </TableCell>
                            <TableCell>
                              {optionFields.type.value === "BOOLEAN" ? (
                                <div className="flex items-center justify-start">
                                  <Checkbox
                                    name={optionFields.value.name}
                                    className="h-5 w-5"
                                  />
                                </div>
                              ) : (
                                <Input
                                  name={optionFields.value.name}
                                  defaultValue={optionFields.value.value || ""}
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
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={3}>
                          <OptionDialog
                            onAdd={(value) =>
                              form.insert({
                                name: pricingFields.options.name,
                                defaultValue: {
                                  type: value.type,
                                  name: value.name,
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

      <Button type="submit">Отправить</Button>
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
      <DialogContent className="max-w-lg">
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
                onClick={() => {
                  onAdd?.({ name, type });
                  setOpen(false);
                }}
                className="w-full"
                type="button"
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
