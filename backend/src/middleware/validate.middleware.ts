
import type { RequestHandler } from "express";
import { z } from "zod";

export function validateBody(
  schema: z.ZodType
): RequestHandler {

  return (req, res, next) => {

    // Validate request body
    const result = schema.safeParse(req.body);

    // Validation failed
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

    // Store validated and cleaned data
    res.locals.validatedBody = result.data;

    // Continue to the controller
    next();
  };
}
