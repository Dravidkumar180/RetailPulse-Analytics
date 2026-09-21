/* Filters company users by name or email, role, and account status. */
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import type { AccountStatus, UserRole } from "../../api/authApi";
import { editableRoles, accountStatuses } from "./userConstants";
import { formatLabel } from "./userUtils";
import type { UsersPageState } from "./useUsersPage";

type Props = Pick<
  UsersPageState,
  | "search"
  | "setSearch"
  | "role"
  | "setRole"
  | "status"
  | "setStatus"
  | "setPage"
>;

export default function UserFilters({
  search,
  setSearch,
  role,
  setRole,
  status,
  setStatus,
  setPage,
}: Props) {
  return (
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
  );
}
