import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import path from "node:path";
import { api } from "./routes/api";
dotenv.config({path:path.resolve(process.cwd(),"../.env")});
export const app=express();
app.use(helmet({crossOriginResourcePolicy:{policy:"cross-origin"}}));
app.use(cors({origin:process.env.FRONTEND_ORIGIN||"http://localhost:5173",allowedHeaders:["Content-Type","x-demo-account"],methods:["GET","POST","OPTIONS"]}));
app.use(express.json({limit:"200kb"}));
app.use(rateLimit({windowMs:60_000,limit:120,standardHeaders:true,legacyHeaders:false}));
app.use("/api",api);
app.get("/",(_req,res)=>res.json({name:"Automotive Compliance API",health:"/api/health"}));
app.use((err:any,_req:express.Request,res:express.Response,_next:express.NextFunction)=>{res.status(err?.status||400).json({error:err?.message||"Request failed"});});
if(require.main===module){const port=Number(process.env.PORT||4000);app.listen(port,()=>console.log(`API listening on http://localhost:${port}`));}
