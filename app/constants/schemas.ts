import { z } from "zod";

const OptionSchema = z.discriminatedUnion("type", [
  z.object({
    name: z.string({ message: "Введите имя" }),
    type: z.literal("STRING"),
    value: z.string({ message: "Введите значение" }),
  }),
  z.object({
    name: z.string({ message: "Введите имя" }),
    type: z.literal("BOOLEAN"),
    value: z.boolean(),
  }),
]);

const PricingSchema = z.object({
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
      options: z.array(OptionSchema).optional(),
    })
  ),
});

const ServiceSchema = z.object({
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
          name: z.string().nullable(),
          url: z.string(),
          type: z.enum(["MOVIE", "IMAGE"]),
        })
      )
      .min(1, "Прикрепите медиа файлы")
  ),
});

const MessageSchema = z.object({
  content: z.string({ message: "Введите сообщение" }),
  chatId: z.string({ message: "Ошибка, не указан чат" }),
  attachments: z.preprocess(
    (val) => {
      try {
        return typeof val === "string" ? JSON.parse(val) : val;
      } catch {
        return val;
      }
    },
    z.array(
      z.object({
        name: z.string().nullable(),
        url: z.string(),
        type: z.enum(["MOVIE", "IMAGE", "OTHER"]),
      })
    )
  ),
});

const PopupSchema = z.object({
  sum: z
    .number({ message: "Введите сумму пополнения" })
    .int({ message: "Введите целое число" })
    .positive({ message: "Число должно быть положительным" }),
});

const LoginSchema = z.object({
  email: z
    .string({ message: "Введите почту" })
    .email({ message: "Неправильный формат почты" }),
  password: z.string({ message: "Введите пароль" }),
  remember: z.boolean().optional(),
  redirectTo: z.string().optional(),
});

const JoinSchema = z.object({
  email: z
    .string({ message: "Введите почту" })
    .email({ message: "Неправильный формат почты" }),
  password: z.string({ message: "Введите пароль" }),
  username: z.string({ message: "Введите имя пользователя" }),
  redirectTo: z.string().optional(),
});

const UserPrefs = z.object({
  role: z.enum(["buyer", "seller"]),
});

const BlogSchema = z.object({
  username: z
    .string({ required_error: "Назавние обязательное поле" })
    .max(50, { message: "Максимум 50 символов" }),
  description: z
    .string()
    .max(200, {
      message: "Максимум 200 символов",
    })
    .optional(),
});

const TrackAction = z.discriminatedUnion("intent", [
  z
    .object({
      intent: z.literal("sendMessage"),
    })
    .merge(MessageSchema),
  z.object({
    intent: z.literal("updateStatus"),
    status: z.string(),
  }),
]);

const ConversationSchema = z.object({
  initMessage: z.string().max(300, "Message cannot exceed 300 characters"),
  reciverId: z.string(),
});

export {
  PricingSchema,
  OptionSchema,
  UserPrefs,
  ServiceSchema,
  MessageSchema,
  PopupSchema,
  LoginSchema,
  JoinSchema,
  BlogSchema,
  TrackAction,
  ConversationSchema,
};
