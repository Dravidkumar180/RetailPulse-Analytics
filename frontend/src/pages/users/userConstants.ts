/* Stores editable roles, account statuses, and the empty invitation form. */
import type { AccountStatus, UserRole } from "../../api/authApi";
import type { CreateUserRequest } from "../../api/userApi";

export const editableRoles: Array<Exclude<UserRole, "SUPER_ADMIN">> = [
  "VIEWER",
  "ANALYST",
  "COMPANY_ADMIN",
];
export const accountStatuses: AccountStatus[] = [
  "ACTIVE",
  "INACTIVE",
  "SUSPENDED",
];

export const emptyInvite: CreateUserRequest = {
  name: "",
  email: "",
  password: "",
  role: "VIEWER",
};
