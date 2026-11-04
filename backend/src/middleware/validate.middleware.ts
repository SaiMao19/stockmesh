
import type { RequestHandler } from "express";
import { z } from "zod";

// Reusable Zod validation middleware
export function validateBody(
  schema: z.ZodType
): RequestHandler {

  return (req, res, next) => {

    // 1. Validate the incoming request body
    const result = schema.safeParse(req.body);

    // 2. If validation fails, return an error
    if (!result.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join(".") || "body",
          message: issue.message
        }))
      });

      return;
    }

    // 3. Store validated and cleaned data
    res.locals.validatedBody = result.data;

    // 4. Continue to the controller
    next();
  };
}
