import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import {
  CheckPassword,
  GetUser,
  IsActive,
  IsAdmin,
} from "../Authentication/check";
import { v4 as genUid } from "uuid";
import { prisma } from "../db/init";
import { Buffer } from "buffer";
import { readFile } from "fs";
import { password } from "bun";
export const inventoryRoute = new Hono();

const stocksSchema = z.object({
  token: z.string(),
});

inventoryRoute.post(
  "/stock",
  zValidator("json", stocksSchema, (r, n) => {
    if (!r.success) return n.json({ error: true, message: "Client request error" });
  }),
  async (c) => {
    try {
      const data = (await c.req.json()) as z.infer<typeof stocksSchema>;
      if (! await IsActive(data.token)) throw Error("Account Suspended");
      const user = await GetUser(data.token);
      if (!user) throw Error("User not found");
      const stocks = await prisma.stocks.findMany({
        where:{
          branchId:user.branchId!,
        },
        include:{
          inventory:true,
        }
      })
      let s=await prisma.user.findFirst({
        where: {
          id: user.id,
        },
        select: {
          sales: true
        }
      });
      const sales=s?.sales;
      return c.json({
        error:false,
        message:'',
        stocks,
        sales
      })
    } catch (error:any) {
      return c.json({
        error:true,
        message:error.toString()
      })
    }
  }
);

const exportSchema = z.object({
  token: z.string(),
  id: z.string(),
  quantity: z.string(),
  password: z.string(),
  branchId: z.string(),
});

inventoryRoute.post(
  "/export",
  zValidator("json", exportSchema, (r, n) => {
    if (!r.success)
      n.json({
        error: true,
        message: "Client request error",
        inventories: [],
      });
  }),
  async (c) => {
    try {
      const data = (await c.req.json()) as z.infer<typeof exportSchema>;
      if (! await IsAdmin(data.token)) throw Error("Permission denied");
      if (! await IsActive(data.token)) throw Error("Account Suspended");
      if (!(await CheckPassword(data.token, data.password)))
        throw Error("Wrong password");
      const user = await GetUser(data.token);
      if (!user) throw Error("User not found");
      await prisma.$transaction(async (prisma) => {
        const inv = await prisma.inventory.update({
          where: {
            id: data.id,
          },
          data: {
            quantity: {
              decrement: parseInt(data.quantity),
            },
          },
        });
        if (inv.quantity < 0) throw Error("Inventory quantity not enough");
        //
        const stock = await prisma.stocks.upsert({
          where: {
            branchId_inventoryId: {
              branchId: data.branchId,
              inventoryId: inv.id,
            },
          },
          create: {
            remaining: parseInt(data.quantity),
            branchId: data.branchId,
            inventoryId: inv.id,
          },
          update: {
            remaining: {
              increment: parseInt(data.quantity),
            },
          },
        });
        const stockTopUp = await prisma.stocksTopUp.create({
          data: {
            total: parseInt(data.quantity),
            branchId: data.branchId,
            inventoryId: inv.id,
            userId: user.id,
            stockId: stock.id,
          },
        });
        await prisma.inventoryExport.create({
          data: {
            quantity: parseInt(data.quantity),
            branchId: data.branchId,
            inventoryId: inv.id,
            userId: user.id,
          },
        });
      });

      const inventories = await prisma.inventory.findMany({
        orderBy: [{ createdAt: "desc" }, { quantity: "asc" }],
        where: {},
        include: {
          exports: true,
          topups: true,
        },
      });
      return c.json({ error: false, message: "", inventories });
    } catch (error: any) {
      return c.json({ error: true, message: error.message, inventories: [] });
    }
  }
);

