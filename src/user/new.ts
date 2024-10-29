import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { CheckPassword, IsActive, IsAdmin } from "../Authentication/check";
import { prisma } from "../db/init";
import { Prisma } from "@prisma/client";
import { SendSMS } from "../message/sms";
import { password } from "bun";

const newUserRouter = new Hono();

const customerSchema = z.object({
  token: z.string(),
});

newUserRouter.post(
  "/customers",
  zValidator("json", customerSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: true, message: "Client request error" });
    }
  }),
  async (c) => {
    try {
      const data = (await c.req.json()) as z.infer<typeof customerSchema>;
      if (!(await IsAdmin(data.token))) throw Error("Permission denied");
      if (!(await IsActive(data.token))) throw Error("Account Suspended");
     
     
      const customersGroupedByBranch = await prisma.branch.findMany({
        select: {
          id: true,
          name: true,
          location: true,
          customers: {
            select: {
              id: true,
              name: true,
              phoneNumber:true,
              email:true,
              location:true,
              payments: {
                select: {
                  amount: true,
                },
              },
            },
          },
        },
      });
      
      const result = customersGroupedByBranch.map(branch => {
        const customersWithTotalPayments = branch.customers.map(customer => {
          const totalPayments = customer.payments.reduce((sum, payment) => sum + payment.amount, 0);
          return {
            id: customer.id,
            name: customer.name,
            phone:customer.phoneNumber,
            email:customer.email,
            location:customer.location,
            totalPayments,
          };
        });
        return {
          branchName: branch.name,
          location: branch.location,
          customers: customersWithTotalPayments,
        };
      });
      
      return c.json({ error: false, message: "",customers:result });
    } catch (error: any) {
      return c.json({ error: true, message: error.toString() });
    }
  }
);

const blockedOrUnblockedSchema = z.object({
  token: z.string(),
  id: z.string(),
  password: z.string(),
});

newUserRouter.post(
  "/blockedOrUnblocked",
  zValidator("json", blockedOrUnblockedSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: true, message: "Client request error" });
    }
  }),
  async (c) => {
    try {
      const data = (await c.req.json()) as z.infer<
        typeof blockedOrUnblockedSchema
      >;
      const token = data.token;
      if (!(await IsAdmin(token))) throw Error("Permission denied");
      if (!(await IsActive(token))) throw Error("Account Suspended");
      if (!(await CheckPassword(token, data.password)))
        throw Error("Wrong password");
      const user = await prisma.user.findUniqueOrThrow({
        where: {
          id: data.id,
        },
      });
      if (!user) throw Error("User not found");
      await prisma.user.update({
        where: {
          id: data.id,
        },
        data: {
          active: !user.active,
        },
      });
      const users = await prisma.user.findMany({
        where: {},
        include: {
          deposits: {
            where: {
              status: "PENDING",
            },
          },
          branch: true,
        },
      });
      return c.json({ error: false, message: "", users: users });
    } catch (error: any) {
      return c.json({ message: error.toString(), error: true });
    }
  }
);
const regSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  phoneNumber: z.string(),
  branchId: z.string(),
  email: z.string(),
  token: z.string(),
  role: z.enum(["SALESPERSON", "SUPERVISOR"]),
});
newUserRouter.post(
  "/new",
  zValidator("json", regSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: true, message: "Client request error" });
    }
  }),
  async (c) => {
    try {
      let data = (await c.req.json()) as z.infer<typeof regSchema>;
      const token = data.token;
      if (!(await IsAdmin(token))) throw Error("Permission denied");
      if (!(await IsActive(token))) throw Error("Account Suspended");
      await prisma.$transaction(async (prisma) => {
        const code = Math.floor(100000 + Math.random() * 900000);
        const password = Bun.password.hashSync(code.toString());
        const auth = await prisma.auth.create({
          data: {
            email: data.email.toLowerCase(),
            phoneNumber: data.phoneNumber,
            attempts: 0,
            password,
          },
        });
        const user = await prisma.user.create({
          data: {
            firstName: data.firstName.toLowerCase(),
            lastName: data.lastName.toLowerCase(),
            phoneNumber: data.phoneNumber,
            email: data.email.toLowerCase(),
            role: data.role,
            authId: auth.id,
            dateOfBirth: new Date(Date.now()),
            branchId: data.branchId,
          },
        });
        if (
          !(await SendSMS(
            user.phoneNumber,
            `Your password code is ${code}. Please do not share it with anyone`
          ))
        )
          throw Error("Failed to send SMS");
      });
      return c.json({ error: false, message: "" });
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          return c.json({
            message: "email or phone is already in use",
            error: true,
          });
        }
      }
      return c.json({ error: true, message: error.toString() });
    }
  }
);

export default newUserRouter;
