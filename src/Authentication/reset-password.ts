import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

const resetPasswordRouter = new Hono();
const resetSchema = z.object({
  id: z.string(),
  dateOfBirth: z.date(),
});
resetPasswordRouter.post(
  "/",
  zValidator("json", resetSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: true, message: "Client request error" });
    }
  }),
  async (c) => {
    const data = (await c.req.json()) as z.infer<typeof resetSchema>;
    try {
        c.json({ error: false,message:"" });
    } catch (error: any) {
      c.json({ error: true, message: error.toString() });
    }
  }
);
