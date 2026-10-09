import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Stack, Typography, Autocomplete } from '@mui/material';
import { workflowApi, workflowTypes, label, type WorkflowType, type RecordOption } from '../../api/workflowApi';
import { useAuth } from '../../hooks/useAuth';
import axios from 'axios';
export const errorText=(e:unknown)=>{if(axios.isAxiosError(e)){const d=e.response?.data?.detail;return typeof d==='string'?d:Array.isArray(d)?d.map(x=>x.msg).join('; '):e.message;}return e instanceof Error?e.message:'Request failed. Please retry.';};
export default function WorkflowRequestForm({open,onClose,onCreated,initialType='STOCK_ADJUSTMENT'}:{open:boolean;onClose:()=>void;onCreated?:(id:string)=>void;initialType?:WorkflowType}){
 const {user}=useAuth(); const qc=useQueryClient();const [type,setType]=useState<WorkflowType>(initialType);const [record,setRecord]=useState<RecordOption|null>(null);const [search,setSearch]=useState('');
 const [value,setValue]=useState('');const [field,setField]=useState('full_name');const [reason,setReason]=useState('');const [priority,setPriority]=useState('MEDIUM');
 const options=useQuery({queryKey:['workflow-options',user?.companyId,type,search],queryFn:()=>workflowApi.options(type,search),enabled:open});
 const configs=useQuery({queryKey:['workflow-config',user?.companyId,user?.id],queryFn:workflowApi.config,enabled:open});
 const config=configs.data?.find(c=>c.requestType===type);
 const admin=['COMPANY_ADMIN','SUPER_ADMIN'].includes(user?.role??'');
 const unavailable=!!config?.approvalRequired&&config.eligibleApproverCount===0;
 const setup=useMutation({mutationFn:async()=>{
  if(!config)throw new Error('Workflow configuration is unavailable.');
  await workflowApi.saveConfig({...config,allowSelfApproval:true});
 },onSuccess:async()=>{await qc.invalidateQueries({queryKey:['workflow-config']});save.reset();}});
 const save=useMutation({mutationFn:(draft:boolean)=>{
  if(!record)throw new Error('Select a related record.');if(reason.trim().length<3)throw new Error('Provide a meaningful reason.');
  const changes:Record<string,unknown>=type==='STOCK_ADJUSTMENT'?{stock_quantity:Number(value)}:type==='PRODUCT_PRICE_CHANGE'?{unit_price:value}:type==='PRODUCT_DEACTIVATION'?{status:'INACTIVE'}:type==='INVENTORY_IMPORT_APPROVAL'?{release_import:true}:{[field]:value};
  if(['STOCK_ADJUSTMENT','PRODUCT_PRICE_CHANGE'].includes(type)&&value.trim()==='')throw new Error('Enter the requested value.');
  return workflowApi.create({request_type:type,related_id:record.id,requested_values:changes,reason,priority,draft});
 },onSuccess:r=>{void qc.invalidateQueries();onClose();onCreated?.(r.id);}});
 const busy=setup.isPending||save.isPending;
 const current=record?.values[type==='STOCK_ADJUSTMENT'?'stock_quantity':type==='PRODUCT_PRICE_CHANGE'?'unit_price':field];
 return <Dialog open={open} onClose={busy?undefined:onClose} fullWidth maxWidth="sm"><DialogTitle>Create approval request</DialogTitle><DialogContent><Stack spacing={2} sx={{pt:1}}>
 <Alert severity="info">Changes are applied after approval. Inventory import approval releases the staged file to processing.</Alert>
 <TextField select label="Request type" value={type} onChange={e=>{setType(e.target.value as WorkflowType);setRecord(null);setValue('');setSearch('');save.reset();setup.reset();}}>{workflowTypes.map(t=><MenuItem key={t} value={t}>{label(t)}</MenuItem>)}</TextField>
 <Autocomplete options={options.data??[]} value={record} loading={options.isPending} getOptionLabel={o=>o.label} isOptionEqualToValue={(a,b)=>a.id===b.id} onChange={(_,v)=>setRecord(v)} onInputChange={(_,v,why)=>{if(why==='input')setSearch(v);}} renderInput={p=><TextField {...p} label="Related record" required />} />
 {options.isError&&<Alert severity="error">{errorText(options.error)}</Alert>}
 {type==='INVENTORY_IMPORT_APPROVAL'&&<Typography variant="body2">Upload an inventory CSV in Data Imports first. Its approval request is created automatically.</Typography>}
 {type==='CUSTOMER_INFORMATION_CHANGE'&&<TextField select label="Field to change" value={field} onChange={e=>{setField(e.target.value);setValue('');}}>{['full_name','email','phone','gender','date_of_birth','address','city','state','country','customer_type','preferred_sales_channel','status'].map(f=><MenuItem key={f} value={f}>{label(f)}</MenuItem>)}</TextField>}
 {record&&<Typography variant="body2">Current value: {String(current??record.values.status??'—')}</Typography>}
 {!['PRODUCT_DEACTIVATION','INVENTORY_IMPORT_APPROVAL'].includes(type)&&<TextField label={type==='STOCK_ADJUSTMENT'?'Requested stock':type==='PRODUCT_PRICE_CHANGE'?'Requested price':'Requested value'} required value={value} onChange={e=>setValue(e.target.value)} type={['STOCK_ADJUSTMENT','PRODUCT_PRICE_CHANGE'].includes(type)?'number':field==='date_of_birth'?'date':'text'} />}
 {type==='STOCK_ADJUSTMENT'&&value!==''&&record&&<Alert severity="success">Difference: {Number(value)-Number(current)>=0?'+':''}{Number(value)-Number(current)}</Alert>}
 <TextField label="Reason for request" required multiline minRows={3} value={reason} onChange={e=>setReason(e.target.value)} />
 <TextField select label="Priority" value={priority} onChange={e=>setPriority(e.target.value)}>{['LOW','MEDIUM','HIGH','CRITICAL'].map(p=><MenuItem key={p} value={p}>{label(p)}</MenuItem>)}</TextField>
 {configs.data?.find(c=>c.requestType===type)?.active===false&&<Alert severity="warning">This workflow is inactive. Contact your administrator.</Alert>}
 {configs.isError&&<Alert severity="error" action={<Button onClick={()=>void configs.refetch()}>Retry</Button>}>{errorText(configs.error)}</Alert>}
 {unavailable&&<Alert severity="warning"><Typography variant="body2">No other active approver is available for this request. Add an active company administrator or configure an approver in Workflows → Configuration.{admin?' You can also explicitly enable self approval for this request type.':' Ask a company administrator to update the workflow.'}</Typography>{admin&&!config?.allowSelfApproval&&<Button disabled={busy} onClick={()=>setup.mutate()}>Enable self approval for {label(type)}</Button>}</Alert>}
 {setup.isError&&<Alert severity="error">{errorText(setup.error)}</Alert>}
 {setup.isSuccess&&!unavailable&&<Alert severity="success">Self approval is enabled for {label(type)}. Submit your request, then approve it in the approval queue.</Alert>}
 {save.isError&&<Alert severity="error">{errorText(save.error)}</Alert>}
 </Stack></DialogContent><DialogActions><Button onClick={onClose} disabled={busy||config?.active===false}>Cancel</Button><Button onClick={()=>save.mutate(true)} disabled={busy||config?.active===false}>Save draft</Button><Button variant="contained" onClick={()=>save.mutate(false)} disabled={busy||configs.isPending||configs.isError||unavailable||config?.active===false}>Submit for approval</Button></DialogActions></Dialog>;
}
