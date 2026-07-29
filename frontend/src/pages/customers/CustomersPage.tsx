import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, MenuItem, Pagination, Skeleton, TextField, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditIcon from "@mui/icons-material/EditOutlined";
import DownloadIcon from "@mui/icons-material/DownloadOutlined";
import PeopleIcon from "@mui/icons-material/PeopleOutlined";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/VisibilityOutlined";
import FilterIcon from "@mui/icons-material/FilterAltOutlined";
import SearchOffIcon from "@mui/icons-material/SearchOffOutlined";
import toast from "react-hot-toast";
import { createPdfReport } from "../../utils/createPdfReport";
import { useAuth } from "../../hooks/useAuth";
import { createCustomer, deleteCustomer, getCustomerAnalytics, getCustomers, logCustomerExport, updateCustomer, type Customer, type CustomerAnalytics, type CustomerInput } from "../../api/customerApi";
import "./CustomersPage.css";
import "./CustomersAnalyticsLayout.css";

const empty:CustomerInput={fullName:"",email:"",phone:"",gender:"",dateOfBirth:"",address:"",city:"",state:"",country:"",customerType:"RETAIL",preferredSalesChannel:"RETAIL_STORE",status:"ACTIVE"};
const money=(n:number)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2}).format(n);
const date=(value?:string)=>value?new Intl.DateTimeFormat("en-IN",{dateStyle:"medium"}).format(new Date(value)):"—";
const title=(value:string)=>value.replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase());
type CustomerIssue={title:string;message:string;severity:"error"|"warning"};
function CustomerError({issue,onClose,onRetry}:{issue:CustomerIssue;onClose?:()=>void;onRetry?:()=>void}){
  return <Alert severity={issue.severity} className="customer-error-alert" onClose={onClose} action={onRetry?<Button size="small" variant="outlined" onClick={onRetry}>Retry</Button>:undefined}><strong>{issue.title}</strong><span>{issue.message}</span></Alert>;
}
type CustomerSegment="vip"|"loyal"|"regular"|"new";
const segmentKey=(value:string):CustomerSegment=>{
  const key=value.split(" ")[0].toLowerCase();
  return (["vip","loyal","regular","new"].includes(key)?key:"new") as CustomerSegment;
};
const segmentLabels:Record<CustomerSegment,string>={vip:"VIP",loyal:"Loyal",regular:"Regular",new:"New"};
function SegmentBadge({segment}:{segment:string}){
  const key=segmentKey(segment);
  return <span className={`customer-segment-badge customer-segment-badge--${key}`}>{segmentLabels[key]}</span>;
}
function CustomerSegmentGuide(){
  const items:[CustomerSegment,string,string][]=[
    ["vip","VIP Customers","High value customers"],
    ["loyal","Loyal Customers","Frequent purchasers"],
    ["regular","Regular Customers","Consistent shoppers"],
    ["new","New Customers","Recently joined"],
  ];
  return <Box className="customer-segment-guide"><Typography component="h3">Customer Segment Badges</Typography><Box>{items.map(([key,label,description])=><Box key={key}><SegmentBadge segment={key}/><span><strong>{label}</strong><small>{description}</small></span></Box>)}</Box></Box>;
}
function CustomerLoadingState(){
  return <Box className="customer-loading-state" aria-label="Loading customers">
    {Array.from({length:5},(_,index)=><Box key={index}>{Array.from({length:8},(_,cell)=><Skeleton key={cell} variant="rounded" height={18}/>)}</Box>)}
  </Box>;
}
const customerIssueFromError=(error:any):CustomerIssue=>{
  const detail=error?.response?.data?.detail;
  const message=Array.isArray(detail)
    ? detail.map((item:any)=>item?.msg).filter(Boolean).join(" ")
    : String(detail||"Something went wrong while processing the customer request.");
  const normalized=message.toLowerCase();
  if(normalized.includes("email")&&normalized.includes("already"))
    return {title:"Duplicate Email",message:"A customer with this email already exists.",severity:"error"};
  if(normalized.includes("phone")&&normalized.includes("already"))
    return {title:"Duplicate Phone Number",message:"A customer with this phone number already exists.",severity:"error"};
  if(error?.response?.status===422)
    return {title:"Validation Error",message:message||"Please fill all required fields correctly.",severity:"warning"};
  return {title:"Failed API Request",message, severity:"error"};
};

