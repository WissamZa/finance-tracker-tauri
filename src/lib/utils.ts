import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const resolveFileUrl = (urlOrKey: string) => {
  if (!urlOrKey) return '';
  if (urlOrKey.startsWith('data:') || urlOrKey.startsWith('http') || urlOrKey.startsWith('blob:')) {
    return urlOrKey;
  }
  return `/api/files/sign?key=${encodeURIComponent(urlOrKey)}`;
};

// Safe logging - only logs in development mode
export const devLog = (...args: unknown[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args);
  }
};

// Safe error logging - logs to console but returns generic message for client
export const safeError = (error: unknown, context?: string): string => {
  // Log full error server-side for debugging
  if (context) {
    console.error(`[${context}]`, error);
  } else {
    console.error(error);
  }
  
  // Return generic message for client (don't leak details)
  return 'An error occurred. Please try again.';
};
