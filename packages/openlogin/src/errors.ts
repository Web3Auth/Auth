import { CustomError } from "ts-custom-error";

export interface IOpenloginError extends CustomError {
  code: number;
  message: string;
  toString(): string;
}

export type ErrorCodes = {
  [key: number]: string;
};

export abstract class OpenloginError extends CustomError implements IOpenloginError {
  code: number;

  message: string;

  public constructor(code: number, message?: string) {
    // takes care of stack and proto
    super(message);

    this.code = code;
    this.message = message || "";
    // Set name explicitly as minification can mangle class names
    Object.defineProperty(this, "name", { value: "OpenloginError" });
  }

  toJSON(): IOpenloginError {
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

export class InitializationError extends OpenloginError {
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

  public static fromCode(code: number, extraMessage = ""): OpenloginError {
    return new InitializationError(code, `${InitializationError.messages[code]}, ${extraMessage}`);
  }

  public static invalidParams(extraMessage = ""): OpenloginError {
    return InitializationError.fromCode(5001, extraMessage);
  }

  public static notInitialized(extraMessage = ""): OpenloginError {
    return InitializationError.fromCode(5002, extraMessage);
  }
}

/**
 * login errors
 */

export class LoginError extends OpenloginError {
  protected static messages: ErrorCodes = {
    5000: "Custom",
    5111: "Invalid login params",
    5112: "User not logged in.",
    5113: "login popup has been closed by the user",
    5114: "Login failed",
  };

  public constructor(code: number, message?: string) {
    // takes care of stack and proto
    super(code, message);

    // Set name explicitly as minification can mangle class names
    Object.defineProperty(this, "name", { value: "LoginError" });
  }

  public static fromCode(code: number, extraMessage = ""): OpenloginError {
    return new LoginError(code, `${LoginError.messages[code]}, ${extraMessage}`);
  }

  public static invalidLoginParams(extraMessage = ""): OpenloginError {
    return LoginError.fromCode(5111, extraMessage);
  }

  public static userNotLoggedIn(extraMessage = ""): OpenloginError {
    return LoginError.fromCode(5112, extraMessage);
  }

  public static popupClosed(extraMessage = ""): OpenloginError {
    return LoginError.fromCode(5113, extraMessage);
  }

  public static loginFailed(extraMessage = ""): OpenloginError {
    return LoginError.fromCode(5114, extraMessage);
  }
}
