# Users page

Start with `UsersPage.tsx`. It assembles the page and passes state and actions to the components below.

| File | Purpose |
| --- | --- |
| `UsersHeader.tsx` | Page title, refresh button, and invite button. |
| `UserFilters.tsx` | Search, role, and account status filters; resets pagination when filters change. |
| `UsersTable.tsx` | User rows, loading/error/empty states, edit buttons, and pagination. |
| `InviteUserDialog.tsx` | New user form, password visibility, and invitation submission. |
| `EditUserDialog.tsx` | Form for changing a user's role and account status. |
| `useUsersPage.ts` | Page state, permissions, queries, mutations, and form submission handlers. |
| `userConstants.ts` | Available roles, account statuses, and initial invite values. |
| `userUtils.ts` | Display formatting for dates, roles, and statuses. |
| `UsersPage.css` | Styles shared by the page and its components. |

`UsersPage` calls `useUsersPage` once. Each component declares the state and handlers it needs using `Pick<UsersPageState, ...>`.

API requests and request/response types remain in `../../api/userApi.ts`. Account status and role types remain in `../../api/authApi.ts`.
