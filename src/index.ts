export interface CommandContext {
  success: boolean;
}

export abstract class Command {
  context: CommandContext;

  constructor(context: CommandContext) {
    this.context = context;
  }

  execute() {
    if (!this.context.success) return;
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
  executed: Command[];

  constructor(...commands: Command[]) {
    this.commands = commands;
  }

  execute() {
    this.executed = [];
    for (let i = 0; i < this.commands.length; i++) {
      const command = this.commands[i];
      this.executed.push(command);
      command.execute();
      if (!command.context.success) return;
    }
  }

  undo() {
    [...this.executed].reverse().forEach((command) => command.undo());
  }
}

export const run = <T extends CommandContext>(
  context: T,
  ...commands: CommandClass<T>[]
) => {
  const copy = { ...context };
  const runner = new Runner(...commands.map((klass) => new klass(copy)));

  runner.execute();
  if (!copy.success) runner.undo();

  return copy;
};
