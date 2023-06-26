type CommandContext = { success: boolean };

export abstract class Command {
  context: CommandContext;

  execute() {
    if (!this.context.success) return;
    this.run();
  }

  abstract run(): void;
}

export interface CommandClass<T> {
  new (context: T & CommandContext): Command;
}

export class Runner {
  commands: Command[];

  constructor(...commands: Command[]) {
    this.commands = commands;
  }

  execute() {
    this.commands.forEach((command) => command.execute());
  }
}

export const compose =
  <T>(...commands: CommandClass<T>[]) =>
  (context: T & CommandContext) => {
    const copy = { ...context };
    const runner = new Runner(...commands.map((klass) => new klass(copy)));
    runner.execute();
    return copy;
  };
