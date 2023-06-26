type CommandContext = { success: boolean };

export abstract class Command {
  context: CommandContext;
  executed: boolean = false;

  execute() {
    if (!this.context.success) return;
    this.executed = true;
    this.run();
  }

  abstract run(): void;

  undo() {
    // NOOP
  }
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

  undo() {
    this.commands.forEach((command) => command.executed && command.undo());
  }
}

export const compose =
  <T extends CommandContext>(...commands: CommandClass<T>[]) =>
  (context: T) => {
    const copy = { ...context };
    const runner = new Runner(...commands.map((klass) => new klass(copy)));

    runner.execute();
    if (!copy.success) runner.undo();

    return copy;
  };
