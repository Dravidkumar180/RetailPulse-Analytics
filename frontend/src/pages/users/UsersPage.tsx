/* Connects user data to the header, filters, table, and invite/edit dialogs. */
import { Box } from "@mui/material";
import UsersHeader from "./UsersHeader";
import UserFilters from "./UserFilters";
import UsersTable from "./UsersTable";
import InviteUserDialog from "./InviteUserDialog";
import EditUserDialog from "./EditUserDialog";
import { useUsersPage } from "./useUsersPage";
import "./UsersPage.css";

export default function UsersPage() {
  const users = useUsersPage();

  return (
    <Box className="users-page">
      <UsersHeader {...users} />
      <UserFilters {...users} />
      <UsersTable {...users} />
      <InviteUserDialog {...users} />
      <EditUserDialog {...users} />
    </Box>
  );
}
