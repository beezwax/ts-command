var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  Runner: () => Runner,
  compose: () => compose,
  cond: () => cond,
  run: () => run
});
module.exports = __toCommonJS(src_exports);
var Runner = class {
  commands;
  executed;
  constructor(...commands) {
    this.commands = commands;
    this.executed = [];
  }
  async execute() {
    this.executed = [];
    for (let i = 0; i < this.commands.length; i++) {
      const command = this.commands[i];
      this.executed.push(command);
      await command.execute();
      if (!command.context.success)
        return;
    }
  }
  async undo() {
    const reversed = [...this.executed].reverse();
    for (let i = 0; i < reversed.length; i++) {
      const command = this.commands[i];
      command.undo && await command.undo();
    }
  }
};
var run = async (context, ...commands) => {
  const copy = { ...context };
  const runner = new Runner(...commands.map((klass) => new klass(copy)));
  await runner.execute();
  if (!copy.success)
    await runner.undo();
  return copy;
};
var compose = (...klasses) => {
  return class ComposedCommand {
    context;
    runner;
    constructor(context) {
      this.context = context;
      const commands = klasses.map((klass) => new klass(this.context));
      this.runner = new Runner(...commands);
    }
    async execute() {
      await this.runner.execute();
    }
    async undo() {
      await this.runner.undo();
    }
  };
};
var cond = (fn) => {
  return class ConditionalDelegator {
    context;
    command;
    constructor(context) {
      this.context = context;
      this.command = null;
    }
    async execute() {
      const klass = fn(this.context);
      this.command = new klass(this.context);
      await this.command.execute();
    }
    async undo() {
      if (!this.command)
        throw new Error("Did not execute, cannot undo");
      this.command.undo && await this.command.undo();
    }
  };
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Runner,
  compose,
  cond,
  run
});
