import util from "util";
import { HandlerValidationError, InternalHandlerError } from "../../errors";
import logger from "../../logger";
import models, { IChatRoom, IMessage, IUser } from "../../models";
import { AuthUserRegistry } from "../../services";
import { ExtendedSocket as Socket } from "../../types";

type Models = typeof models;
type AckFunction = (payload?: object) => void;
interface IErrorAckData {
  error: { msg: string };
}
export default abstract class BaseHandler<IDataFields extends object = {}> {
  private static NO_ACK_MESSAGE = "no ack function specified";

  public socket: Socket;
  public data: IDataFields;
  public ackFn?: AckFunction;
  constructor(socket: Socket, data: IDataFields, ackFn?: AckFunction) {
    this.socket = socket;
    this.data = data;
    this.ackFn = ackFn;
  }

  public async execute(): Promise<void> {
    try {
      await this.executeImpl(this.data);
    } catch (err) {
      if (err instanceof HandlerValidationError) {
        this.sendAckResponse({ error: { msg: err.message } });
        return;
      }

      throw err;
    }
  }

  public getObject(
    modelName: "User", conditionsOrId: object | string,
  ): Promise<IUser>;
  public getObject(
    modelName: "ChatRoom", conditionsOrId: object | string,
  ): Promise<IChatRoom>;
  public getObject(
    modelName: "Message", conditionsOrId: object | string,
  ): Promise<IMessage>;
  public async getObject(modelName: keyof Models, conditionsOrId: object | string) {
    const model = models[modelName];
    const method: keyof typeof model =
      typeof conditionsOrId === "object" ? "findOne" : "findById";

    // @ts-ignore
    const obj = await model[method](conditionsOrId);
    if (!obj) {
      throw new InternalHandlerError(
        `"${modelName}" object not found using conditions "${
          util.format(conditionsOrId)
        }"`,
      );
    }

    return obj;
  }

  public emitToTargetSocket(
    targetUser: IUser, event: string | symbol, ...data: any[]
  ): void {
    const registry = AuthUserRegistry.getInstance();
    const registryValue = registry.get(targetUser.id);
    if (!registryValue) {
      this.fail('"%s" is disconnected or not authorized.', targetUser.username);
    }
    registryValue.socket.emit(event, ...data);
  }

  public ok(payload?: string | object, ...fillers: any[]) {
    if (typeof payload === "string") {
      this.sendAckResponse({ msg: util.format(payload, ...fillers) });
    } else {
      this.sendAckResponse(payload);
    }
  }

  public fail(format: string, ...fillers: any[]): never {
    throw new HandlerValidationError(util.format(format, ...fillers));
  }

  protected abstract async executeImpl(data: IDataFields): Promise<void>;

  protected get user(): IUser | undefined {
    if (!this.socket.auth) { return; }
    return this.socket.auth.user;
  }

  private sendAckResponse(response?: object | IErrorAckData): void {
    if (!this.ackFn) {
      logger.warn(BaseHandler.NO_ACK_MESSAGE);
      return;
    }

    if (!response) { return this.ackFn({ ok: true }); }

    if (!(response as IErrorAckData).error) {
      this.ackFn({ ok: true, payload: response });
    } else {
      this.ackFn({ ok: false, error: (response as IErrorAckData).error });
    }
  }
}
