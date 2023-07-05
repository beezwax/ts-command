export interface Context {
  success: boolean;
}

export interface Command {
  context: Context;
  execute(): void | Promise<void>;
  undo?(): void | Promise<void>;
}

export interface CommandClass<T extends Context> {
  new (context: T): Command;
}

export class Runner {
  commands: Command[];
  executed: Command[];

  constructor(...commands: Command[]) {
    this.commands = commands;
    this.executed = [];
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
      command.undo && (await command.undo());
    }
  }
}

export const run = async <T extends Context>(
  context: T,
  ...commands: CommandClass<T>[]
) => {
  const copy = { ...context };
  const runner = new Runner(...commands.map((klass) => new klass(copy)));

  await runner.execute();
  if (!copy.success) await runner.undo();

  return copy;
};

export const compose = <T extends Context>(...klasses: CommandClass<T>[]) => {
  return class ComposedCommand implements Command {
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
