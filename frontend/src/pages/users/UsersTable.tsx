/* Shows company users, their roles and statuses, edit actions, and pagination. */
import {
  Alert,
  Box,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutlined";
import Button from "../../components/common/Button/Button";
import LoadingSpinner from "../../components/common/LoadingSpinner/LoadingSpinner";
import StatusBadge from "../../components/common/StatusBadge/StatusBadge";
import { formatLabel, formatDateTime } from "./userUtils";
import type { UsersPageState } from "./useUsersPage";

type Props = Pick<
  UsersPageState,
  "usersQuery" | "canEdit" | "openEdit" | "page" | "setPage"
>;

export default function UsersTable({
  usersQuery,
  canEdit,
  openEdit,
  page,
  setPage,
}: Props) {
  return (
    <>
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
    </>
  );
}
