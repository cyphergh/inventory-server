import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import {
  CheckPassword,
  GetUser,
  IsActive,
  IsAdmin,
} from "../Authentication/check";
import { prisma } from "../db/init";
import { PaymentMethod } from "@prisma/client";
import { SendSMS } from "../message/sms";
import { password } from "bun";

export const shopRouter = new Hono();
const retrieveSaleSchema = z.object({
  userId: z.string(),
  password: z.string(),
  token: z.string(),
});
shopRouter.post(
  "/order/retrieveSale",
  zValidator("json", retrieveSaleSchema, (r, c) => {
    if (!r.success) {
      return c.json({ error: true, message: "Client request error" });
    }
  }),
  async(c)=>{
    try {
      const data = (await c.req.json()) as z.infer<typeof retrieveSaleSchema>;
      if (!(await IsAdmin(data.token))) throw Error("Permission denied");
      if (!(await IsActive(data.token))) throw Error("Account Suspended");
      if (!(await CheckPassword(data.token, data.password)))
        throw Error("Wrong password");
      const user = await GetUser(data.token);
      if (!user) throw Error("User not found");

      await prisma.$transaction(async (prisma) => {
        const emp= await prisma.user.findUniqueOrThrow({
          where:{id:data.userId,

          },
          include:{
            branch:true
          }
        })
        await prisma.transaction.updateMany({
          where:{
            userID:data.userId
          },
          data:{
            status:"APPROVED",
          }
        });
        await prisma.user.update({
          where:{
            id:data.userId
          },
          data:{
            sales:0,
          }
        })
        await prisma.adminNote.create({
          data:{
            severity:"HIGH",
            message:`${user.firstName} ${user.lastName} [${user.phoneNumber }] has retrieved sales of ${emp.sales} from ${emp.firstName} ${emp.lastName} in ${emp.branch?.name}`,
          }
        })
      })
      return c.json({ error: false, message: "" });
    } catch (error:any) {
      return c.json({ error: true, message: error.toString() });

    }
  }
);
const cancelSchema = z.object({
  token: z.string(),
  id: z.string(),
  password: z.string(),
  reason: z.string(),
});

shopRouter.post(
  "/order/delete",
  zValidator("json", cancelSchema, (r, c) => {
    if (!r.success) {
      return c.json({ error: true, message: "Client request error" });
    }
  }),
  async (c) => {
    try {
      const data = (await c.req.json()) as z.infer<typeof cancelSchema>;
      if (!(await IsActive(data.token))) throw Error("Account Suspended");
      if (!(await CheckPassword(data.token, data.password)))
        throw Error("Wrong password");
      const user = await GetUser(data.token);
      if (!user) throw "User not found";
      if (!user.branchId && !(await IsAdmin(data.token)))
        throw "Branch not found";
      const order = await prisma.order.findFirst({
        where: {
          id: data.id,
        },
        include: {
          handler: true,
          items: {
            include: {
              inventory: true,
            },
          },
          payment: true,
        },
      });
      if (!order) throw "Order not found";
      await prisma.$transaction(async (prisma) => {
        await prisma.user.update({
          where: {
            id: order.handlerId,
          },
          data: {
            sales: {
              decrement: order.items.reduce(
                (a, b) => a + b.price * b.quantity,
                0
              ),
            },
          },
        });
        for (const item of order.items) {
          await prisma.stocks.update({
            where: {
              branchId_inventoryId: {
                branchId: order.handler.branchId!,
                inventoryId: item.inventory.id,
              },
            },
            data: {
              remaining: {
                increment: item.quantity,
              },
            },
          });
        }
        await prisma.orderItems.deleteMany({
          where: {
            orderId: data.id,
          },
        });
        await prisma.payments.deleteMany({
          where: {
            orderId: data.id,
          },
        });
        await prisma.transaction.deleteMany({
          where: {
            paymentId: order.payment?.id,
          },
        });
        await prisma.order.delete({
          where: {
            id: data.id,
          },
        });
        await prisma.adminNote.create({
          data: {
            message: `Order Canceled by ${user.firstName} ${user.lastName} [${user.phoneNumber}]  with reason ${data.reason}`,
            severity: "MEDIUM",
          },
        });
      });
      const orders = await prisma.order.findMany({
        orderBy: [{ createdAt: "desc" }],
        where: (await IsAdmin(data.token))
          ? {}
          : {
              handlerId: user.id,
            },
        include: {
          items: {
            include: {
              inventory: true,
            },
          },
          customer: true,
          handler: true,
          payment: true,
        },
      });
      let s = await prisma.user.findFirst({
        where: {
          id: user.id,
        },
        select: {
          sales: true,
        },
      });
      const sales = s?.sales;
      return c.json({ error: false, message: "", orders, sales });
    } catch (error: any) {
      console.log(error);
      return c.json({ error: true, message: error.toString() });
    }
  }
);

