import { CustomError } from "ts-custom-error";

export interface IAuthError extends CustomError {
  code: number;
  message: string;
  toString(): string;
}

export type ErrorCodes = {
  [key: number]: string;
};

export abstract class AuthError extends CustomError implements IAuthError {
  code: number;

  message: string;

  public constructor(code: number, message?: string) {
    // takes care of stack and proto
    super(message);

    this.code = code;
    this.message = message || "";
    // Set name explicitly as minification can mangle class names
    Object.defineProperty(this, "name", { value: "AuthError" });
  }

  toJSON(): IAuthError {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
    };
  }

  toString(): string {
    return JSON.stringify(this.toJSON());
  }
}

export class InitializationError extends AuthError {
  protected static messages: ErrorCodes = {
    5000: "Custom",
    5001: "Invalid constructor params",
    5002: "SDK not initialized. please call init first",
  };

  public constructor(code: number, message?: string) {
    // takes care of stack and proto
    super(code, message);

    // Set name explicitly as minification can mangle class names
    Object.defineProperty(this, "name", { value: "InitializationError" });
  }

  public static fromCode(code: number, extraMessage = ""): AuthError {
    return new InitializationError(code, `${InitializationError.messages[code]}, ${extraMessage}`);
  }

  public static invalidParams(extraMessage = ""): AuthError {
    return InitializationError.fromCode(5001, extraMessage);
  }

  public static notInitialized(extraMessage = ""): AuthError {
    return InitializationError.fromCode(5002, extraMessage);
  }
}

/**
 * login errors
 */

export class LoginError extends AuthError {
  protected static messages: ErrorCodes = {
    5000: "Custom",
    5111: "Invalid login params",
    5112: "User not logged in.",
    5113: "login popup has been closed by the user",
    5114: "Login failed",
    5115: "Popup was blocked. Please call this function as soon as user clicks button or use redirect mode",
    5116: "MFA already enabled",
    5117: "MFA not yet enabled. Please call `enableMFA` first",
  };

  public constructor(code: number, message?: string) {
    // takes care of stack and proto
    super(code, message);

    // Set name explicitly as minification can mangle class names
    Object.defineProperty(this, "name", { value: "LoginError" });
  }

  public static fromCode(code: number, extraMessage = ""): AuthError {
    return new LoginError(code, `${LoginError.messages[code]}, ${extraMessage}`);
  }

  public static invalidLoginParams(extraMessage = ""): AuthError {
    return LoginError.fromCode(5111, extraMessage);
  }

  public static userNotLoggedIn(extraMessage = ""): AuthError {
    return LoginError.fromCode(5112, extraMessage);
  }

  public static popupClosed(extraMessage = ""): AuthError {
    return LoginError.fromCode(5113, extraMessage);
  }

  public static loginFailed(extraMessage = ""): AuthError {
    return LoginError.fromCode(5114, extraMessage);
  }

  public static popupBlocked(extraMessage = ""): AuthError {
    return LoginError.fromCode(5115, extraMessage);
  }

  public static mfaAlreadyEnabled(extraMessage = ""): AuthError {
    return LoginError.fromCode(5116, extraMessage);
  }

  public static mfaNotEnabled(extraMessage = ""): AuthError {
    return LoginError.fromCode(5117, extraMessage);
  }
}
