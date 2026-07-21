/* Teaching guide: This file contains the products page page.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */

// Imports the needed tools from react.
import { useMemo, useState } from "react";
// Imports the needed tools from @tanstack/react-query.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
// Imports the needed tools from @mui/material.
import { Box, Drawer, IconButton, MenuItem, TextField, Typography } from "@mui/material";
// Imports the needed tools from @mui/icons-material/Add.
import AddIcon from "@mui/icons-material/Add"; import CloseIcon from "@mui/icons-material/Close"; import EditIcon from "@mui/icons-material/EditOutlined"; import DeleteIcon from "@mui/icons-material/DeleteOutlineOutlined"; import VisibilityIcon from "@mui/icons-material/VisibilityOutlined";
// Imports the needed tools from react-router-dom.
import { Link } from "react-router-dom";
// Imports the needed tools from ../../api/catalogApi.
import { createProduct, deleteProduct, getCategories, getProducts, updateProduct, type Product, type ProductInput } from "../../api/catalogApi";
// Imports the needed tools from ../../components/common/Button/Button.
import Button from "../../components/common/Button/Button";
// Loads ./ProductsPage.css styles or setup.
import "./ProductsPage.css";

// Stores empty for the steps below.
const empty:ProductInput={name:"",sku:"",categoryId:"",brand:"",description:"",unitPrice:0,costPrice:0,stockQuantity:0,unitOfMeasure:"Piece",status:"ACTIVE"};
// Add and manage products starts here.
const ProductsPage=()=>{
 // Keeps product data up to date.
 const qc=useQueryClient(); const [search,setSearch]=useState(""); const [category,setCategory]=useState(""); const [status,setStatus]=useState(""); const [brand,setBrand]=useState(""); const [sort,setSort]=useState("recent"); const [editing,setEditing]=useState<Product|null>(null); const [form,setForm]=useState<ProductInput>(empty); const [open,setOpen]=useState(false); const [error,setError]=useState("");
 // Gets category choices.
 const categories=useQuery({queryKey:["categories"],queryFn:()=>getCategories()});
 // Gets filtered products.
 const products=useQuery({queryKey:["products",search,category,status,brand,sort],queryFn:()=>getProducts({search:search||undefined,categoryId:category||undefined,status:status||undefined,brand:brand||undefined,sort})});
 // Saves a new or edited product.
 const save=useMutation({mutationFn:()=>editing?updateProduct(editing.id,form):createProduct(form),onSuccess:()=>{qc.invalidateQueries({queryKey:["products"]});qc.invalidateQueries({queryKey:["categories"]});setOpen(false);},onError:(e:any)=>setError(e.response?.data?.detail||e.message)});
 // Deletes a product.
 const remove=useMutation({mutationFn:deleteProduct,onSuccess:()=>qc.invalidateQueries({queryKey:["products"]})});
 // Builds the brand filter.
 const brands=useMemo(()=>Array.from(new Set((products.data?.items||[]).map(x=>x.brand).filter(Boolean))),[products.data]);
 // Opens the product form.
 const show=(p?:Product)=>{setEditing(p||null);setForm(p?{name:p.name,sku:p.sku,categoryId:p.categoryId,brand:p.brand||"",description:p.description||"",unitPrice:p.unitPrice,costPrice:p.costPrice,stockQuantity:p.stockQuantity,unitOfMeasure:p.unitOfMeasure,status:p.status}:empty);setError("");setOpen(true)};
 // Updates one form field.
 const field=(key:keyof ProductInput,value:string)=>setForm(v=>({...v,[key]:["unitPrice","costPrice","stockQuantity"].includes(key)?Number(value):value}));
 // Uses totals returned with the products.
 const summary=products.data;
 // Returns the completed result to the caller.
 return <Box className="catalog-page"><Box className="catalog-summary">{[["Total Products",summary?.totalProducts||0,"blue"],["Active Products",summary?.activeProducts||0,"green"],["Inactive Products",summary?.inactiveProducts||0,"orange"],["Total Categories",summary?.totalCategories||0,"purple"]].map(([l,v,c])=><Box className="catalog-stat" key={String(l)}><span className={`catalog-stat__icon ${c}`}>▦</span><div><small>{l}</small><strong>{v}</strong></div></Box>)}</Box>
 <Box className="catalog-tabs"><Link className="active" to="/products">Products</Link><Link to="/categories">Categories</Link></Box>
 <Box className="catalog-panel"><Box className="catalog-filters"><TextField size="small" placeholder="Search by product name, SKU or brand..." value={search} onChange={e=>setSearch(e.target.value)}/><TextField select size="small" label="Category" value={category} onChange={e=>setCategory(e.target.value)}><MenuItem value="">All Categories</MenuItem>{categories.data?.items.map(c=><MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}</TextField><TextField select size="small" label="Status" value={status} onChange={e=>setStatus(e.target.value)}><MenuItem value="">All Status</MenuItem><MenuItem value="ACTIVE">Active</MenuItem><MenuItem value="INACTIVE">Inactive</MenuItem></TextField><TextField select size="small" label="Brand" value={brand} onChange={e=>setBrand(e.target.value)}><MenuItem value="">All Brands</MenuItem>{brands.map(b=><MenuItem key={b} value={b}>{b}</MenuItem>)}</TextField><TextField select size="small" label="Sort" value={sort} onChange={e=>setSort(e.target.value)}><MenuItem value="recent">Recently Added</MenuItem><MenuItem value="name">Name</MenuItem><MenuItem value="price">Price</MenuItem></TextField><Button startIcon={<AddIcon/>} onClick={()=>show()}>Add Product</Button></Box>
 <Box className="catalog-table"><table><thead><tr><th>Product</th><th>SKU</th><th>Category</th><th>Brand</th><th>Unit Price</th><th>Status</th><th>Stock</th><th>Actions</th></tr></thead><tbody>{products.data?.items.map(p=><tr key={p.id}><td><strong>{p.name}</strong><small>{p.description}</small></td><td>{p.sku}</td><td>{p.categoryName}</td><td>{p.brand||"—"}</td><td>₹{Number(p.unitPrice).toFixed(2)}</td><td><span className={`catalog-status ${p.status.toLowerCase()}`}>{p.status==="ACTIVE"?"Active":"Inactive"}</span></td><td>{p.stockQuantity}</td><td><IconButton title="View" onClick={()=>show(p)}><VisibilityIcon/></IconButton><IconButton title="Edit" onClick={()=>show(p)}><EditIcon/></IconButton><IconButton title="Delete" color="error" onClick={()=>confirm("Delete this product?")&&remove.mutate(p.id)}><DeleteIcon/></IconButton></td></tr>)}</tbody></table>{!products.data?.items.length&&<p className="catalog-empty">No products found.</p>}</Box></Box>
 <Drawer anchor="right" open={open} onClose={()=>setOpen(false)}><Box className="catalog-drawer"><Box className="catalog-drawer__head"><Typography component="h2">{editing?"Edit Product":"Add Product"}</Typography><IconButton onClick={()=>setOpen(false)}><CloseIcon/></IconButton></Box>{error&&<p className="catalog-error">{error}</p>}{(["name","sku","brand"] as const).map(k=><TextField key={k} required={k!=="brand"} label={k==="name"?"Product Name":k.toUpperCase()} value={form[k]} onChange={e=>field(k,e.target.value)}/>)}<TextField select required label="Category" value={form.categoryId} onChange={e=>field("categoryId",e.target.value)}>{categories.data?.items.filter(c=>c.status==="ACTIVE").map(c=><MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}</TextField><TextField multiline rows={3} label="Description" value={form.description} onChange={e=>field("description",e.target.value)}/>{(["unitPrice","costPrice","stockQuantity"] as const).map(k=><TextField key={k} required type="number" label={k==="unitPrice"?"Unit Price":k==="costPrice"?"Cost Price":"Initial Stock Quantity"} value={form[k]} onChange={e=>field(k,e.target.value)}/>)}<TextField select required label="Unit of Measure" value={form.unitOfMeasure} onChange={e=>field("unitOfMeasure",e.target.value)}>{["Piece","Kilogram","Liter","Box","Pack","Meter"].map(x=><MenuItem key={x} value={x}>{x}</MenuItem>)}</TextField><TextField select required label="Status" value={form.status} onChange={e=>field("status",e.target.value)}><MenuItem value="ACTIVE">Active</MenuItem><MenuItem value="INACTIVE">Inactive</MenuItem></TextField><Box className="catalog-drawer__actions"><Button variant="outlined" onClick={()=>setOpen(false)}>Cancel</Button><Button loading={save.isPending} onClick={()=>save.mutate()}>Save Product</Button></Box></Box></Drawer></Box>;
}; export default ProductsPage;
