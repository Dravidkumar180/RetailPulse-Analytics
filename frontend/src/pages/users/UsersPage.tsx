// Coordinates user data, filters, permissions, and user-management actions.
import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";

import type { AccountStatus, UserRole } from "../../api/authApi";
import {
  createCompanyUser,
  getCompanyUsers,
  updateCompanyUser,
  type CompanyUser,
  type CreateUserRequest,
  type UpdateUserRequest,
} from "../../api/userApi";
import Button from "../../components/common/Button/Button";
import LoadingSpinner from "../../components/common/LoadingSpinner/LoadingSpinner";
import PageHeader from "../../components/common/PageHeader/PageHeader";
import StatusBadge from "../../components/common/StatusBadge/StatusBadge";
import { useAuth } from "../../hooks/useAuth";

import "./UsersPage.css";

const editableRoles: Array<Exclude<UserRole, "SUPER_ADMIN">> = [
  "VIEWER",
  "ANALYST",
  "COMPANY_ADMIN",
];
const accountStatuses: AccountStatus[] = ["ACTIVE", "INACTIVE", "SUSPENDED"];

const emptyInvite: CreateUserRequest = {
  name: "",
  email: "",
  password: "",
  role: "VIEWER",
};

// This component receives prepared data and renders the feature-specific interface.
const formatDateTime = (date?: string | null): string => {
  if (!date) return "Never";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
};

const formatLabel = (value: string): string =>
  value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

