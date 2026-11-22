// Generate a unique room ID for use when joining via a manually-entered ID
export const generateRoomId = () => crypto.randomUUID();

export const extractRoomIdFromInput = (input) => {
  try {
    if (input.includes("http://") || input.includes("https://")) {
      const url = new URL(input);
      const params = new URLSearchParams(url.search);
      return params.get("room") || input;
    }
    return input;
  } catch {
    return input;
  }
};

export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("Failed to copy:", error);
    return false;
  }
};
