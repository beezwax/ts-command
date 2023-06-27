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
  Command: () => Command,
  Runner: () => Runner,
  run: () => run
});
module.exports = __toCommonJS(src_exports);
var Command = class {
  context;
  constructor(context) {
    this.context = context;
  }
  undo() {
  }
};
var Runner = class {
  commands;
  executed;
  constructor(...commands) {
    this.commands = commands;
  }
  execute() {
    this.executed = [];
    for (let i = 0; i < this.commands.length; i++) {
      const command = this.commands[i];
      this.executed.push(command);
      command.execute();
      if (!command.context.success)
        return;
    }
  }
  undo() {
    [...this.executed].reverse().forEach((command) => command.undo());
  }
};
var run = (context, ...commands) => {
  const copy = { ...context };
  const runner = new Runner(...commands.map((klass) => new klass(copy)));
  runner.execute();
  if (!copy.success)
    runner.undo();
  return copy;
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Command,
  Runner,
  run
});
