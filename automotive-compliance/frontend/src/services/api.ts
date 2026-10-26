export const API_BASE=import.meta.env.VITE_API_BASE||'http://localhost:4000/api';
export type Actor='admin'|'supplierA'|'supplierB'|'labA'|'labB'|'manufacturer'|'auditor';
let actor:Actor='manufacturer';
export const setActor=(a:Actor)=>{actor=a};
export async function api<T=any>(path:string,options:RequestInit={}):Promise<T>{const res=await fetch(`${API_BASE}${path}`,{...options,headers:{'Content-Type':'application/json','x-demo-account':actor,...options.headers}});const body=await res.json().catch(()=>({error:'Invalid API response'}));if(!res.ok)throw new Error(typeof body.error==='string'?body.error:JSON.stringify(body.error||`HTTP ${res.status}`));return body as T;}
export const post=(path:string,body:any)=>api(path,{method:'POST',body:JSON.stringify(body)});
export const roleLabel:Record<Actor,string>={admin:'Network Admin',supplierA:'Supplier A',supplierB:'Supplier B',labA:'Testing Lab A',labB:'Testing Lab B',manufacturer:'Manufacturer',auditor:'Auditor'};

export async function uploadReport(path:string,file:File):Promise<any>{const data=new FormData();data.append("report",file);const res=await fetch(`${API_BASE}${path}`,{method:"POST",headers:{"x-demo-account":actor},body:data});const body=await res.json().catch(()=>({error:"Invalid API response"}));if(!res.ok)throw new Error(typeof body.error==="string"?body.error:JSON.stringify(body.error||`HTTP ${res.status}`));return body;}
