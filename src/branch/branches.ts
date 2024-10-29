import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { number, z } from "zod";
import { IsActive, IsAdmin } from "../Authentication/check";
import { Prisma } from "@prisma/client";
import { prisma } from "../db/init";
const newBranchSchema = z.object({
  name: z.string(),
  address: z.string(),
  email: z.string(),
  number: z.string(),
  token: z.string(),
});
export const branchRouter = new Hono();
branchRouter.post("/new", zValidator("json", newBranchSchema,(result, c) => {
    if (!result.success) {
      return c.json({ error: true, message: "Client request error",branches:[]});
    }
  },), async(c) => {
  try {
    const data = await c.req.json() as z.infer<typeof newBranchSchema>
    if(! await IsAdmin(data.token)) throw Error("Permission denied");
    if(! await IsActive(data.token)) throw Error("Account Suspended");
    const branch = await prisma.branch.create({
        data:{
            email:data.email,
            location:data.address,
            name:data.name,
            phone:data.number
        }
    });
    const branches = await prisma.branch.findMany({});
    return c.json({ error: false,branches:branches,message:"" });
  } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          return c.json(
           {message: "Store with same information exist",error:true,branches:[]}
          );
        }
      }
    return c.json({ message: "Hello, World! done all",error:true,branches:[]});
  }
});
const tkSchema = z.object({
  token:z.string(),
})
branchRouter.post("/all",zValidator('json',tkSchema,(r,c)=>{
  if(!r.success){
    c.json({error:true,message:"Request denied",branches:[]})
  }
}),async(c)=>{
 try {
  const data = await c.req.json() as z.infer<typeof tkSchema>;
   if(!await IsAdmin(data.token)) throw Error("Permission Denied");
   if(!await IsActive(data.token)) throw Error("Permission Denied");
   const branches = await prisma.branch.findMany({});
   return c.json({ error: false,branches:branches,message:"" });
 } catch (error) {
  c.json({
    error:true,
    message:"Error occurred",
    branches:[],
  })
 }
});