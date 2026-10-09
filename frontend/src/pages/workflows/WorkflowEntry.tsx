import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Alert, Button } from '@mui/material';
import { useAuth } from '../../hooks/useAuth';
import WorkflowRequestForm from './WorkflowRequestForm';
import type { WorkflowType } from '../../api/workflowApi';
export default function WorkflowEntry(){
 const {pathname}=useLocation();const navigate=useNavigate();const {user}=useAuth();const [open,setOpen]=useState(false);
 const type:WorkflowType|undefined=pathname==='/inventory'?'STOCK_ADJUSTMENT':pathname==='/products'?'PRODUCT_PRICE_CHANGE':pathname==='/customers'?'CUSTOMER_INFORMATION_CHANGE':undefined;
 if(!type||user?.role==='VIEWER')return null;
 return <><Alert severity="info" sx={{mb:2}} action={<Button onClick={()=>setOpen(true)}>Request change</Button>}>Submit changes requiring authorization through Workflows. Original values remain in place until approval.</Alert>{open&&<WorkflowRequestForm key={type} open onClose={()=>setOpen(false)} initialType={type} onCreated={id=>navigate('/workflows?request='+id)}/>}</>;
}
