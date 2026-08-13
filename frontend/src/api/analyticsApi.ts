import axiosInstance from "./axiosInstance";
import { getCustomerAnalytics, getCustomers } from "./customerApi";

export interface AnalyticsFilters { startDate?:string; endDate?:string; productId?:string; categoryId?:string; customerId?:string; paymentMethod?:string; paymentStatus?:string; interval?:"daily"|"weekly"|"monthly"; }
export interface AnalyticsDashboard {
  kpis:{totalRevenue:number;totalOrders:number;averageOrderValue:number;totalItemsSold:number;totalDiscount:number;totalTax:number};
  trend:{label:string;revenue:number;orders:number}[];
  topProducts:{id:string;name:string;sku:string;units:number;revenue:number}[];
  topCustomers:{id:string|null;name:string;orders:number;totalSpend:number;averageOrderValue:number}[];
  paymentMethods:{name:string;transactions:number;revenue:number}[];
  options:{products:{id:string;name:string}[];categories:{id:string;name:string}[];customers:{id:string;name:string}[];paymentMethods:string[];paymentStatuses:string[]};
  lastUpdated:string;
}
// Keep using the established URL so running backends that have not yet been
// restarted after the analytics upgrade remain compatible. The backend maps
// both this URL and /analytics/sales/dashboard to the same SQL aggregation.
export const getAnalyticsDashboard=async(params:AnalyticsFilters):Promise<AnalyticsDashboard>=>{
  const raw=(await axiosInstance.get<Record<string,any>>("/analytics/dashboard",{params})).data;
  const kpis=raw.kpis||{}, options=raw.options||{};
  let topCustomers=Array.isArray(raw.topCustomers)?raw.topCustomers:[];
  // Older analytics backends do not include customer rankings. Reuse the
  // customer module's maintained purchase summaries until that backend is
  // restarted, without allowing a customer request to break sales analytics.
  if(!topCustomers.length){
    try{
      const [customerAnalytics,customerList]=await Promise.all([getCustomerAnalytics(),getCustomers({status:"ACTIVE",pageSize:"100"})]);
      topCustomers=(customerAnalytics.topCustomers||[]).map((ranked,index)=>{
        const customer=customerList.items.find(item=>item.fullName===ranked.name);
        const orders=Number(customer?.summary.totalOrders)||0;
        const spend=Number(ranked.value)||0;
        return {id:customer?.id||`customer-${index}`,name:ranked.name,orders,totalSpend:spend,averageOrderValue:Number(customer?.summary.averageOrderValue)||(orders?spend/orders:0)};
      }).filter(customer=>customer.totalSpend>0);
    }catch{topCustomers=[]}
  }
  return {
    kpis:{
      totalRevenue:Number(kpis.totalRevenue)||0,
      totalOrders:Number(kpis.totalOrders)||0,
      averageOrderValue:Number(kpis.averageOrderValue)||0,
      totalItemsSold:Number(kpis.totalItemsSold??kpis.totalProductsSold)||0,
      totalDiscount:Number(kpis.totalDiscount)||0,
      totalTax:Number(kpis.totalTax)||0,
    },
    trend:Array.isArray(raw.trend)?raw.trend.map((x:any)=>({label:String(x.label),revenue:Number(x.revenue)||0,orders:Number(x.orders)||0})):[],
    topProducts:Array.isArray(raw.topProducts)?raw.topProducts.map((x:any,index:number)=>({id:String(x.id||x.productId||index),name:String(x.name||"Unknown product"),sku:String(x.sku||"—"),units:Number(x.units)||0,revenue:Number(x.revenue)||0})):[],
    topCustomers,
    paymentMethods:Array.isArray(raw.paymentMethods)?raw.paymentMethods.map((x:any)=>({name:String(x.name),transactions:Number(x.transactions)||0,revenue:Number(x.revenue??x.value)||0})):[],
    options:{products:options.products||[],categories:options.categories||[],customers:options.customers||[],paymentMethods:options.paymentMethods||["CASH","CARD","UPI","BANK_TRANSFER"],paymentStatuses:options.paymentStatuses||["PAID","PENDING","FAILED"]},
    lastUpdated:raw.lastUpdated||new Date().toISOString(),
  };
};
export const logAnalyticsAction=async(action:"export"|"filters",details:string)=>(await axiosInstance.post("/analytics/audit",{action,details})).data;
