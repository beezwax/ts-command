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
  compose: () => compose
});
module.exports = __toCommonJS(src_exports);
var Command = class {
  context;
  executed;
  constructor(context) {
    this.context = context;
    this.executed = false;
  }
  execute() {
    if (!this.context.success)
      return;
    this.executed = true;
    this.run();
  }
  undo() {
  }
};
var Runner = class {
  commands;
  constructor(...commands) {
    this.commands = commands;
  }
  execute() {
    this.commands.forEach((command) => command.execute());
  }
  undo() {
    this.commands.forEach((command) => command.executed && command.undo());
  }
};
var compose = (...commands) => (context) => {
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
  compose
});
