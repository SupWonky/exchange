import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import slugify from "slugify";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatSlug(val: string) {
  return slugify(val, {
    strict: true,
    lower: true,
  });
}

export function formatCurrency(val: number) {
  return Intl.NumberFormat("ru-RU", {
    notation: "standard",
  }).format(val);
}

export function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const formatter = new Intl.RelativeTimeFormat("ru", {
    style: "short",
  });
  const diffInSeconds = Math.floor((now - date.getTime()) / 1000);

  const units = {
    day: 60 * 60 * 24,
    hour: 60 * 60,
    minute: 60,
  };

  if (diffInSeconds < 60) {
    return `сейчас`;
  }

  for (const [unit, seconds] of Object.entries(units)) {
    const interval = Math.floor(diffInSeconds / seconds);

    if (interval >= 1) {
      return formatter.format(-interval, unit as Intl.RelativeTimeFormatUnit);
    }
  }

  return formatter.format(-Math.floor(diffInSeconds / units.day), "day");
}

export function formatTime(date: Date) {
  const formatter = new Intl.DateTimeFormat("ru", {
    timeStyle: "short",
  });

  return formatter.format(date);
}

export function isSameDay(value1: Date, value2: Date) {
  return (
    value1.getFullYear() === value2.getFullYear() &&
    value1.getMonth() === value2.getMonth() &&
    value1.getDate() === value2.getDate()
  );
}

export function formatDate(date: Date) {
  const formatter = new Intl.DateTimeFormat("ru", {
    dateStyle: "long",
  });

  return formatter.format(date);
}

export function secondsToDays(value: number) {
  return value / 60 / 60 / 24;
}
