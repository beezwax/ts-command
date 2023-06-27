interface CommandContext {
    success: boolean;
}
interface ICommand {
    context: CommandContext;
    execute(): void;
    undo(): void;
}
declare abstract class Command implements ICommand {
    context: CommandContext;
    constructor(context: CommandContext);
    abstract execute(): void;
    undo(): void;
}
interface CommandClass<T extends CommandContext> {
    new (context: T): ICommand;
}
declare class Runner {
    commands: ICommand[];
    executed: ICommand[];
    constructor(...commands: ICommand[]);
    execute(): void;
    undo(): void;
}
declare const run: <T extends CommandContext>(context: T, ...commands: CommandClass<T>[]) => T;

export { Command, CommandClass, CommandContext, Runner, run };
