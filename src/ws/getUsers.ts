import { ServerWebSocket } from "bun";
import { SocketMessage } from "..";
import { IsActive, IsAdmin } from "../Authentication/check";
import { prisma } from "../db/init";

export async function getUsers(
  data: SocketMessage,
  ws: ServerWebSocket<unknown>,
  token: string
) {
  try {
    if (!(await IsAdmin(token))) throw Error("Permission denied");
    if (! await IsActive(token)) throw Error("Account Suspended");
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
    const messages = await prisma.adminNote.findMany({
      orderBy: {
        createdAt: "desc",
      }
    });
    ws.send(
      JSON.stringify({
        error: false,
        command: "users",
        message: "",
        users,
        messages,
      })
    );
  } catch (error) {
    ws.send(
      JSON.stringify({
        error: true,
        command: "users",
        message: "",
        users: [],
      })
    );
  }
}
