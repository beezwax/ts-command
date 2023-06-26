type CommandContext = { success: boolean };

export abstract class Command {
  context: CommandContext;

  execute() {
    if (!this.context.success) return;
    this.run();
  }

  abstract run(): void;
}

export interface CommandClass<T extends CommandContext> {
  new (context: T): Command;
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
  <T extends CommandContext>(...commands: CommandClass<T>[]) =>
  (context: T) => {
    const copy = { ...context };
    const runner = new Runner(...commands.map((klass) => new klass(copy)));
    runner.execute();
    return copy;
  };
