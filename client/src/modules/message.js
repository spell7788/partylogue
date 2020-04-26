import store from '@/store';
import { completeAssign, isEmptyObject } from '@/utils';

export class Message {
  constructor(text) {
    this.text = text;
  }

  send(vm) {
    vm.$socket.emit('post message', {
      roomId: vm.roomId,
      text: this.text,
    }, (result) => {
      if (!result.ok) {
        vm.$store.dispatch('alert/fail', { msg: result.payload.msg });
      }
    });
  }
}

export const commandSendBehavior = {
  send(vm, autoArgs = {}, cb) {
    const args = this.prepareArgs(autoArgs);
    vm.$socket.emit('run command', { command: this.command, args }, cb);
  },

  prepareArgs(autoArgs) {
    return {
      ...this.prepareAutoArgs(autoArgs),
      ...this.prepareRawArgs(),
    };
  },

  prepareRawArgs() {
    const args = {};
    if (!this.rawArgs) return args;
    const manulaArgsMeta = this.argsMeta.filter(
      meta => Object.hasOwnProperty.call(meta, 'position'),
    );
    return this.prepareArgsForMeta(
      this.rawArgs, manulaArgsMeta, (src, argMeta) => src[argMeta.position],
    );
  },

  prepareAutoArgs(autoArgs) {
    if (isEmptyObject(autoArgs)) return autoArgs;
    const autoArgsMeta = this.argsMeta.filter(
      meta => !Object.hasOwnProperty.call(meta, 'position'),
    );
    return this.prepareArgsForMeta(
      autoArgs, autoArgsMeta, (src, argMeta) => src[argMeta.name],
    );
  },

  prepareArgsForMeta(source, argsMeta, getArgValue) {
    const args = {};
    argsMeta.forEach((meta) => {
      const arg = getArgValue(source, meta);
      args[meta.name] = meta.transform ? meta.transform(arg) : arg;
    });
    return args;
  },

  get argsMeta() {
    return store.state.user.commands
      .find(({ name }) => name === this.command)
      .args;
  },
};

export class CommandMessage extends Message {
  static Parse(text) {
    const parts = text.slice(1).split(' ').filter(Boolean);
    const command = parts[0];
    const rawArgs = parts.slice(1);
    return new CommandMessage(text, command, rawArgs.length ? rawArgs : null);
  }

  constructor(text, command, rawArgs) {
    super(text);
    this.command = command;
    this.rawArgs = rawArgs;
  }
}

completeAssign(CommandMessage.prototype, commandSendBehavior);

const COMMAND_SYMBOL = process.env.VUE_APP_COMMAND_SYMBOL;

export function createMessage(msg) {
  if (msg[0] === COMMAND_SYMBOL && msg.length > 1) {
    return new CommandMessage.Parse(msg);
  }
  return new Message(msg);
}

export default createMessage;
