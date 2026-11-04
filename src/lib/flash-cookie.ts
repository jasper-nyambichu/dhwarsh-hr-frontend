/** Shared by the server code that queues a toast and the browser code that shows it. */
export const FLASH_COOKIE = "dhwarsh_flash";

export type FlashToast = { tone: "success" | "info" | "warning"; message: string };
