// TODO : implement IsAdmin service
import { decode, sign, verify } from "hono/jwt";

import { Prisma, User } from "@prisma/client";
import { prisma } from "../db/init";

export async function IsAdmin (token:string) : Promise<boolean> {
    let user = await GetUser(token);
    if(!user) throw Error("User not found");
    if(user.role != 'SUPERVISOR') return false;
    
    if(!user.active) return false
    return true;
}
export async function IsActive (token:string) : Promise<boolean> {
    let user = await GetUser(token);
    if(!user) throw Error("User not found");
    if(!user.active) throw Error("Account suspended");
    return true;
}

export async function IsSalesPerson(token:string) :Promise<boolean>{
    let user = await GetUser(token);
    if(user.role != 'SALESPERSON') throw Error("Permission denied");
    if(!user.active) throw Error("Account suspended");
    return true;
}
export async function CheckPassword(token:string,password:string) :Promise<boolean>{
    const user = await GetUser(token);
    if(!user) throw Error("User not found");
    if(!user.active) throw Error("Account suspended");
    return await Bun.password.verify(password,user.auth!.password);
}
export async function GetUser(token:string) :Promise<Prisma.UserGetPayload<{include:{auth:true}}>>{
    const data =await verify(token, process.env.JWT_SECRET as string);
    const dec =await decode(token).payload as {id:string};
    let user = await prisma.user.findUnique({
        where:{
            id:dec.id
        },
        include:{
            auth:true
        }
    })
    if(!user) throw Error("User not found");
    return user;
}