/**
 * Mirrors `dto/response/notification/NotificationResponse.java`.
 *
 * `referenceId` is the entity the notification is about — for employee-request
 * notifications it is the request id, which the bell uses to build the href.
 */
export type NotificationResponse = {
  id: number;
  channel: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string | null;
  referenceId: number | null;
};

/**
 * Shape returned by the frontend's own `/api/notifications` route, which
 * bundles the list and the unread count into one response so the bell makes
 * one fetch instead of two.
 */
export type NotificationsPayload = {
  items: NotificationResponse[];
  unread: number;
};

/**
 * Notification type strings used by `EmployeeCreationRequestServiceImpl`.
 * The bell keys on these to decide the icon, chip colour and link destination.
 * They must match the Java constants exactly.
 */
export const NOTIFICATION_TYPE = {
  EMPLOYEE_REQUEST_SUBMITTED: "EMPLOYEE_REQUEST_SUBMITTED",
  EMPLOYEE_REQUEST_APPROVED: "EMPLOYEE_REQUEST_APPROVED",
  EMPLOYEE_REQUEST_REJECTED: "EMPLOYEE_REQUEST_REJECTED",
  AGENT_PAYMENT_RUN_GRANTED: "AGENT_PAYMENT_RUN_GRANTED",
  AGENT_PAYMENT_RUN_REVOKED: "AGENT_PAYMENT_RUN_REVOKED",
  AGENT_PAYMENTS_RUN_BY_MANAGER: "AGENT_PAYMENTS_RUN_BY_MANAGER",
} as const;
