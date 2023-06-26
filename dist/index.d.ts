interface CommandContext {
    success: boolean;
}
declare abstract class Command {
    context: CommandContext;
    executed: boolean;
    constructor(context: CommandContext);
    execute(): void;
    abstract run(): void;
    undo(): void;
}
interface CommandClass<T extends CommandContext> {
    new (context: T): Command;
}
declare class Runner {
    commands: Command[];
    constructor(...commands: Command[]);
    execute(): void;
    undo(): void;
}
declare const compose: <T extends CommandContext>(...commands: CommandClass<T>[]) => (context: T) => T;

export { Command, CommandClass, CommandContext, Runner, compose };
