import { Request, Response, NextFunction } from "express";
import { actor, contract, DemoRole, roleNames } from "../config/chain";
export type Role = DemoRole;
export function auth(req: Request, res: Response, next: NextFunction) {
  try {
    const account = String(req.header("x-demo-account") || "");
    if (!roleNames().includes(account as Role)) return res.status(401).json({error:"Select a valid seeded demo account using x-demo-account. This is local-demo authentication only."});
    const signer=actor(account); (req as any).actorName=account; (req as any).signer=signer; (req as any).address=signer.address;
    next();
  } catch(e:any) { res.status(500).json({error:e.message || "Authentication setup failed"}); }
}
export function allowRoles(...roles: Role[]) { return async (req:Request,res:Response,next:NextFunction) => {
  try {
    const account=(req as any).actorName as Role;
    const roleHash:Record<Role,string>={admin:"DEFAULT_ADMIN_ROLE",supplierA:"SUPPLIER_ROLE",supplierB:"SUPPLIER_ROLE",labA:"LAB_ROLE",labB:"LAB_ROLE",manufacturer:"MANUFACTURER_ROLE",auditor:"AUDITOR_ROLE"};
    const c=contract(); const roleId=roleHash[account]==="DEFAULT_ADMIN_ROLE" ? await c.DEFAULT_ADMIN_ROLE() : await c[roleHash[account]]();
    const ok=await c.hasRole(roleId,(req as any).address);
    if (!ok || !roles.includes(account)) return res.status(403).json({error:`This action is not permitted for ${account}.`});
    next();
  } catch(e:any) { res.status(500).json({error:e.message || "Authorization check failed"}); }
}; }
