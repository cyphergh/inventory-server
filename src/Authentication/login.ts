import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { LoginResponse } from "../../type";
import { prisma } from "../db/init";
import { decode, sign, verify } from "hono/jwt";
import { SendSMS } from "../message/sms";

export const loginRouter = new Hono();
const loginSchema = z.object({
  id: z.string(),
  password: z.string(),
});


loginRouter.post(
  "/",
  zValidator("json", loginSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: true, message: "Client request error",token:""});
    }
  }),
  async (c) => {
    try {
      const data = (await c.req.json()) as z.infer<typeof loginSchema>;
      if (data.id == "" || data.password == "")
        throw new Error("Invalid Credentials");
      const users = await prisma.user.findMany({});
      if(users.length<1){
        const password = Bun.password.hashSync(Bun.env.PASSWORD!);
        const auth = await prisma.auth.create({
          data: {
            email: 'admin',
            phoneNumber: '0206821921',
            attempts: 0,
            password,
          },
        });
        const user = await prisma.user.create({
          data: {
            firstName: "Developer",
            lastName: "ACCOUNT",
            phoneNumber: '0206821921',
            email: 'info.flourish.gh@gmail.com',
            role: "SUPERVISOR",
            authId: auth.id,
            dateOfBirth: new Date(Date.now()),
          },
        });
      }

      const user = await prisma.auth.findFirst({
        where: {
          OR: [
            {
              phoneNumber: data.id,
            },
            {
              email: data.id.toLowerCase(),
            },
          ],
        },
        include: {
          user: {
            include:{
              branch:true,
            }
          },
        },
      });
      if (!user) throw new Error("Invalid Credentials");
      if (!await Bun.password.verify(data.password, user.password)) {
        throw new Error("Invalid userId or password");
      }
      if (!user.user) throw new Error("Invalid Credentials");
      if (!user.user.active) throw new Error("Account suspended");
      let signUser = {
        firstName: user.user.firstName,
        lastName: user.user.lastName,
        email: user.user.email,
        phoneNumber: user.user.phoneNumber,
        role: user.user.role,
        sale:user.user.sales.toFixed(2),
        branchId: user.user.branchId,
        branch:user.user.branch,
        id: user.user.id,
        exp: Math.floor(Date.now() / 1000) + 60 * 60*24,
      }
      const token = await sign(signUser, Bun.env.JWT_SECRET!);
      await prisma.auth.update({
        where:{id:user.id},
        data:{
            token:token,
        }
      })
      return c.json<LoginResponse>({
        error: false,
        message: '',
        token: token,
      });
    } catch (error: any) {
      return c.json<LoginResponse>({
        error: true,
        message: error.toString(),
        token:'',
      });
    }
  }
);