const schema = z.object({
  token: z.string(),
  name: z.string(),
  quantity: z.string(),
  unit: z.string(),
  dimension: z.string(),
  weight: z.string(),
  cost_price: z.string(),
  selling_price: z.string(),
  brand: z.string(),
  colors: z.string(),
  manufacturer: z.string(),
  expiration_alert: z.string(),
  expire_date: z.string(),
});
const s = z.object({
  id: z.string(),
  token: z.string(),
  quantity: z.string(),
});
const editSchema = z.object({
  token: z.string(),
  inventoryId: z.string(),
  password: z.string(),
  name: z.string(),
  cost_price: z.string(),
  selling_price: z.string(),
  colors: z.string(),
  expire_date: z.string(),
});
inventoryRoute.post(
  "/edit",
  zValidator("json", editSchema, (r, n) => {
    if (!r.success)
      n.json({
        error: true,
        message: "Client request error",
        inventories: [],
      });
  }),
  async (c) => {
    try {
      const data = (await c.req.json()) as z.infer<typeof editSchema>;
      if (! await IsAdmin(data.token)) throw Error("Permission denied");
      if (! await IsActive(data.token)) throw Error("Account Suspended");
      if (!(await CheckPassword(data.token, data.password)))
        throw Error("Wrong password");
      const user = await GetUser(data.token);
      if (!user) throw Error("User not found");
      await prisma.inventory.update({
        where: {
          id: data.inventoryId,
        },
        data: {
          name: data.name,
          costPrice: parseFloat(data.cost_price),
          sellingPrice: parseFloat(data.selling_price),
          colour: data.colors,
          expireDate: new Date(Date.parse(data.expire_date)),
        },
      });
      const inventory = await prisma.inventory.findUniqueOrThrow({
        where: {
          id: data.inventoryId,
        },
        include: {
          exports: {
            orderBy: [{ createdAt: "desc" }, { quantity: "asc" }],
            include: {
              branch: true,
              user: true,
            },
          },
          topups: {
            orderBy: [{ createdAt: "desc" }, { quantity: "asc" }],
            include: {
              user: true,
            },
          },
          stocks: {
            include: {
              branch: true,
              stockTopUp: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      });
      const inventories = await prisma.inventory.findMany({
        orderBy: [{ createdAt: "desc" }, { quantity: "asc" }],
        where: {},
        include: {
          exports: true,
          topups: true,
        },
      });
      return c.json({ error: false, message: "", inventory, inventories });
    } catch (error: any) {
      console.log(error);
      return c.json({ error: true, message: error.message, inventories: [] });
    }
  }
);

inventoryRoute.post(
  "/addQuantity",
  zValidator("json", s, (r, n) => {
    if (!r.success)
      n.json({
        error: true,
        message: "Client request error",
        inventories: [],
      });
  }),
  async (c) => {
    try {
      const data = (await c.req.json()) as z.infer<typeof s>;
      if (! await IsAdmin(data.token)) throw Error("Permission denied");
      if (! await IsActive(data.token)) throw Error("Account Suspended");
      const user = await GetUser(data.token);
      if (!user) throw Error("User not found");
      const inventory = await prisma.inventory.findUnique({
        where: {
          id: data.id,
        },
      });
      if (!inventory) throw Error("Inventory not found");
      await prisma.$transaction(async (prisma) => {
        await prisma.inventory.update({
          where: {
            id: data.id,
          },
          data: {
            quantity: inventory.quantity + parseInt(data.quantity),
          },
        });
      });
      await prisma.inventoryTopup.create({
        data: {
          quantity: parseInt(data.quantity),
          inventoryId: inventory.id,
          userId: user.id,
        },
      });
      const inventories = await prisma.inventory.findMany({
        orderBy: [{ createdAt: "desc" }, { quantity: "asc" }],
        where: {},
        include: {
          exports: true,
          topups: true,
        },
      });
      return c.json({ error: false, message: "", inventories });
    } catch (error: any) {
      console.log(error);
      return c.json({ error: true, message: error.message, inventories: [] });
    }
  }
);
const tk = z.object({
  token: z.string(),
});
const stk = z.object({
  token: z.string(),
  inventoryId: z.string(),
});
inventoryRoute.post(
  "/one",
  zValidator("json", stk, (r, n) => {
    if (!r.success)
      n.json({
        error: true,
        message: "Client request error",
      });
  }),
  async (c) => {
    try {
      const data = (await c.req.json()) as z.infer<typeof stk>;
      if (! await IsAdmin(data.token)) throw Error("Permission denied");
      if (! await IsActive(data.token)) throw Error("Account Suspended");
      const inventory = await prisma.inventory.findUniqueOrThrow({
        where: {
          id: data.inventoryId,
        },
        include: {
          exports: {
            orderBy: [{ createdAt: "desc" }, { quantity: "asc" }],
            include: {
              branch: true,
              user: true,
            },
          },
          topups: {
            orderBy: [{ createdAt: "desc" }, { quantity: "asc" }],
            include: {
              user: true,
            },
          },
          stocks: {
            include: {
              branch: true,
              stockTopUp: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      });
      const inventories = await prisma.inventory.findMany({
        orderBy: [{ createdAt: "desc" }, { quantity: "asc" }],
        where: {},
        include: {
          exports: true,
          topups: true,
        },
      });
      return c.json({ error: false, message: "", inventory, inventories });
    } catch (error: any) {
      return c.json({ error: true, message: error.message });
    }
  }
);
inventoryRoute.post(
  "/all",
  zValidator("json", tk, (r, n) => {
    if (!r.success)
      n.json({
        error: true,
        message: "Client request error",
        inventories: [],
      });
  }),
  async (c) => {
    try {
      const data = (await c.req.json()) as z.infer<typeof tk>;
      if (! await IsAdmin(data.token)) throw Error("Permission denied");
      if (! await IsActive(data.token)) throw Error("Account Suspended");
      const inventories = await prisma.inventory.findMany({
        orderBy: [{ createdAt: "desc" }, { quantity: "asc" }],
        where: {},
        include: {
          exports: true,
          topups: true,
        },
      });
      return c.json({ error: false, message: "", inventories });
    } catch (error: any) {
      console.log(error);
      return c.json({ error: true, message: error.message, inventories: [] });
    }
  }
);

inventoryRoute.post(
  "/new",
  zValidator("form", schema, (r, n) => {
    if (!r.success) n.json({ error: true, message: "Client request error" });
  }),
  async (c) => {
    try {
      const fs = Bun.file;
      const body = await c.req.parseBody();
      const file: File | string = body["image"] as File;
      if (!file) throw Error("File not found");
      if (!file.type.includes("image")) throw new Error("Invalid image file");
      if (! await IsAdmin(body.token as string)) throw Error("Permission denied");
      if (! await IsActive(body.token as string)) throw Error("Permission denied");
      let bytes = await file.arrayBuffer();
      let user = await GetUser(body.token as string);
      if (!user) throw Error("User not found");
      await prisma.$transaction(async (prisma) => {
        let inventory = await prisma.inventory.create({
          data: {
            name: body.name as string,
            quantity: parseInt(body.quantity as string),
            unit: body.unit as string,
            dimension: body.dimension as string,
            weight: body.weight as string,
            costPrice: parseFloat(body.cost_price as string),
            sellingPrice: parseFloat(body.selling_price as string),
            brand: body.brand as string,
            colour: body.colors as string,
            manufacturer: body.manufacturer as string,
            expirationAlert: parseInt(body.expiration_alert as string),
            expireDate: new Date(Date.parse(body.expire_date as string)),
            image: Buffer.from(bytes),
          },
        });
        await prisma.inventoryTopup.create({
          data: {
            quantity: parseInt(body.quantity as string),
            inventoryId: inventory.id,
            userId: user.id,
          },
        });
      });
      const inventories = await prisma.inventory.findMany({
        orderBy: [{ createdAt: "desc" }, { quantity: "asc" }],
        where: {},
        include: {
          topups: true,
          exports: true,
        },
      });
      return c.json({
        error: false,
        message: "",
        inventories,
      });
    } catch (error: any) {
      return c.json({ error: true, message: error.message, inventories: [] });
    }
  }
);
