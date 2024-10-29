import { User } from "@prisma/client"

export type LoginResponse = {
    error:boolean
    message:string
    token?:string
}