const UsersPage = () => {
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

  const openEdit = (user: CompanyUser) => {
    setEditingUser(user);
    setEditValues({
      role: user.role === "SUPER_ADMIN" ? "COMPANY_ADMIN" : user.role,
      status: user.status,
    });
    editMutation.reset();
  };

  const submitInvite = (event: FormEvent) => {
    event.preventDefault();
    inviteMutation.mutate({
      ...invite,
      name: invite.name.trim(),
      email: invite.email.trim(),
    });
  };

  const submitEdit = (event: FormEvent) => {
    event.preventDefault();
    if (editingUser) {
      editMutation.mutate({
        userId: editingUser.id,
        values: editValues,
      });
    }
  };

  return (
    <Box className="users-page">
      <PageHeader
        title="Users"
        subtitle="Manage users belonging to your company."
        icon={<PeopleOutlineIcon />}
        actions={
          <Box className="users-page__header-actions">
            <Button
              variant="outlined"
              startIcon={<RefreshOutlinedIcon />}
              onClick={() => usersQuery.refetch()}
            >
              Refresh
            </Button>
            {canEdit && (
              <Button
                startIcon={<AddIcon />}
                className="users-page__invite-button"
                onClick={() => {
                  inviteMutation.reset();
                  setInviteOpen(true);
                }}
              >
                Invite User
              </Button>
            )}
          </Box>
        }
      />

      <Box className="users-page__filters">
        <TextField
          label="Search Users"
          placeholder="Search by name or email"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          className="users-page__search"
        />
        <FormControl className="users-page__filter">
          <InputLabel id="user-role-filter-label">Role</InputLabel>
          <Select
            labelId="user-role-filter-label"
            label="Role"
            value={role}
            onChange={(event) => {
              setRole(event.target.value as UserRole | "");
              setPage(1);
            }}
          >
            <MenuItem value="">All Roles</MenuItem>
            {editableRoles.map((item) => (
              <MenuItem key={item} value={item}>
                {formatLabel(item)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl className="users-page__filter">
          <InputLabel id="user-status-filter-label">Status</InputLabel>
          <Select
            labelId="user-status-filter-label"
            label="Status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as AccountStatus | "");
              setPage(1);
            }}
          >
            <MenuItem value="">All Statuses</MenuItem>
            {accountStatuses.map((item) => (
              <MenuItem key={item} value={item}>
                {formatLabel(item)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {usersQuery.isLoading ? (
        <LoadingSpinner message="Loading company users..." />
      ) : usersQuery.isError ? (
        <Alert severity="error">Unable to load company users.</Alert>
      ) : (
        <>
          <TableContainer className="users-page__table-container">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Login</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {usersQuery.data?.items.length ? (
                  usersQuery.data.items.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>
                        <Box className="users-page__user">
                          <Box className="users-page__avatar">
                            {user.name.charAt(0).toUpperCase()}
                          </Box>
                          <Box>
                            <Typography component="strong">
                              {user.name}
                            </Typography>
                            <Typography component="span">
                              {user.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{formatLabel(user.role)}</TableCell>
                      <TableCell>
                        <StatusBadge status={user.status} />
                      </TableCell>
                      <TableCell>{formatDateTime(user.lastLogin)}</TableCell>
                      <TableCell>{formatDateTime(user.createdAt)}</TableCell>
                      <TableCell align="right">
                        {canEdit ? (
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<EditOutlinedIcon />}
                            onClick={() => openEdit(user)}
                          >
                            Edit
                          </Button>
                        ) : (
                          <Typography component="span">View only</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Box className="users-page__empty">
                        <PeopleOutlineIcon />
                        <Typography component="h3">No users found</Typography>
                        <Typography component="p">
                          No company users match the selected filters.
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {(usersQuery.data?.totalPages ?? 0) > 1 && (
            <Box className="users-page__pagination">
              <Pagination
                page={page}
                count={usersQuery.data?.totalPages ?? 1}
                onChange={(_, selectedPage) => setPage(selectedPage)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      <Dialog
        open={inviteOpen}
        onClose={() => !inviteMutation.isPending && setInviteOpen(false)}
        fullWidth
        maxWidth="sm"
        className="users-page__dialog"
      >
        <Box component="form" onSubmit={submitInvite}>
          <DialogTitle>
            Invite User
            <IconButton
              aria-label="Close invite dialog"
              onClick={() => setInviteOpen(false)}
              disabled={inviteMutation.isPending}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            {inviteMutation.isError && (
              <Alert severity="error">
                Unable to invite this user. Check the details or use a different
                email.
              </Alert>
            )}
            <TextField
              label="Full Name"
              value={invite.name}
              onChange={(event) =>
                setInvite({ ...invite, name: event.target.value })
              }
              required
              inputProps={{ minLength: 2, maxLength: 100 }}
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={invite.email}
              onChange={(event) =>
                setInvite({ ...invite, email: event.target.value })
              }
              required
              fullWidth
            />
            <TextField
              label="Temporary Password"
              type={showPassword ? "text" : "password"}
              value={invite.password}
              onChange={(event) =>
                setInvite({ ...invite, password: event.target.value })
              }
              required
              fullWidth
              slotProps={{
                htmlInput: { minLength: 8, maxLength: 72 },
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        onClick={() => setShowPassword((current) => !current)}
                        edge="end"
                      >
                        {showPassword ? (
                          <VisibilityOffOutlinedIcon />
                        ) : (
                          <VisibilityOutlinedIcon />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <FormControl fullWidth>
              <InputLabel id="invite-role-label">Role</InputLabel>
              <Select
                labelId="invite-role-label"
                label="Role"
                value={invite.role}
                onChange={(event) =>
                  setInvite({
                    ...invite,
                    role: event.target.value as CreateUserRequest["role"],
                  })
                }
              >
                {editableRoles.map((item) => (
                  <MenuItem key={item} value={item}>
                    {formatLabel(item)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button
              variant="outlined"
              onClick={() => setInviteOpen(false)}
              disabled={inviteMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" loading={inviteMutation.isPending}>
              Send Invite
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog
        open={Boolean(editingUser)}
        onClose={() => !editMutation.isPending && setEditingUser(null)}
        fullWidth
        maxWidth="sm"
        className="users-page__dialog"
      >
        <Box component="form" onSubmit={submitEdit}>
          <DialogTitle>
            Edit {editingUser?.name}
            <IconButton
              aria-label="Close edit dialog"
              onClick={() => setEditingUser(null)}
              disabled={editMutation.isPending}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            {editMutation.isError && (
              <Alert severity="error">
                Unable to save this user. Please try again.
              </Alert>
            )}
            <FormControl fullWidth>
              <InputLabel id="edit-role-label">Role</InputLabel>
              <Select
                labelId="edit-role-label"
                label="Role"
                value={editValues.role}
                onChange={(event) =>
                  setEditValues({
                    ...editValues,
                    role: event.target.value as UpdateUserRequest["role"],
                  })
                }
              >
                {editableRoles.map((item) => (
                  <MenuItem key={item} value={item}>
                    {formatLabel(item)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="edit-status-label">Status</InputLabel>
              <Select
                labelId="edit-status-label"
                label="Status"
                value={editValues.status}
                onChange={(event) =>
                  setEditValues({
                    ...editValues,
                    status: event.target.value as AccountStatus,
                  })
                }
              >
                {accountStatuses.map((item) => (
                  <MenuItem key={item} value={item}>
                    {formatLabel(item)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button
              variant="outlined"
              onClick={() => setEditingUser(null)}
              disabled={editMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" loading={editMutation.isPending}>
              Save Changes
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};

export default UsersPage;
