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
declare const compose: <T extends CommandContext>(...klasses: CommandClass<T>[]) => {
    new (context: T): {
        context: T;
        runner: Runner;
        execute(): void;
        undo(): void;
    };
};

export { Command, CommandClass, CommandContext, Runner, compose, run };
