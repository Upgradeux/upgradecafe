import { NextResponse } from "next/server";
import { ZodError } from "zod";

export type ErrorCode =
  | "UNAUTHORIZED"
  | "PASSWORD_CHANGE_REQUIRED"
  | "INVALID_OWNER_ACCOUNT"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "INVALID_CATEGORY"
  | "CAFE_NOT_FOUND"
  | "DUPLICATE_SLUG"
  | "PLAN_NOT_FOUND"
  | "ORDER_NOT_FOUND"
  | "SERVICE_REQUEST_NOT_FOUND"
  | "CAFE_SUSPENDED"
  | "CAFE_ARCHIVED"
  | "RATE_LIMITED"
  | "TABLE_NOT_FOUND"
  | "TABLE_REQUIRED"
  | "TABLE_OCCUPIED"
  | "TABLE_RESERVED"
  | "TABLE_UNAVAILABLE"
  | "INTERNAL_ERROR";

export interface AppErrorOptions {
  code: ErrorCode;
  message: string;
  statusCode?: number;
  details?: Record<string, unknown> | unknown[];
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown> | unknown[];
  public readonly isOperational: boolean;

  constructor({ code, message, statusCode, details }: AppErrorOptions) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.details = details;
    this.isOperational = true;

    if (statusCode) {
      this.statusCode = statusCode;
    } else {
      switch (code) {
        case "UNAUTHORIZED":
          this.statusCode = 401;
          break;
        case "PASSWORD_CHANGE_REQUIRED":
        case "FORBIDDEN":
          case "CAFE_SUSPENDED":
          case "CAFE_ARCHIVED":
          this.statusCode = 403;
          break;
        case "NOT_FOUND":
        case "CAFE_NOT_FOUND":
        case "PLAN_NOT_FOUND":
        case "ORDER_NOT_FOUND":
        case "SERVICE_REQUEST_NOT_FOUND":
        case "TABLE_NOT_FOUND":
          this.statusCode = 404;
          break;
        case "INVALID_CATEGORY":
        case "TABLE_REQUIRED":
          this.statusCode = 400;
          break;
        case "DUPLICATE_SLUG":
        case "INVALID_OWNER_ACCOUNT":
        case "TABLE_OCCUPIED":
        case "TABLE_RESERVED":
        case "TABLE_UNAVAILABLE":
          this.statusCode = 409;
          break;
        case "VALIDATION_ERROR":
          this.statusCode = 422;
          break;
        case "RATE_LIMITED":
          this.statusCode = 429;
          break;
        case "INTERNAL_ERROR":
        default:
          this.statusCode = 500;
          break;
      }
    }

    Error.captureStackTrace(this, this.constructor);
  }

  static toResponse(error: unknown) {
    const formatted = formatErrorResponse(error);
    return NextResponse.json(formatted, { status: formatted.status });
  }
}

/**
 * Format errors safely for client responses without leaking internal details
 */
export function formatErrorResponse(error: unknown) {
  if (
    error instanceof AppError ||
    (error && typeof error === "object" && "code" in error && ("statusCode" in error || "status" in error))
  ) {
    const appErr = error as any;
    return {
      success: false,
      error: {
        code: appErr.code,
        message: appErr.message || "An error occurred.",
        details: appErr.details,
      },
      status: appErr.statusCode || appErr.status || 400,
    };
  }

  if (error instanceof ZodError || (error && typeof error === "object" && "issues" in error && Array.isArray((error as any).issues))) {
    const zodErr = error as ZodError;
    const firstIssue = zodErr.issues[0];
    const message = firstIssue?.message || "Validation failed";
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR" as ErrorCode,
        message,
        details: typeof zodErr.format === "function" ? zodErr.format() : zodErr.issues,
      },
      status: 400,
    };
  }

  // Handle generic / unexpected internal errors securely
  console.error("Unhandled Application Exception:", error);
  const errMsg = error instanceof Error ? error.message : "An unexpected server error occurred. Please try again later.";
  return {
    success: false,
    error: {
      code: "INTERNAL_ERROR" as ErrorCode,
      message: process.env.NODE_ENV === "development" ? errMsg : "An unexpected server error occurred. Please try again later.",
    },
    status: 500,
  };
}
