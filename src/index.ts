export interface Command {
  execute(): void;
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

export const compose = <T>(context: T, ...commands: Command[]) => {
  const runner = new Runner(...commands);
  runner.execute();
  return context;
};