function MiniBars({data,moneyValue=false}:{data:{name:string;value:number}[];moneyValue?:boolean}){
  const max=Math.max(1,...data.map(x=>x.value));
  return <Box className="customer-bars">{data.length?data.map((x,i)=><Box className="customer-bar-row" key={`${x.name}-${i}`}><span title={x.name}>{title(x.name)}</span><Box><i style={{width:`${Math.max(4,x.value/max*100)}%`}}/></Box><b>{moneyValue?money(x.value):x.value.toLocaleString()}</b></Box>):<Typography>No customer data yet.</Typography>}</Box>
}
function Donut({data,centerLabel="Total",moneyTotal=false}:{data:{name:string;value:number}[];centerLabel?:string;moneyTotal?:boolean}){
  const colors=["#2563eb","#10b981","#f59e0b","#7c3aed"],total=data.reduce((s,x)=>s+x.value,0);let cursor=0;
  const gradient=data.map((x,i)=>{const start=cursor;cursor+=total?x.value/total*100:0;return `${colors[i%colors.length]} ${start}% ${cursor}%`}).join(",");
  return <Box className="customer-donut-wrap"><Box className="customer-donut" style={{background:gradient?`conic-gradient(${gradient})`:"#e8edf5"}}><span><b>{moneyTotal?money(total):total.toLocaleString()}</b>{centerLabel}</span></Box><Box>{data.map((x,i)=><p key={x.name}><i style={{background:colors[i%colors.length]}}/><span>{title(x.name)}</span><b>{moneyTotal?money(x.value):x.value.toLocaleString()} <small>({total?(x.value/total*100).toFixed(1):0}%)</small></b></p>)}</Box></Box>
}
function GrowthLine({data}:{data:{name:string;value:number}[]}){
  const values=data.length?data:[{name:"No data",value:0}];
  const rawMax=Math.max(1,...values.map(x=>x.value));
  const axisMax=Math.max(4,Math.ceil(rawMax/4)*4);
  const left=42,right=344,top=18,bottom=174;
  const x=(index:number)=>values.length===1?(left+right)/2:left+index*((right-left)/(values.length-1));
  const y=(value:number)=>bottom-(value/axisMax)*(bottom-top);
  const points=values.map((item,index)=>`${x(index)},${y(item.value)}`).join(" ");
  const area=`${left},${bottom} ${points} ${right},${bottom}`;
  const ticks=[axisMax,axisMax*.75,axisMax*.5,axisMax*.25,0];
  const tickLabel=(value:number)=>value>=1000?`${(value/1000).toFixed(value%1000?1:0)}K`:Math.round(value).toString();
  return <Box className="growth-chart"><svg viewBox="0 0 360 215" role="img" aria-label="Customer growth line chart">
    <g className="growth-grid">{ticks.map((tick,index)=><g key={tick}><line x1={left} y1={top+index*((bottom-top)/4)} x2={right} y2={top+index*((bottom-top)/4)}/><text x="34" y={top+index*((bottom-top)/4)+4}>{tickLabel(tick)}</text></g>)}{values.map((item,index)=><line key={item.name} x1={x(index)} y1={top} x2={x(index)} y2={bottom}/>)}</g>
    <polygon className="growth-area" points={area}/>
    <polyline className="growth-line" points={points}/>
    {values.map((item,index)=><g key={item.name}><circle className="growth-point-halo" cx={x(index)} cy={y(item.value)} r="5"/><circle className="growth-point" cx={x(index)} cy={y(item.value)} r="3.4"/><text className="growth-label" x={x(index)} y="201">{item.name}</text></g>)}
  </svg></Box>
}
function LocationMap({data}:{data:{name:string;value:number}[]}){
  const max=Math.max(1,...data.map(x=>x.value));
  const ranked=[...data].sort((a,b)=>b.value-a.value).slice(0,8);
  return <Box className="location-ranking">{ranked.length?ranked.map((item,index)=><Box className="location-ranking__row" key={item.name}><span className="location-ranking__rank">{index+1}</span><span className="location-ranking__name">{item.name}</span><Box className="location-ranking__track"><i style={{width:`${Math.max(7,item.value/max*100)}%`}}/></Box><b>{item.value}</b></Box>):<Typography>No customer locations available.</Typography>}</Box>
}
function CustomerForm({open,customer,issue,onClose,onSave,onValidationError}:{open:boolean;customer?:Customer;issue:CustomerIssue|null;onClose:()=>void;onSave:(v:CustomerInput)=>void;onValidationError:(issue:CustomerIssue)=>void}){
  const [form,setForm]=useState<CustomerInput>(empty);
  useEffect(()=>setForm(customer?{fullName:customer.fullName,email:customer.email,phone:customer.phone,gender:customer.gender||"",dateOfBirth:customer.dateOfBirth||"",address:customer.address||"",city:customer.city||"",state:customer.state||"",country:customer.country||"",customerType:customer.customerType,preferredSalesChannel:customer.preferredSalesChannel||"",status:customer.status}:empty),[customer,open]);
  const set=(key:keyof CustomerInput,value:string)=>setForm(v=>({...v,[key]:value}));
  const submit=()=>{
    if(!form.fullName.trim()||!form.email.trim()||!form.phone.trim()){
      onValidationError({title:"Validation Error",message:"Please fill all required fields correctly.",severity:"warning"});return;
    }
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)){
      onValidationError({title:"Validation Error",message:"Enter a valid customer email address.",severity:"warning"});return;
    }
    if(form.phone.trim().length<7){
      onValidationError({title:"Validation Error",message:"Phone number must contain at least 7 characters.",severity:"warning"});return;
    }
    onSave(form);
  };
  return <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth><DialogTitle>{customer?"Edit customer":"Add new customer"}</DialogTitle><DialogContent className="customer-form">
    {issue&&<CustomerError issue={issue}/>}
    <TextField required label="Full name" value={form.fullName} onChange={e=>set("fullName",e.target.value)}/><TextField required type="email" label="Email" value={form.email} onChange={e=>set("email",e.target.value)}/>
    <TextField required label="Phone" value={form.phone} onChange={e=>set("phone",e.target.value)}/><TextField select label="Customer type" value={form.customerType} onChange={e=>set("customerType",e.target.value)}>{["RETAIL","WHOLESALE","CORPORATE"].map(x=><MenuItem key={x} value={x}>{title(x)}</MenuItem>)}</TextField>
    <TextField select label="Status" value={form.status} onChange={e=>set("status",e.target.value)}>{["ACTIVE","INACTIVE"].map(x=><MenuItem key={x} value={x}>{title(x)}</MenuItem>)}</TextField><TextField select label="Gender" value={form.gender} onChange={e=>set("gender",e.target.value)}><MenuItem value="">Not specified</MenuItem>{["Male","Female","Other"].map(x=><MenuItem key={x} value={x}>{x}</MenuItem>)}</TextField>
    <TextField type="date" label="Date of birth" value={form.dateOfBirth} onChange={e=>set("dateOfBirth",e.target.value)} slotProps={{inputLabel:{shrink:true}}}/><TextField select label="Preferred channel" value={form.preferredSalesChannel} onChange={e=>set("preferredSalesChannel",e.target.value)}>{["RETAIL_STORE","ONLINE_STORE","MARKETPLACE"].map(x=><MenuItem key={x} value={x}>{title(x)}</MenuItem>)}</TextField>
    <TextField label="Address" value={form.address} onChange={e=>set("address",e.target.value)}/><TextField label="City" value={form.city} onChange={e=>set("city",e.target.value)}/><TextField label="State" value={form.state} onChange={e=>set("state",e.target.value)}/><TextField label="Country" value={form.country} onChange={e=>set("country",e.target.value)}/>
  </DialogContent><DialogActions><Button onClick={onClose}>Cancel</Button><Button variant="contained" onClick={submit}>Save customer</Button></DialogActions></Dialog>
}
function Profile({customer,full=false}:{customer:Customer;full?:boolean}){
  const s=customer.summary;
  return <Box className={full?"customer-profile customer-profile--full":"customer-profile"}>
    <Box className="customer-profile-head"><span className="customer-avatar">{customer.fullName.split(" ").map(x=>x[0]).slice(0,2).join("")}</span><Box><h3>{customer.fullName}</h3><small>{customer.customerId}</small><div><Chip size="small" color={customer.status==="ACTIVE"?"success":"default"} label={title(customer.status)}/><SegmentBadge segment={customer.segment}/></div></Box></Box>
    <section><h4>Personal & Contact Information</h4><p>✉ {customer.email}</p><p>☎ {customer.phone}</p><p>⌖ {[customer.address,customer.city,customer.state,customer.country].filter(Boolean).join(", ")||"No address added"}</p>{full&&<><p>Date of birth <b>{date(customer.dateOfBirth)}</b></p><p>Gender <b>{customer.gender||"—"}</b></p><p>Customer type <b>{title(customer.customerType)}</b></p></>}</section>
    <section><h4>Business Information</h4><dl><div><dt>Lifetime Revenue</dt><dd>{money(s.totalRevenue)}</dd></div><div><dt>Total Orders</dt><dd>{s.totalOrders}</dd></div><div><dt>Average Order Value</dt><dd>{money(s.averageOrderValue)}</dd></div><div><dt>Purchase Frequency</dt><dd>{Number(s.purchaseFrequency).toFixed(1)} / month</dd></div><div><dt>Last Purchase</dt><dd>{date(s.lastPurchaseDate)}</dd></div>{full&&<><div><dt>Favorite Category</dt><dd>{s.favoriteCategory||"—"}</dd></div><div><dt>Favorite Product</dt><dd>{s.favoriteProduct||"—"}</dd></div></>}</dl></section>
  </Box>
}
type HistoryView="profile"|"purchase-history"|"recent-activity"|"purchase-summary"|"recent-transactions"|"most-purchased-products"|"timeline"|"notes";
function PurchaseSummaryView({customer}:{customer:Customer}){
  const s=customer.summary;
  return <Box className="purchase-summary history-card"><h2>Purchase Summary</h2><Box>{[["Total Orders",s.totalOrders],["Total Revenue",money(s.totalRevenue)],["Total Quantity",s.totalProductsPurchased],["Average Order Value",money(s.averageOrderValue)],["First Purchase",date(s.firstPurchaseDate)],["Last Purchase",date(s.lastPurchaseDate)]].map(([label,value])=><article key={String(label)}><span>{label}</span><strong>{value}</strong></article>)}</Box></Box>
}
function TransactionsView({customer}:{customer:Customer}){
  const transactions=customer.recentTransactions??[];
  return <Box className="history-card transaction-view"><h2>Recent Transactions</h2>{transactions.length?<table><thead><tr><th>Invoice</th><th>Date</th><th>Channel</th><th>Payment</th><th>Amount</th></tr></thead><tbody>{transactions.map(item=><tr key={item.id}><td>{item.invoiceNumber}</td><td>{date(item.saleDate)}</td><td>{title(item.salesChannel)}</td><td>{title(item.paymentMethod)}</td><td><b>{money(item.totalAmount)}</b></td></tr>)}</tbody></table>:<Box className="customer-empty">No transactions recorded for this customer.</Box>}</Box>
}
function ProductsView({customer}:{customer:Customer}){
  const products=customer.mostPurchasedProducts??[];
  return <Box className="history-card product-view"><h2>Most Purchased Products</h2>{products.length?products.map((item,index)=><Box key={item.productName}><span className="product-rank">{index+1}</span><strong>{item.productName}</strong><span>{item.quantity} units</span><b>{item.purchaseCount} orders</b></Box>):<Box className="customer-empty">No purchased products recorded.</Box>}</Box>
}
function TimelineView({customer}:{customer:Customer}){
  const timeline=customer.timeline??[];
  return <Box className="timeline history-card"><h2>Customer Timeline</h2>{timeline.length?timeline.map(item=><article key={item.id}><i/><time>{date(item.occurredAt)}</time><div><b>{item.event}</b><p>{item.details}</p></div></article>):<Box className="customer-empty">No timeline activity available.</Box>}</Box>
}
function NotesView({customer}:{customer:Customer}){
  const storageKey=`customer-notes-${customer.id}`;
  const [notes,setNotes]=useState(()=>localStorage.getItem(storageKey)||"");
  useEffect(()=>setNotes(localStorage.getItem(storageKey)||""),[storageKey]);
  return <Box className="history-card notes-view"><h2>Customer Notes</h2><TextField multiline minRows={8} fullWidth placeholder="Add notes about this customer..." value={notes} onChange={event=>setNotes(event.target.value)}/><Button variant="contained" onClick={()=>{localStorage.setItem(storageKey,notes);toast.success("Customer notes saved")}}>Save Notes</Button></Box>
}
function HistoryViewContent({customer,view}:{customer:Customer;view:HistoryView}){
  if(view==="profile")return <Profile customer={customer} full/>;
  if(view==="purchase-summary")return <PurchaseSummaryView customer={customer}/>;
  if(view==="recent-transactions")return <TransactionsView customer={customer}/>;
  if(view==="most-purchased-products")return <ProductsView customer={customer}/>;
  if(view==="timeline")return <TimelineView customer={customer}/>;
  if(view==="notes")return <NotesView customer={customer}/>;
  if(view==="recent-activity")return <Box className="history-view-stack"><TransactionsView customer={customer}/><TimelineView customer={customer}/></Box>;
  return <Box className="history-view-stack"><PurchaseSummaryView customer={customer}/><Box className="history-two-column"><ProductsView customer={customer}/><TransactionsView customer={customer}/></Box></Box>;
}
function Analytics({data,customers}:{data?:CustomerAnalytics;customers:Customer[]}){
  const [growthPeriod,setGrowthPeriod]=useState<"day"|"month"|"year">("month");
  const [comparisonPeriod,setComparisonPeriod]=useState<"day"|"month"|"year">("month");
  const [topRevenuePeriod,setTopRevenuePeriod]=useState<"day"|"month"|"year">("month");
  if(!data)return <Box className="customer-empty">Loading analytics…</Box>;
  const k=[["Total Customers",data.kpis.totalCustomers],["Active Customers",data.kpis.activeCustomers],["New Customers (This Month)",data.kpis.newCustomers],["Returning Customers",data.kpis.returningCustomers],["Average Customer Spend",money(data.kpis.averageCustomerSpend)],["Total Revenue Generated",money(data.kpis.totalRevenue)],["Average Purchase Frequency",`${data.kpis.averagePurchaseFrequency.toFixed(1)} / Month`]];
  const now=new Date();
  const growthBuckets=(()=>{
    if(growthPeriod==="day")return Array.from({length:7},(_,offset)=>{const d=new Date(now);d.setDate(now.getDate()-(6-offset));return {name:d.toLocaleDateString("en-IN",{weekday:"short"}),year:d.getFullYear(),month:d.getMonth(),day:d.getDate()}});
    if(growthPeriod==="year")return Array.from({length:5},(_,offset)=>{const year=now.getFullYear()-(4-offset);return {name:String(year),year,month:-1,day:-1}});
    return Array.from({length:6},(_,offset)=>{const d=new Date(now.getFullYear(),now.getMonth()-(5-offset),1);return {name:d.toLocaleDateString("en-IN",{month:"short"}),year:d.getFullYear(),month:d.getMonth(),day:-1}});
  })();
  const growthData=growthBuckets.map(bucket=>({name:bucket.name,value:customers.filter(customer=>{const d=new Date(customer.createdAt);return d.getFullYear()===bucket.year&&(bucket.month<0||d.getMonth()===bucket.month)&&(bucket.day<0||d.getDate()===bucket.day)}).length}));
  const isInComparisonPeriod=(value?:string)=>{
    if(!value)return false;const d=new Date(value);
    if(comparisonPeriod==="day")return d.toDateString()===now.toDateString();
    if(comparisonPeriod==="year")return d.getFullYear()===now.getFullYear();
    return d.getFullYear()===now.getFullYear()&&d.getMonth()===now.getMonth();
  };
  const comparisonData=[
    {name:"New Customers",value:customers.filter(customer=>isInComparisonPeriod(customer.createdAt)).length},
    {name:"Returning Customers",value:customers.filter(customer=>customer.summary.totalOrders>1&&isInComparisonPeriod(customer.summary.lastPurchaseDate)).length},
  ];
  const frequency=[{name:"0-1",value:customers.filter(x=>x.summary.totalOrders<=1).length},{name:"2-3",value:customers.filter(x=>x.summary.totalOrders>=2&&x.summary.totalOrders<=3).length},{name:"4-6",value:customers.filter(x=>x.summary.totalOrders>=4&&x.summary.totalOrders<=6).length},{name:"7-10",value:customers.filter(x=>x.summary.totalOrders>=7&&x.summary.totalOrders<=10).length},{name:"11+",value:customers.filter(x=>x.summary.totalOrders>=11).length}];
  const spending=[{name:"₹0 - ₹1K",value:customers.filter(x=>x.summary.totalRevenue<=1000).length},{name:"₹1K - ₹5K",value:customers.filter(x=>x.summary.totalRevenue>1000&&x.summary.totalRevenue<=5000).length},{name:"₹5K - ₹10K",value:customers.filter(x=>x.summary.totalRevenue>5000&&x.summary.totalRevenue<=10000).length},{name:"₹10K+",value:customers.filter(x=>x.summary.totalRevenue>10000).length}];
  return <><Box className="customer-kpis">{k.map(([label,value])=><Box key={String(label)}><span>{label}</span><strong>{value}</strong><small>↗ Live company data</small></Box>)}</Box><Box className="customer-charts customer-charts--reference">
    <article><Box className="chart-title"><h3>Customer Growth Trend</h3><select aria-label="Customer growth period" value={growthPeriod} onChange={event=>setGrowthPeriod(event.target.value as "day"|"month"|"year")}><option value="day">Last 7 Days</option><option value="month">Last 6 Months</option><option value="year">Last 5 Years</option></select></Box><GrowthLine data={growthData}/></article>
    <article><Box className="chart-title"><h3>New vs Returning Customers</h3><select aria-label="Customer comparison period" value={comparisonPeriod} onChange={event=>setComparisonPeriod(event.target.value as "day"|"month"|"year")}><option value="day">Today</option><option value="month">This Month</option><option value="year">This Year</option></select></Box><Donut data={comparisonData} centerLabel="Total Customers"/></article>
    <article><h3>Revenue by Customer Type</h3><Donut data={data.revenueByType} centerLabel="Total Revenue" moneyTotal/></article>
    <article><Box className="chart-title"><h3>Top 10 Customers by Revenue</h3><select aria-label="Top customer revenue period" value={topRevenuePeriod} onChange={event=>setTopRevenuePeriod(event.target.value as "day"|"month"|"year")}><option value="day">Today</option><option value="month">This Month</option><option value="year">This Year</option></select></Box><MiniBars data={data.topCustomersByPeriod?.[topRevenuePeriod]??data.topCustomers} moneyValue/></article>
    <article><h3>Customer Purchase Frequency</h3><MiniBars data={frequency}/></article>
    <article><h3>Customer Distribution by Location</h3><LocationMap data={data.locations}/></article>
    <article><h3>Monthly Customer Acquisition</h3><MiniBars data={data.acquisition.slice(-6)}/></article>
    <article><h3>Customer Spending Distribution</h3><Donut data={spending} centerLabel="Total Customers"/></article>
    <article><h3>Customer Segmentation</h3><Donut data={data.segments} centerLabel="Total Customers"/></article>
  </Box></>
}

