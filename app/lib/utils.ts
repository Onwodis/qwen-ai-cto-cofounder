// import { clsx, type ClassValue } from 'clsx';
// import { twMerge } from 'tailwind-merge';

// /**
//  * Merges Tailwind CSS classes without style conflicts.
//  * 'clsx' handles conditional classes (true/false logic).
//  * 'twMerge' ensures that the final Tailwind classes are merged correctly.
//  */
// export function cn(...inputs: ClassValue[]) {
//   return twMerge(clsx(inputs));
// }
import { twMerge } from 'tailwind-merge';

// Define a safe, type-compliant variant array interface instead of pulling 'ClassValue' from 'clsx'
export type ClassValue =
  | string
  | number
  | null
  | undefined
  | boolean
  | { [key: string]: any }
  | ClassValue[];

/**
 * Natively processes conditional class structures (objects, arrays, strings)
 * replacing the core functionality of the 'clsx' package to prevent build bottlenecks.
 */
function inlineClsx(...args: ClassValue[]): string {
  const classes: string[] = [];

  for (const arg of args) {
    if (!arg) continue;

    if (typeof arg === 'string' || typeof arg === 'number') {
      classes.push(String(arg));
    } else if (Array.isArray(arg)) {
      if (arg.length) {
        const inner = inlineClsx(...arg);
        if (inner) classes.push(inner);
      }
    } else if (typeof arg === 'object') {
      for (const key in arg) {
        if (Object.prototype.hasOwnProperty.call(arg, key) && arg[key]) {
          classes.push(key);
        }
      }
    }
  }

  return classes.join(' ');
}

/**
 * Merges Tailwind CSS classes without style conflicts.
 * Handles conditional logic natively and optimizes merging via 'twMerge'.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(inlineClsx(...inputs));
}


