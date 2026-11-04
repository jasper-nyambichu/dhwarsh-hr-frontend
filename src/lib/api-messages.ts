/**
 * What a user reads when the system fails. Kept in one place so every page, form and download says the
 * same thing. Written for the person using the portal: what happened and what to do next, never a status
 * code, a server's own wording or anything about how the system is set up.
 */
export const SYSTEM_UNREACHABLE = "We can't connect to the system right now. Please try again in a few minutes.";
export const SYSTEM_ERROR = "Something went wrong on our side. Please try again in a few minutes.";
export const SESSION_EXPIRED = "Your session has expired. Please sign in again.";
export const NO_PERMISSION = "You do not have permission to do this.";
export const NOT_FOUND = "We couldn't find this record. It may have been moved or removed.";
export const REQUEST_REFUSED = "We couldn't complete this request. Please check the details and try again.";
