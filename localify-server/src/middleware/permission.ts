// src/api/middlewares/permission.ts
import { createMiddleware } from "hono/factory";
import { hasPermission } from "../services/permission.service.js";

export const permissionMiddleware = (action: string) => {
  return createMiddleware(async (c, next) => {
    const user = c.get("user") as { sub: number; role: string } & {
      [key: string]: any;
    };
    if (!user) {
      return c.json({ error: "Unauthorized: User not found in context." }, 401);
    }

    const allowed = await hasPermission(user.role, action);
    if (!allowed) {
      return c.json(
        {
          error:
            "Forbidden: You do not have permission to perform this action.",
        },
        403
      );
    }
    await next();
  });
};
