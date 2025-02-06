import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const gradients = [
  "from-red-500 to-rose-600",
  "from-blue-600 to-indigo-700",
  "from-emerald-500 to-teal-600",
  "from-purple-600 to-violet-700",
  "from-amber-500 to-orange-600",
  "from-pink-600 to-rose-700",
  "from-sky-500 to-cyan-600",
  "from-orange-600 to-red-700",
  "from-teal-500 to-emerald-600",
  "from-fuchsia-600 to-pink-700",
];

export function getGradientByIndex(index: number): string {
  return gradients[Math.abs(index) % gradients.length];
}
