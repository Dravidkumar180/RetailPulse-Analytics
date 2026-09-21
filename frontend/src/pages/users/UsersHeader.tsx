/* Shows the users page title, refresh button, and invite action when allowed. */
import { Box } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import Button from "../../components/common/Button/Button";
import PageHeader from "../../components/common/PageHeader/PageHeader";
import type { UsersPageState } from "./useUsersPage";

type Props = Pick<
  UsersPageState,
  "canEdit" | "usersQuery" | "inviteMutation" | "setInviteOpen"
>;

export default function UsersHeader({
  canEdit,
  usersQuery,
  inviteMutation,
  setInviteOpen,
}: Props) {
  return (
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
  );
}
