import api from './axiosInstance';
export const workflowTypes = ['STOCK_ADJUSTMENT','PRODUCT_DEACTIVATION','PRODUCT_PRICE_CHANGE','CUSTOMER_INFORMATION_CHANGE','INVENTORY_IMPORT_APPROVAL'] as const;
export type WorkflowType = typeof workflowTypes[number];
export const label = (s: string) => s.toLowerCase().replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
export interface WorkflowRequest { id:string; requestType:WorkflowType; requestedBy:string; requesterId:string; companyId:string; relatedId:string; relatedRecord:string; currentValues:Record<string,unknown>; requestedValues:Record<string,unknown>; reason:string; priority:string; status:string; createdAt:string; updatedAt:string; approverRole:string; canApprove:boolean; canSubmit:boolean; canCancel:boolean }
export interface WorkflowConfig { requestType:WorkflowType; approverRole:string; approvalRequired:boolean; active:boolean; allowSelfApproval:boolean; eligibleApproverCount:number }
export interface History { id:string; action:string; actor:string; fromStatus:string|null; toStatus:string; comment:string|null; timestamp:string }
export interface RecordOption { id:string; label:string; values:Record<string,unknown> }
export interface RequestWrite { request_type:WorkflowType; related_id:string; requested_values:Record<string,unknown>; reason:string; priority:string; draft:boolean }
export const workflowApi={
 list:async(params:Record<string,unknown>):Promise<{items:WorkflowRequest[];total:number}> => (await api.get('/workflows',{params})).data,
 counts:async():Promise<Record<string,number|Record<string,number>>> => (await api.get('/workflows/counts')).data,
 detail:async(id:string):Promise<WorkflowRequest> => (await api.get('/workflows/'+id)).data,
 history:async(id:string):Promise<History[]> => (await api.get('/workflows/'+id+'/history')).data,
 config:async():Promise<WorkflowConfig[]> => (await api.get('/workflows/config')).data,
 options:async(kind:string,search=''):Promise<RecordOption[]> => (await api.get('/workflows/options',{params:{kind,search}})).data,
 create:async(body:RequestWrite):Promise<WorkflowRequest> => (await api.post('/workflows',body)).data,
 action:async(id:string,action:string,comment?:string):Promise<WorkflowRequest> => (await api.post('/workflows/'+id+'/'+action,{comment})).data,
 saveConfig:async(c:WorkflowConfig) => api.put('/workflows/config/'+c.requestType,{approver_role:c.approverRole,approval_required:c.approvalRequired,active:c.active,allow_self_approval:c.allowSelfApproval}),
};