export default function CustomersPage(){
  const {user}=useAuth(),qc=useQueryClient(),editable=user?.role!=="VIEWER";
  const [tab,setTab]=useState<"customers"|"analytics"|"history">("customers"),[historyView,setHistoryView]=useState<HistoryView>("profile"),[search,setSearch]=useState(""),[type,setType]=useState(""),[status,setStatus]=useState(""),[city,setCity]=useState(""),[country,setCountry]=useState(""),[page,setPage]=useState(1),[selected,setSelected]=useState<Customer>(),[editing,setEditing]=useState<Customer|undefined>(),[formOpen,setFormOpen]=useState(false);
  const [customerIssue,setCustomerIssue]=useState<CustomerIssue|null>(null);
  const sort="name";
  const pageSize=5;
  const customers=useQuery({queryKey:["customers-v2",search,type,status,sort],queryFn:()=>getCustomers({search:search||undefined,customerType:type||undefined,status:status||undefined,sort})});
  const analytics=useQuery({queryKey:["customer-analytics"],queryFn:getCustomerAnalytics});
  useEffect(()=>{if(customers.data?.items.length&&!selected)setSelected(customers.data.items[0])},[customers.data,selected]);
  const refresh=()=>{qc.invalidateQueries({queryKey:["customers-v2"]});qc.invalidateQueries({queryKey:["customer-analytics"]});qc.invalidateQueries({queryKey:["audit-logs"]});qc.invalidateQueries({queryKey:["customer-notifications"]})};
  const save=useMutation({mutationFn:(v:CustomerInput)=>editing?updateCustomer(editing.id,v):createCustomer(v),onSuccess:(v)=>{setCustomerIssue(null);toast.success(editing?"Customer updated":"Customer registered");setSelected(v);setFormOpen(false);setEditing(undefined);refresh()},onError:(e:any)=>setCustomerIssue(customerIssueFromError(e))});
  const remove=useMutation({mutationFn:deleteCustomer,onSuccess:()=>{setCustomerIssue(null);toast.success("Customer deleted");setSelected(undefined);refresh()},onError:(e:any)=>setCustomerIssue(customerIssueFromError(e))});
  const exportReport=async(kind:"customers"|"analytics"|"history",format:"CSV"|"PDF")=>{
    const selectedCustomer=customers.data?.items.find(x=>x.id===selected?.id)||selected;
    const rows=kind==="history"&&selectedCustomer?[selectedCustomer]:(customers.data?.items||[]);
    await logCustomerExport(`${title(kind)} (${format})`);
    qc.invalidateQueries({queryKey:["audit-logs"]});
    let csv="";
    let lines:string[]=[];
    if(kind==="analytics"&&analytics.data){
      const k=analytics.data.kpis;
      csv=`Metric,Value\nTotal Customers,${k.totalCustomers}\nActive Customers,${k.activeCustomers}\nNew Customers,${k.newCustomers}\nReturning Customers,${k.returningCustomers}\nAverage Customer Spend,${k.averageCustomerSpend}\nTotal Revenue,${k.totalRevenue}\nAverage Purchase Frequency,${k.averagePurchaseFrequency}`;
      lines=[`Total Customers: ${k.totalCustomers}`,`Active Customers: ${k.activeCustomers}`,`New Customers: ${k.newCustomers}`,`Returning Customers: ${k.returningCustomers}`,`Average Customer Spend: ${money(k.averageCustomerSpend)}`,`Total Revenue: ${money(k.totalRevenue)}`,`Average Purchase Frequency: ${k.averagePurchaseFrequency.toFixed(2)} / month`];
    }else{
      csv="Customer ID,Name,Email,Phone,Type,Status,Segment,Total Orders,Total Spend\n"+rows.map(x=>[x.customerId,x.fullName,x.email,x.phone,x.customerType,x.status,x.segment,x.summary.totalOrders,x.summary.totalRevenue].map(v=>`"${String(v).replaceAll('"','""')}"`).join(",")).join("\n");
      lines=rows.map((x,i)=>`${i+1}. ${x.fullName} | ${x.customerId} | Orders: ${x.summary.totalOrders} | Revenue: ${money(x.summary.totalRevenue)} | ${x.segment}`);
      if(kind==="history"&&selectedCustomer)lines.push(...selectedCustomer.timeline.map(x=>`${date(x.occurredAt)} — ${x.event}${x.details?`: ${x.details}`:""}`));
    }
    if(format==="CSV"){
      const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download=`customer-${kind}.csv`;a.click();
    }else{
      const blob=createPdfReport(`Customer ${title(kind)} Report`,lines);const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`customer-${kind}.pdf`;a.click();
    }
    toast.success(`${title(kind)} ${format} downloaded`);
  };
  const current=useMemo(()=>customers.data?.items.find(x=>x.id===selected?.id)||selected,[customers.data,selected]);
  const allRows=customers.data?.items||[];
  const cities=useMemo(()=>[...new Set(allRows.map(x=>x.city).filter(Boolean) as string[])].sort(),[allRows]);
  const countries=useMemo(()=>[...new Set(allRows.map(x=>x.country).filter(Boolean) as string[])].sort(),[allRows]);
  const filteredRows=useMemo(()=>allRows.filter(x=>(!city||x.city===city)&&(!country||x.country===country)),[allRows,city,country]);
  const pageCount=Math.max(1,Math.ceil(filteredRows.length/pageSize));
  const visibleRows=filteredRows.slice((page-1)*pageSize,page*pageSize);
  useEffect(()=>setPage(1),[search,type,status,sort,city,country]);
  return <Box className="customers-page">
    <Box className="customers-heading"><Box><span><PeopleIcon/></span><div><h1>Customer Management</h1><p>Maintain customer profiles, purchase history and behaviour insights.</p></div></Box>{editable&&<Button variant="contained" startIcon={<AddIcon/>} onClick={()=>{setEditing(undefined);setFormOpen(true)}}>Add Customer</Button>}</Box>
    <Box className="customer-tabs">{(["customers","analytics","history"] as const).map(x=><button className={tab===x?"active":""} onClick={()=>setTab(x)} key={x}>{x==="history"?"History":title(x)}</button>)}</Box>
    {tab==="customers"&&<Box className="all-customers">
      <Typography component="h2">All Customers</Typography>
      <Box className="customer-toolbar">
        <label><SearchIcon/><input placeholder="Search by name, ID, email or phone..." value={search} onChange={e=>setSearch(e.target.value)}/></label>
        <TextField select size="small" value={type} onChange={e=>setType(e.target.value)} slotProps={{select:{displayEmpty:true,renderValue:value=>value?title(String(value)):"All Customer Types"}}}><MenuItem value="">All Customer Types</MenuItem>{["RETAIL","WHOLESALE","CORPORATE"].map(x=><MenuItem value={x} key={x}>{title(x)}</MenuItem>)}</TextField>
        <TextField select size="small" value={status} onChange={e=>setStatus(e.target.value)} slotProps={{select:{displayEmpty:true,renderValue:value=>value?title(String(value)):"All Status"}}}><MenuItem value="">All Status</MenuItem>{["ACTIVE","INACTIVE"].map(x=><MenuItem value={x} key={x}>{title(x)}</MenuItem>)}</TextField>
        <TextField select size="small" value={city} onChange={e=>setCity(e.target.value)} slotProps={{select:{displayEmpty:true,renderValue:value=>value?String(value):"All Cities"}}}><MenuItem value="">All Cities</MenuItem>{cities.map(x=><MenuItem value={x} key={x}>{x}</MenuItem>)}</TextField>
        <TextField select size="small" value={country} onChange={e=>setCountry(e.target.value)} slotProps={{select:{displayEmpty:true,renderValue:value=>value?String(value):"All Countries"}}}><MenuItem value="">All Countries</MenuItem>{countries.map(x=><MenuItem value={x} key={x}>{x}</MenuItem>)}</TextField>
        <Button variant="outlined" startIcon={<FilterIcon/>} onClick={()=>{setType("");setStatus("");setCity("");setCountry("")}}>Filters</Button>
        {editable&&<Box className="component-export"><Button variant="outlined" startIcon={<DownloadIcon/>} onClick={()=>exportReport("customers","CSV")}>CSV</Button><Button variant="outlined" startIcon={<DownloadIcon/>} onClick={()=>exportReport("customers","PDF")}>PDF</Button></Box>}
      </Box>
      {customerIssue&&<CustomerError issue={customerIssue} onClose={()=>setCustomerIssue(null)}/>}
      {customers.isError&&<CustomerError issue={{title:"Failed to Load Customers",message:"Something went wrong while fetching customers. Please try again.",severity:"error"}} onRetry={()=>customers.refetch()}/>}
      {customers.isLoading&&<CustomerLoadingState/>}
      {!customers.isLoading&&!customers.isError&&!allRows.length&&!search&&!type&&!status&&!city&&!country&&<Box className="customer-empty-state"><SearchOffIcon/><Typography component="h3">No Customers Found</Typography><Typography>There are no customers available. Add your first customer to get started.</Typography>{editable&&<Button variant="contained" startIcon={<AddIcon/>} onClick={()=>{setEditing(undefined);setCustomerIssue(null);setFormOpen(true)}}>Add Customer</Button>}</Box>}
      {!customers.isLoading&&!customers.isError&&!allRows.length&&Boolean(search||type||status||city||country)&&<Box className="customer-empty-state"><SearchOffIcon/><Typography component="h3">No Customers Match</Typography><Typography>Try clearing or changing the current search and filters.</Typography><Button variant="outlined" onClick={()=>{setSearch("");setType("");setStatus("");setCity("");setCountry("")}}>Clear Filters</Button></Box>}
      {!customers.isLoading&&!customers.isError&&allRows.length>0&&<><CustomerSegmentGuide/>
      <Box className="customer-table-wrap"><table><thead><tr><th>Customer ID</th><th>Customer Name</th><th>Email</th><th>Phone</th><th>Customer Type</th><th>Total Orders</th><th>Total Revenue</th><th>Status</th><th>Customer Segment</th><th>Actions</th></tr></thead><tbody>{visibleRows.map(c=><tr key={c.id}><td className="customer-code">{c.customerId}</td><td><b>{c.fullName}</b></td><td>{c.email}</td><td>{c.phone}</td><td>{title(c.customerType)}</td><td>{c.summary.totalOrders}</td><td><b>{money(c.summary.totalRevenue)}</b></td><td><Chip size="small" color={c.status==="ACTIVE"?"success":"default"} label={title(c.status)}/></td><td><SegmentBadge segment={c.segment}/></td><td className="customer-actions"><IconButton size="small" title="View" onClick={()=>{setSelected(c);setTab("history")}}><VisibilityIcon/></IconButton>{editable&&<IconButton size="small" title="Edit" onClick={()=>{setEditing(c);setFormOpen(true)}}><EditIcon/></IconButton>}{editable&&<IconButton className="delete-action" size="small" title="Delete customer" disabled={remove.isPending} onClick={()=>confirm(`Delete ${c.fullName}?`)&&remove.mutate(c.id)}><DeleteIcon/></IconButton>}</td></tr>)}</tbody></table>
        {!customers.isError&&!visibleRows.length&&<Box className="customer-empty">No customers match the current filters.</Box>}
        <Box className="customer-pagination"><span>Showing {filteredRows.length?((page-1)*pageSize)+1:0} to {Math.min(page*pageSize,filteredRows.length)} of {filteredRows.length} customers</span><Pagination count={pageCount} page={Math.min(page,pageCount)} onChange={(_,value)=>setPage(value)} color="primary" size="small"/></Box>
      </Box></>}
    </Box>}
    {tab==="analytics"&&<Box className="component-panel"><Box className="component-panel__header"><Typography component="h2">Customer Analytics</Typography>{editable&&<Box className="component-export"><Button variant="outlined" startIcon={<DownloadIcon/>} onClick={()=>exportReport("analytics","CSV")}>CSV</Button><Button variant="outlined" startIcon={<DownloadIcon/>} onClick={()=>exportReport("analytics","PDF")}>PDF</Button></Box>}</Box><Analytics data={analytics.data} customers={customers.data?.items||[]}/></Box>}
    {tab==="history"&&<Box className="component-panel">
      <Box className="component-panel__header"><Typography component="h2">Customer History</Typography>{editable&&current&&<Box className="component-export"><Button variant="outlined" startIcon={<DownloadIcon/>} onClick={()=>exportReport("history","CSV")}>CSV</Button><Button variant="outlined" startIcon={<DownloadIcon/>} onClick={()=>exportReport("history","PDF")}>PDF</Button></Box>}</Box>
      <Box className="history-layout"><aside><h3>Customer</h3><TextField select fullWidth size="small" value={current?.id||""} onChange={e=>setSelected(customers.data?.items.find(x=>x.id===e.target.value))}>{customers.data?.items.map(c=><MenuItem key={c.id} value={c.id}>{c.fullName}</MenuItem>)}</TextField>{([
        ["profile","Profile Overview"],["purchase-history","Purchase History"],["recent-activity","Recent Activity"],["timeline","Timeline"],["notes","Notes"],
      ] as [HistoryView,string][]).map(([value,label])=><button key={value} className={historyView===value?"active":""} onClick={()=>setHistoryView(value)}>{label}</button>)}</aside>{current?<Box className="history-content history-content--single"><HistoryViewContent customer={current} view={historyView}/></Box>:<Box className="customer-empty">Add or select a customer to view their history.</Box>}</Box>
    </Box>}
    <CustomerForm open={formOpen} customer={editing} issue={customerIssue} onClose={()=>{setFormOpen(false);setCustomerIssue(null)}} onSave={v=>save.mutate(v)} onValidationError={setCustomerIssue}/>
  </Box>
}
