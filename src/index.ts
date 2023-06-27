export interface CommandContext {
  success: boolean;
}

interface ICommand {
  context: CommandContext;
  execute(): void | Promise<void>;
  undo(): void | Promise<void>;
}

export abstract class Command implements ICommand {
  context: CommandContext;

  constructor(context: CommandContext) {
    this.context = context;
  }

  abstract execute(): void | Promise<void>;

  undo() {
    // NOOP
  }
}

export interface CommandClass<T extends CommandContext> {
  new (context: T): ICommand;
}

export class Runner {
  commands: ICommand[];
  executed: ICommand[];

  constructor(...commands: ICommand[]) {
    this.commands = commands;
  }

  async execute() {
    this.executed = [];
    for (let i = 0; i < this.commands.length; i++) {
      const command = this.commands[i];
      this.executed.push(command);
      await command.execute();
      if (!command.context.success) return;
    }
  }

  async undo() {
    const reversed = [...this.executed].reverse();
    for (let i = 0; i < reversed.length; i++) {
      const command = this.commands[i];
      await command.undo();
    }
  }
}

export const run = async <T extends CommandContext>(
  context: T,
  ...commands: CommandClass<T>[]
) => {
  const copy = { ...context };
  const runner = new Runner(...commands.map((klass) => new klass(copy)));

  await runner.execute();
  if (!copy.success) await runner.undo();

  return copy;
};

export const compose = <T extends CommandContext>(
  ...klasses: CommandClass<T>[]
) => {
  return class ComposedCommand implements ICommand {
    context: T;
    runner: Runner;

    constructor(context: T) {
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
