import { Box, FormControl, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import type { AuditAction } from "../../api/auditLogApi";
import type { CompanyUser } from "../../api/userApi";
import { auditActions, formatAuditAction } from "./auditLogUtils";

export type AuditFilters = { search:string; action:AuditAction|""; userId:string; resourceType:string; status:""|"SUCCESS"|"FAILED"; startDate:string; endDate:string; sortOrder:"newest"|"oldest" };
type Props = AuditFilters & { users:CompanyUser[]; onChange:<K extends keyof AuditFilters>(key:K,value:AuditFilters[K])=>void; onClear:()=>void };
export default function AuditLogFilters({users,onChange,onClear,...f}:Props){return <Box className="audit-logs-page__filters-card"><Box className="audit-logs-page__filter-title"><strong>Filters</strong><button type="button" onClick={onClear}>Clear all</button></Box><Box className="audit-logs-page__search"><SearchOutlinedIcon/><TextField fullWidth size="small" placeholder="Search user, action, resource ID or description" value={f.search} onChange={e=>onChange("search",e.target.value)}/></Box><Box className="audit-logs-page__filters">
<FormControl size="small"><InputLabel>User</InputLabel><Select label="User" value={f.userId} onChange={e=>onChange("userId",e.target.value)}><MenuItem value="">All Users</MenuItem>{users.map(u=><MenuItem value={u.id} key={u.id}>{u.name}</MenuItem>)}</Select></FormControl>
<FormControl size="small"><InputLabel>Action</InputLabel><Select label="Action" value={f.action} onChange={e=>onChange("action",e.target.value as AuditAction|"")}><MenuItem value="">All Actions</MenuItem>{auditActions.map(a=><MenuItem value={a} key={a}>{formatAuditAction(a)}</MenuItem>)}</Select></FormControl>
<FormControl size="small"><InputLabel>Resource</InputLabel><Select label="Resource" value={f.resourceType} onChange={e=>onChange("resourceType",e.target.value)}><MenuItem value="">All Resources</MenuItem>{["Product","Customer","Sale","Inventory","User","Category","Report","Import","Forecast","Authentication"].map(x=><MenuItem key={x} value={x}>{x}</MenuItem>)}</Select></FormControl>
<FormControl size="small"><InputLabel>Status</InputLabel><Select label="Status" value={f.status} onChange={e=>onChange("status",e.target.value as AuditFilters["status"])}><MenuItem value="">All Statuses</MenuItem><MenuItem value="SUCCESS">Success</MenuItem><MenuItem value="FAILED">Failed</MenuItem></Select></FormControl>
<TextField size="small" label="From" type="date" value={f.startDate} onChange={e=>onChange("startDate",e.target.value)} slotProps={{inputLabel:{shrink:true}}}/><TextField size="small" label="To" type="date" value={f.endDate} onChange={e=>onChange("endDate",e.target.value)} slotProps={{inputLabel:{shrink:true}}}/>
<FormControl size="small"><InputLabel>Sort by</InputLabel><Select label="Sort by" value={f.sortOrder} onChange={e=>onChange("sortOrder",e.target.value as AuditFilters["sortOrder"])}><MenuItem value="newest">Newest first</MenuItem><MenuItem value="oldest">Oldest first</MenuItem></Select></FormControl>
</Box></Box>}