const ordersSchema = z.object({
  token: z.string(),
});

shopRouter.post(
  "/orders",
  zValidator("json", ordersSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: true, message: "Client request error" });
    }
  }),
  async (c) => {
    try {
      const data = (await c.req.json()) as z.infer<typeof ordersSchema>;
      if (!(await IsActive(data.token))) throw Error("Account Suspended");
      const user = await GetUser(data.token);
      if (!user.branchId && !(await IsAdmin(data.token)))
        throw "Branch not found";
      const orders = await prisma.order.findMany({
        orderBy: [{ createdAt: "desc" }],
        where: (await IsAdmin(data.token))
          ? {}
          : {
              handlerId: user.id,
            },
        include: {
          items: {
            include: {
              inventory: true,
            },
          },
          customer: true,
          handler: {
            include: {
              branch: true,
            },
          },
          payment: true,
        },
      });
      let s = await prisma.user.findFirst({
        where: {
          id: user.id,
        },
        select: {
          sales: true,
        },
      });
      const sales = s?.sales;
      return c.json({ error: false, message: "", orders, sales });
    } catch (error: any) {
      return c.json({ error: true, message: error.toString(), orders: [] });
    }
  }
);

const orderSchema = z.object({
  token: z.string(),
  items: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      quantity: z.number(),
      total: z.number(),
    })
  ),
  customer: z.object({
    name: z.string(),
    email: z.string(),
    phone: z.string(),
    location: z.string(),
  }),
  payment: z.enum(["CASH", "MOMO", "BANK", "CREDIT"]),
  password: z.string(),
});
shopRouter.post(
  "/order",
  zValidator("json", orderSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: true, message: "Client request error" });
    }
  }),
  async (c) => {
    try {
      let data = (await c.req.json()) as z.infer<typeof orderSchema>;
      if (!(await IsActive(data.token))) throw Error("Account Suspended");
      if (data.payment == "CREDIT") throw "Credit payment not supported yet";
      const user = await GetUser(data.token);
      if (!user.branchId) throw "Branch not found";
      if (!(await CheckPassword(data.token, data.password)))
        throw "Wrong password";
      await prisma.$transaction(async (prisma) => {
        const customer = await prisma.customer.upsert({
          where: {
            phoneNumber: data.customer.phone,
          },
          create: {
            name: data.customer.name,
            email: data.customer.email,
            phoneNumber: data.customer.phone,
            location: data.customer.location,
            dateOfBirth: new Date(Date.now()),
            balance: 0,
            branchId: user.branchId!,
          },
          update: {
            name: data.customer.name,
            email: data.customer.email,
            phoneNumber: data.customer.phone,
            location: data.customer.location,
          },
        });
        const order = await prisma.order.create({
          data: {
            status: "DELIVERED",
            customerId: customer.id,
            handlerId: user.id,
          },
        });
        for (const item of data.items) {
          let stock = await prisma.stocks.findFirstOrThrow({
            where: {
              id: item.id,
            },
            include: {
              inventory: true,
              branch: true,
            },
          });
          if (stock.remaining < item.quantity) throw "Not enough stock";
          const m = await prisma.stocks.update({
            where: {
              id: stock.id,
            },
            data: {
              remaining: stock.remaining - item.quantity,
            },
          });
          stock = await prisma.stocks.findFirstOrThrow({
            where: {
              id: item.id,
            },
            include: {
              inventory: true,
              branch: true,
            },
          });
          if (
            m.remaining < stock.inventory.expirationAlert &&
            m.remaining > 0
          ) {
            await prisma.adminNote.create({
              data: {
                message: `${stock.inventory.name} is running low in ${
                  stock.branch.name
                }, with only ${stock.remaining} left on-site, and there ${
                  stock.inventory.quantity > 1 ? "are" : "is"
                } ${stock.inventory.quantity} available in the warehouse.`,
                severity: "HIGH",
              },
            });
            SendSMS(
              Bun.env.PHONE!,
              `${stock.inventory.name} is running low in ${
                stock.branch.name
              }, with only ${stock.remaining} left on-site, and there ${
                stock.inventory.quantity > 1 ? "are" : "is"
              } ${stock.inventory.quantity} available in the warehouse.`
            );
          }
          if (m.remaining == 0) {
            await prisma.adminNote.create({
              data: {
                message: `${stock.inventory.name} is  out of stock in ${
                  stock.branch.name
                }, and there ${stock.inventory.quantity > 1 ? "are" : "is"} ${
                  stock.inventory.quantity
                } available in the warehouse.`,
                severity: "HIGH",
              },
            });
            SendSMS(
              Bun.env.PHONE!,
              `${stock.inventory.name} is  out of stock in ${
                stock.branch.name
              }, and there ${stock.inventory.quantity > 1 ? "are" : "is"} ${
                stock.inventory.quantity
              } available in the warehouse.`
            );
          }
          await prisma.orderItems.create({
            data: {
              orderId: order.id,
              quantity: item.quantity,
              price: stock.inventory.sellingPrice,
              inventoryId: stock.inventory.id,
            },
          });
        }
        const pay = await prisma.payments.create({
          data: {
            orderId: order.id,
            amount: data.items.reduce((a, b) => a + b.total, 0),
            paymentMethod: data.payment as PaymentMethod,
            paymentStatus: "COMPLETED",
            totalAmount: data.items.reduce((a, b) => a + b.total, 0),
            amountPayed: data.items.reduce((a, b) => a + b.total, 0),
            customerId: customer.id,
          },
        });
        const trans = await prisma.transaction.create({
          data: {
            amount: pay.amountPayed,
            status: "PENDING",
            branchId: user.branchId!,
            customerId: customer.id,
            type: "PAYMENT",
            userID: user.id,
          },
        });
        await prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            sales: {
              increment: data.items.reduce((a, b) => a + b.total, 0),
            },
          },
        });
        SendSMS(
          data.customer.phone,
          `Thank you for choosing ${
            Bun.env.COMPANY
          }! We're thrilled to have had the opportunity to serve you, and we hope you’re delighted with your recent purchase. Your total for this transaction is \u20B5${data.items.reduce(
            (a, b) => a + b.total,
            0
          )}. Collect receipt before you leave`
        );
      });
      const stocks = await prisma.stocks.findMany({
        where: {
          branchId: user.branchId!,
        },
        include: {
          inventory: true,
        },
      });
      const orders = await prisma.order.findMany({
        orderBy: [{ createdAt: "desc" }],
        where: {
          handlerId: user.id,
        },
        include: {
          items: {
            include: {
              inventory: true,
            },
          },
          customer: true,
          handler: true,
          payment: true,
        },
      });
      let s = await prisma.user.findFirst({
        where: {
          id: user.id,
        },
        select: {
          sales: true,
        },
      });
      const sales = s?.sales;
      return c.json({ error: false, message: "", stocks, orders, sales });
    } catch (error: any) {
      return c.json({ error: true, message: error.toString() });
    }
  }
);
