import { customAlphabet } from "nanoid";

// Lowercase alphanumeric — readable, URL-safe codes.
const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";

export const generateRefCode = customAlphabet(alphabet, 8);
export const generateLinkCode = customAlphabet(alphabet, 10);
export const generateVisitorId = customAlphabet(alphabet, 21);
