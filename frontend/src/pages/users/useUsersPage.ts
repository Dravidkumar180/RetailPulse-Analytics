/* Manages user filters, queries, invitation and edit forms, and save requests. */
import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AccountStatus, UserRole } from "../../api/authApi";
import {
  createCompanyUser,
  getCompanyUsers,
  updateCompanyUser,
  type CompanyUser,
  type CreateUserRequest,
  type UpdateUserRequest,
} from "../../api/userApi";
import { useAuth } from "../../hooks/useAuth";
import { emptyInvite } from "./userConstants";
import { formatLabel } from "./userUtils";

export function useUsersPage() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const canEdit = currentUser?.role !== "VIEWER";
  // Store table filters and the values used by invite and edit dialogs.
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<UserRole | "">("");
  const [status, setStatus] = useState<AccountStatus | "">("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [invite, setInvite] = useState<CreateUserRequest>(emptyInvite);
  const [editingUser, setEditingUser] = useState<CompanyUser | null>(null);
  const [editValues, setEditValues] = useState<UpdateUserRequest>({
    role: "VIEWER",
    status: "ACTIVE",
  });

  // The query key keeps each page and filter combination cached separately.
  const usersQuery = useQuery({
    queryKey: ["company-users", page, search, role, status],
    queryFn: () =>
      getCompanyUsers({
        page,
        pageSize: 10,
        search,
        role,
        status,
      }),
  });

  // Create a user, then refresh the table and close the invite dialog.
  const inviteMutation = useMutation({
    mutationFn: createCompanyUser,
    onSuccess: async (_, invitedUser) => {
      await queryClient.invalidateQueries({
        queryKey: ["company-users"],
      });
      setInviteOpen(false);
      setInvite(emptyInvite);
      setShowPassword(false);
      window.dispatchEvent(
        new CustomEvent("retailpulse:notification", {
          detail: {
            title: "User invited",
            message: `${invitedUser.name.trim()} was invited as ${formatLabel(invitedUser.role)}.`,
            path: "/users",
          },
        }),
      );
    },
  });

  // Save role or status changes made in the edit dialog.
  const editMutation = useMutation({
    mutationFn: ({
      userId,
      values,
    }: {
      userId: string;
      values: UpdateUserRequest;
    }) => updateCompanyUser(userId, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["company-users"],
      });
      setEditingUser(null);
    },
  });

  // Copy the selected user into the edit form and clear the previous save error.
  const openEdit = (user: CompanyUser) => {
    setEditingUser(user);
    setEditValues({
      role: user.role === "SUPER_ADMIN" ? "COMPANY_ADMIN" : user.role,
      status: user.status,
    });
    editMutation.reset();
  };

  // Prevent a page reload and trim name/email before submitting the invitation.
  const submitInvite = (event: FormEvent) => {
    event.preventDefault();
    inviteMutation.mutate({
      ...invite,
      name: invite.name.trim(),
      email: invite.email.trim(),
    });
  };

  // Submit role and status changes only when a user has been selected.
  const submitEdit = (event: FormEvent) => {
    event.preventDefault();
    if (editingUser) {
      editMutation.mutate({
        userId: editingUser.id,
        values: editValues,
      });
    }
  };

  return {
    canEdit,
    page,
    setPage,
    search,
    setSearch,
    role,
    setRole,
    status,
    setStatus,
    inviteOpen,
    setInviteOpen,
    showPassword,
    setShowPassword,
    invite,
    setInvite,
    editingUser,
    setEditingUser,
    editValues,
    setEditValues,
    usersQuery,
    inviteMutation,
    editMutation,
    openEdit,
    submitInvite,
    submitEdit,
  };
}

export type UsersPageState = ReturnType<typeof useUsersPage>;
