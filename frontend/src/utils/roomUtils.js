// Generate a unique, unguessable room ID (used for anonymous rooms;
// authenticated rooms get their ID from the server)
export const generateRoomId = () => crypto.randomUUID();

// Extract room ID from URL or plain input
export const extractRoomIdFromInput = (input) => {
  try {
    if (input.includes('http://') || input.includes('https://')) {
      const url = new URL(input);
      const params = new URLSearchParams(url.search);
      return params.get('room') || input;
    }
    return input;
  } catch {
    return input;
  }
};

// Copy text to clipboard
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy:', error);
    return false;
  }
};