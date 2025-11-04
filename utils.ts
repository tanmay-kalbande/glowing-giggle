import { Business } from './types';

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
