/* Teaching guide: This file contains the users page page.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */

// Imports the needed tools from react.
import { useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Alert,
  Box,
  FormControl,
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
// Imports the needed tools from @mui/icons-material/PeopleOutlined.
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutlined";
// Imports the needed tools from @mui/icons-material/RefreshOutlined.
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";

import type {
  AccountStatus,
  UserRole,
} from "../../api/authApi";
import {
  getCompanyUsers,
  updateUserStatus,
  // Defines the company user type.
  type CompanyUser,
} from "../../api/userApi";
// Imports the needed tools from ../../components/common/Button/Button.
import Button from "../../components/common/Button/Button";
// Imports the needed tools from ../../components/common/LoadingSpinner/LoadingSpinner.
import LoadingSpinner from "../../components/common/LoadingSpinner/LoadingSpinner";
// Imports the needed tools from ../../components/common/PageHeader/PageHeader.
import PageHeader from "../../components/common/PageHeader/PageHeader";
// Imports the needed tools from ../../components/common/StatusBadge/StatusBadge.
import StatusBadge from "../../components/common/StatusBadge/StatusBadge";

// Loads ./UsersPage.css styles or setup.
import "./UsersPage.css";

// Runs format date time logic.
const formatDateTime = (date?: string | null): string => {
  // Checks whether this condition is true.
  if (!date) {
    // Returns the completed result to the caller.
    return "Never";
  }

  // Returns the completed result to the caller.
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
};

// Runs format role logic.
const formatRole = (role: string): string => {
  // Returns the completed result to the caller.
  return role
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

// Shows the users page.
const UsersPage = () => {
  // Stores query client for the steps below.
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<UserRole | "">("");
  const [status, setStatus] = useState<AccountStatus | "">("");

  // Stores users query for the steps below.
  const usersQuery = useQuery({
    queryKey: [
      "company-users",
      page,
      search,
      role,
      status,
    ],
    queryFn: () =>
      getCompanyUsers({
        page,
        pageSize: 10,
        search,
        role,
        status,
      }),
  });

  // Stores status mutation for the steps below.
  const statusMutation = useMutation({
    mutationFn: ({
      userId,
      newStatus,
    }: {
      userId: string;
      newStatus: AccountStatus;
    }) =>
      updateUserStatus(userId, {
        status: newStatus,
      }),
    onSuccess: async (_, variables) => {
      // Waits for this asynchronous work to finish.
      await queryClient.invalidateQueries({
        queryKey: ["company-users"],
      });
      window.dispatchEvent(new CustomEvent("retailpulse:notification", {
        detail: {
          title: "User status updated",
          message: `A user account was changed to ${formatRole(variables.newStatus)}.`,
          path: "/users",
        },
      }));
    },
  });

  // Handles status change.
  const handleStatusChange = (
    user: CompanyUser,
    newStatus: AccountStatus,
  ) => {
    statusMutation.mutate({
      userId: user.id,
      newStatus,
    });
  };

  // Builds the visible interface below.
  return (
    <Box className="users-page">
      <PageHeader
        title="Users"
        subtitle="Manage users belonging to your company."
        icon={<PeopleOutlineIcon />}
        actions={
          <Button
            variant="outlined"
            startIcon={<RefreshOutlinedIcon />}
            onClick={() => usersQuery.refetch()}
          >
            Refresh
          </Button>
        }
      />

      <Box className="users-page__filters">
        <TextField
          label="Search Users"
          placeholder="Search by name or email"
          value={search}
          onChange={(event) => {
            // Updates the page or stored state with this result.
            setSearch(event.target.value);
            // Updates the page or stored state with this result.
            setPage(1);
          }}
          className="users-page__search"
        />

        <FormControl className="users-page__filter">
          <InputLabel id="user-role-filter-label">
            Role
          </InputLabel>

          <Select
            labelId="user-role-filter-label"
            label="Role"
            value={role}
            onChange={(event) => {
              // Updates the page or stored state with this result.
              setRole(event.target.value as UserRole | "");
              // Updates the page or stored state with this result.
              setPage(1);
            }}
          >
            <MenuItem value="">All Roles</MenuItem>
            <MenuItem value="COMPANY_ADMIN">
              Company Admin
            </MenuItem>
            <MenuItem value="ANALYST">Analyst</MenuItem>
            <MenuItem value="VIEWER">Viewer</MenuItem>
          </Select>
        </FormControl>

        <FormControl className="users-page__filter">
          <InputLabel id="user-status-filter-label">
            Status
          </InputLabel>

          <Select
            labelId="user-status-filter-label"
            label="Status"
            value={status}
            onChange={(event) => {
              // Updates the page or stored state with this result.
              setStatus(
                event.target.value as AccountStatus | "",
              );
              // Updates the page or stored state with this result.
              setPage(1);
            }}
          >
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="ACTIVE">Active</MenuItem>
            <MenuItem value="INACTIVE">Inactive</MenuItem>
            <MenuItem value="SUSPENDED">Suspended</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {statusMutation.isError && (
        <Alert
          severity="error"
          className="users-page__alert"
        >
          Unable to update the user status.
        </Alert>
      )}

      {usersQuery.isLoading ? (
        <LoadingSpinner message="Loading company users..." />
      ) : usersQuery.isError ? (
        <Alert severity="error">
          Unable to load company users.
        </Alert>
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
                  <TableCell align="right">
                    Change Status
                  </TableCell>
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

                      <TableCell>
                        {formatRole(user.role)}
                      </TableCell>

                      <TableCell>
                        <StatusBadge status={user.status} />
                      </TableCell>

                      <TableCell>
                        {formatDateTime(user.lastLogin)}
                      </TableCell>

                      <TableCell>
                        {formatDateTime(user.createdAt)}
                      </TableCell>

                      <TableCell align="right">
                        <Select
                          size="small"
                          value={user.status}
                          disabled={statusMutation.isPending}
                          onChange={(event) =>
                            handleStatusChange(
                              user,
                              event.target
                                .value as AccountStatus,
                            )
                          }
                          className="users-page__status-select"
                        >
                          <MenuItem value="ACTIVE">
                            Active
                          </MenuItem>
                          <MenuItem value="INACTIVE">
                            Inactive
                          </MenuItem>
                          <MenuItem value="SUSPENDED">
                            Suspended
                          </MenuItem>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Box className="users-page__empty">
                        <PeopleOutlineIcon />

                        <Typography component="h3">
                          No users found
                        </Typography>

                        <Typography component="p">
                          No company users match the selected
                          filters.
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
                onChange={(_, selectedPage) =>
                  // Updates the page or stored state with this result.
                  setPage(selectedPage)
                }
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default UsersPage;
