import {
  createRemoteJWKSet,
  jwtVerify,
} from "jose";

import type {
  Request,
  Response,
  NextFunction,
} from "express";

export interface AuthenticatedRequest extends Request {
  authUser?: {
    name: string | undefined;
    email: string;
  };
}

const JWKS = createRemoteJWKSet(
  new URL(
    process.env.BETTER_AUTH_JWKS_URL ||
    "http://localhost:3000/api/auth/jwks"
  )
);

export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  if (!token) {
    res.status(401).json({
      message: "Please login first",
    });
    return;
  }

  try {
    const { payload } = await jwtVerify(token, JWKS);

    if (typeof payload.email !== "string") {
      res.status(401).json({
        message: "Invalid token",
      });
      return;
    }

    (req as AuthenticatedRequest).authUser = {
      name:
        typeof payload.name === "string"
          ? payload.name
          : undefined,
      email: payload.email,
    };

    next();
  } catch {
    res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};