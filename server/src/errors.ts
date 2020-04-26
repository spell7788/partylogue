export class AppError extends Error {
  public static from(error: Error, ...args: any[]) {
    const self = new this(...args);
    Object.defineProperty(self, "stack", {
      get(): string {
        return `${
          self.message
        }\n\nThe above exception was the direct cause of the following exception:\n\n${
          error.stack
        }`;
      },
    });

    return self;
  }

  constructor(...args: any[]) {
    super(...args);
    this.name = this.constructor.name;
  }
}

export class CommandError extends AppError { }

export class ModelError extends AppError { }

export class ModelValidationError extends ModelError { }

export class ModelMiddlewareError extends ModelError { }

export class HandlerError extends AppError { }

export class InternalHandlerError extends HandlerError { }

export class HandlerValidationError extends HandlerError { }
