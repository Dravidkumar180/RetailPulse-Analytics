import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Stack, Typography, Table, TableBody, TableCell, TableHead, TableRow, TextField, Divider, CircularProgress, Box } from '@mui/material';
import { Link } from 'react-router-dom';
import { workflowApi,label } from '../../api/workflowApi';
import { errorText } from './WorkflowRequestForm';
import { useAuth } from '../../hooks/useAuth';
export default function WorkflowDetails({id,onClose}:{id:string;onClose:()=>void}){
 const {user}=useAuth();const qc=useQueryClient();const [comment,setComment]=useState('');const [confirm,setConfirm]=useState('');
 const detail=useQuery({queryKey:['workflow-detail',user?.companyId,id],queryFn:()=>workflowApi.detail(id)});
 const history=useQuery({queryKey:['workflow-history',user?.companyId,id,detail.dataUpdatedAt],queryFn:()=>workflowApi.history(id),enabled:!!detail.data});
 const act=useMutation({mutationFn:()=>{if(confirm==='reject'&&!comment.trim())throw new Error('Enter a rejection reason.');return workflowApi.action(id,confirm,comment);},onSuccess:()=>{setConfirm('');setComment('');void qc.invalidateQueries();}});
 const r=detail.data;const date=(s:string)=>new Date(s).toLocaleString();
 const relatedPath=r?.requestType==='CUSTOMER_INFORMATION_CHANGE'?'/customers':r?.requestType==='INVENTORY_IMPORT_APPROVAL'?'/data-import?job='+r.relatedId:r?.requestType==='STOCK_ADJUSTMENT'?'/inventory':'/products';
 return <Dialog open fullWidth maxWidth="md" onClose={act.isPending?undefined:onClose}><DialogTitle>Request details <Typography variant="caption" component="div">{id}</Typography></DialogTitle><DialogContent>
 {detail.isPending&&<CircularProgress />}{detail.isError&&<Alert severity="error">{errorText(detail.error)}</Alert>}
 {r&&<Stack spacing={2}><Box><Chip label={label(r.status)} color={r.status==='APPROVED'?'success':r.status==='REJECTED'?'error':'warning'} /> <Chip label={label(r.priority)} /></Box>
 {['APPROVED','REJECTED','CANCELLED'].includes(r.status)&&<Alert severity={r.status==='APPROVED'?'success':'info'}>{r.status==='APPROVED'?(r.requestType==='INVENTORY_IMPORT_APPROVAL'?'Approved. Import released to processing; check Data Imports for the result.':'Approved. Requested changes were applied.'):label(r.status)+'. Requested changes were not applied.'}</Alert>}
 <div className="workflow-meta"><div><small>Request type</small><strong>{label(r.requestType)}</strong></div><div><small>Requested by</small><strong>{r.requestedBy}</strong></div><div><small>Related record</small><Link to={relatedPath}>{r.relatedRecord}</Link></div><div><small>Approver role</small><strong>{label(r.approverRole)}</strong></div><div><small>Created</small>{date(r.createdAt)}</div><div><small>Last updated</small>{date(r.updatedAt)}</div></div>
 <Typography><strong>Reason:</strong> {r.reason}</Typography><Typography variant="h6">Current vs requested</Typography>
 <Table size="small"><TableHead><TableRow><TableCell>Field</TableCell><TableCell>At submission</TableCell><TableCell>Requested value</TableCell><TableCell>Difference</TableCell></TableRow></TableHead><TableBody>{Object.entries(r.requestedValues).map(([k,v])=><TableRow key={k}><TableCell>{label(k)}</TableCell><TableCell>{String(r.currentValues[k]??'—')}</TableCell><TableCell sx={{backgroundColor:'action.hover',fontWeight:600}}>{String(v??'—')}</TableCell><TableCell>{['stock_quantity','unit_price','reorder_level'].includes(k)?(Number(v)-Number(r.currentValues[k])>=0?'+':'')+(Number(v)-Number(r.currentValues[k])):'—'}</TableCell></TableRow>)}</TableBody></Table>
 <Divider/><Typography variant="h6">Approval history & timeline</Typography>
 {history.isError&&<Alert severity="error">{errorText(history.error)}</Alert>}
 <ol className="workflow-timeline">{history.data?.map(h=><li key={h.id}><span>{date(h.timestamp)}</span><strong>{label(h.action)} · {h.actor}</strong><p>{h.comment||label(h.toStatus)}</p></li>)}</ol>
 <Stack direction="row" spacing={1}><Button component={Link} to={relatedPath}>View related record</Button>{['COMPANY_ADMIN','SUPER_ADMIN'].includes(user?.role??'')&&<Button component={Link} to={'/audit-logs?search='+id}>View audit logs</Button>}<Button component={Link} to="/data-quality">Data quality</Button></Stack>
 {(r.canApprove||r.canCancel||r.canSubmit)&&<><TextField label="Comments / rejection reason" multiline minRows={2} value={comment} onChange={e=>setComment(e.target.value)} /><Stack direction="row" spacing={1}>{r.canApprove&&<><Button color="success" variant="contained" disabled={act.isPending} onClick={()=>setConfirm('approve')}>Approve</Button><Button color="error" variant="contained" disabled={act.isPending} onClick={()=>setConfirm('reject')}>Reject</Button></>}{r.canSubmit&&<Button variant="contained" onClick={()=>setConfirm('submit')}>Submit draft</Button>}{r.canCancel&&<Button color="inherit" onClick={()=>setConfirm('cancel')}>Cancel request</Button>}</Stack></>}
 {confirm&&<Alert severity="warning" action={<Stack direction="row"><Button disabled={act.isPending} onClick={()=>act.mutate()}>Confirm {confirm}</Button><Button disabled={act.isPending} onClick={()=>setConfirm('')}>Back</Button></Stack>}>{confirm==='approve'?'Apply the requested change and approve this request?':confirm==='reject'?'Reject this request without applying changes?':confirm==='submit'?'Submit this draft for approval?':'Cancel this request?'}</Alert>}
 {act.isError&&<Alert severity="error">{errorText(act.error)}</Alert>}
 </Stack>}</DialogContent><DialogActions><Button disabled={act.isPending} onClick={onClose}>Close</Button></DialogActions></Dialog>;
}
