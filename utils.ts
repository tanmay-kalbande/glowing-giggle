// utils.ts - Updated with name management
import { v4 as uuidv4 } from 'uuid';

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

// --- Rating System Utilities ---

const DEVICE_ID_KEY = 'jawala-device-id';
const RATED_BUSINESSES_KEY = 'jawala-rated-businesses';
const USER_NAME_KEY = 'jawala-user-name'; // NEW: Store user name
const NAME_PROMPTED_KEY = 'jawala-name-prompted'; // NEW: Track if we've asked for name

/**
 * Gets or creates a unique anonymous ID for the user's device.
 * @returns {string} The unique device ID.
 */
export const getDeviceId = (): string => {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
        deviceId = uuidv4();
        localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
};

/**
 * Checks if a user has already rated a specific business on this device.
 * @param {string} businessId The ID of the business to check.
 * @returns {boolean} True if the user has already rated.
 */
export const hasRated = (businessId: string): boolean => {
    const rated = localStorage.getItem(RATED_BUSINESSES_KEY);
    if (!rated) return false;
    const ratedIds: string[] = JSON.parse(rated);
    return ratedIds.includes(businessId);
};

/**
 * Marks a business as rated by the user on this device.
 * @param {string} businessId The ID of the business to mark as rated.
 */
export const markAsRated = (businessId: string): void => {
    const rated = localStorage.getItem(RATED_BUSINESSES_KEY);
    let ratedIds: string[] = rated ? JSON.parse(rated) : [];
    if (!ratedIds.includes(businessId)) {
        ratedIds.push(businessId);
        localStorage.setItem(RATED_BUSINESSES_KEY, JSON.stringify(ratedIds));
    }
};

// --- NEW: Name Management Functions ---

/**
 * Gets the stored user name if available
 * @returns {string | null} The user's name or null if not set
 */
export const getUserName = (): string | null => {
    return localStorage.getItem(USER_NAME_KEY);
};

/**
 * Saves the user's name to local storage
 * @param {string} name The user's name to save
 */
export const setUserName = (name: string): void => {
    localStorage.setItem(USER_NAME_KEY, name);
    localStorage.setItem(NAME_PROMPTED_KEY, 'true');
};

/**
 * Checks if we've already prompted the user for their name
 * @returns {boolean} True if we've already asked
 */
export const hasBeenPromptedForName = (): boolean => {
    return localStorage.getItem(NAME_PROMPTED_KEY) === 'true';
};

/**
 * Marks that we've prompted the user for name (even if they skipped)
 */
export const markNamePrompted = (): void => {
    localStorage.setItem(NAME_PROMPTED_KEY, 'true');
};

/**
 * Clears the user's name (for settings/reset)
 */
export const clearUserName = (): void => {
    localStorage.removeItem(USER_NAME_KEY);
    localStorage.removeItem(NAME_PROMPTED_KEY);
};
