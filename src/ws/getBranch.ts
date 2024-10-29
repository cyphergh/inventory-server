import { ServerWebSocket } from "bun";
import { prisma } from "../db/init";
import { SocketMessage } from "..";
import { IsActive, IsAdmin } from "../Authentication/check";

export async function getBranches(
  data: SocketMessage,
  ws: ServerWebSocket<unknown>,
  token: string
) {
  try {
    if (!(await IsAdmin(token))) throw Error("Permission denied");
    if (! await IsActive(token)) throw Error("Account Suspended");
    const branches = await prisma.branch.findMany({
      orderBy: [{ sales: "desc" }],
      where: {},
      include: {
        stocks: true,
        customers: true,
        imports: true,
      },
    });
    ws.send(
      JSON.stringify({
        error: false,
        command: "branchList",
        message: "",
        branches,
      })
    );
  } catch (error) {
    ws.send(
        JSON.stringify({
          error: true,
          command: "branchList",
          message: "",
          branches:[]
        })
      );
  }
}
