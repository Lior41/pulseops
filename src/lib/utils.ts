import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function humanize(value: string) {
  return value.toLowerCase().replaceAll("_", " ");
}
export function dateTime(value: Date | string) {
  return (
    new Intl.DateTimeFormat("en-GB", {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    }).format(new Date(value)) + " UTC"
  );
}
export function number(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}
