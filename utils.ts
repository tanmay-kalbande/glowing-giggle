
// src/utils.ts
/**
 * Formats a 10-digit phone number into a more readable format.
 * e.g., "9876543210" becomes "+91 98765 43210"
 */
export const formatPhoneNumber = (phoneNumber: string): string => {
    if (phoneNumber && phoneNumber.length === 10) {
        return `+91 ${phoneNumber.slice(0, 5)} ${phoneNumber.slice(5)}`;
    }
    return phoneNumber;
};

/**
 * Creates a URL-friendly "slug" from a given string.
 * e.g., "Rahul किराणा Wholesale" becomes "rahul-kirana-wholesale"
 */
export const createSlug = (text: string): string => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    // Attempt to handle some Devanagari characters, though not exhaustive
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\u0900-\u097F\w-]+/g, '') // Remove all non-word chars except Devanagari
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
};
