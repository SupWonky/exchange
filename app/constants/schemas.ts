import { z } from "zod";

const option = z.object({
  name: z.string({ message: "Введите имя" }),
  type: z.enum(["STRING", "BOOLEAN"]),
  value: z.union([z.string(), z.boolean()]),
});

const pricingSchema = z.object({
  mode: z.enum(["single", "multiple"]),
  pricingVariants: z.array(
    z.object({
      id: z.string().optional(),
      price: z
        .number()
        .int("Неправильный формат цены")
        .positive("Неправильный формат цены"),
      duration: z
        .number()
        .int("Неправильный формат длительности")
        .positive("Неправильный формат длительности"),
      volume: z.string({ message: "Введите объем услуги" }),
      variant: z.enum(["BASIC", "STANDARD", "BUSINESS"]),
      description: z
        .string({ message: "Введите описание" })
        .max(150)
        .optional(),
      options: z.array(option).optional(),
    })
  ),
});

const serviceSchema = z.object({
  title: z.string({ message: "Введите название" }),
  categoryId: z.string({ message: "Выберите рубрику" }),
  content: z.string({ message: "Введите описание" }),
  media: z.preprocess(
    (val) => {
      try {
        return typeof val === "string" ? JSON.parse(val) : val;
      } catch {
        return val;
      }
    },
    z
      .array(
        z.object({
          name: z.string(),
          url: z.string(),
          type: z.enum(["MOVIE", "IMAGE"]),
        })
      )
      .min(1, "Прикрепите медиа файлы")
  ),
});

const messageSchema = z.object({
  content: z.string({ message: "Введите сообщение" }),
  senderId: z.string({ message: "Ошибка, не указан отправитель" }),
  chatId: z.string({ message: "Ошибка, не указан чат" }),
});

const popupSchema = z.object({
  amount: z
    .number({ message: "Введите сумму пополнения" })
    .int({ message: "Введите целое число" })
    .positive({ message: "Число должно быть положительным" }),
});

export { pricingSchema, option, serviceSchema, messageSchema, popupSchema };
