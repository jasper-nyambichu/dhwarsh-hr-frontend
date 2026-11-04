import "server-only";

import { api } from "@/app/lib/api-client";

/** `controller/auth/ProfileController`. Always the signed-in account: no id is ever sent. */

export type MyProfile = {
  id: number;
  username: string;
  role: string;
  displayName: string | null;
  email: string | null;
  hasPhoto: boolean;
};

export function getMyProfile(): Promise<MyProfile> {
  return api.get<MyProfile>("/users/me/profile");
}

/** Changing the email needs `currentPassword`. A name change does not. */
export function updateMyProfile(payload: { displayName: string; email: string; currentPassword?: string }): Promise<MyProfile> {
  return api.put<MyProfile>("/users/me/profile", payload);
}

export function changeMyPassword(payload: { currentPassword: string; newPassword: string }): Promise<void> {
  return api.put<void>("/users/me/password", payload);
}

export function uploadMyPhoto(body: FormData): Promise<void> {
  return api.post<void>("/users/me/photo", body);
}

export function removeMyPhoto(): Promise<void> {
  return api.delete<void>("/users/me/photo");
}
