interface CommandContext {
    success: boolean;
}
interface Command {
    context: CommandContext;
    execute(): void | Promise<void>;
    undo?(): void | Promise<void>;
}
interface CommandClass<T extends CommandContext> {
    new (context: T): Command;
}
declare class Runner {
    commands: Command[];
    executed: Command[];
    constructor(...commands: Command[]);
    execute(): Promise<void>;
    undo(): Promise<void>;
}
declare const run: <T extends CommandContext>(context: T, ...commands: CommandClass<T>[]) => Promise<T>;
declare const compose: <T extends CommandContext>(...klasses: CommandClass<T>[]) => {
    new (context: T): {
        context: T;
        runner: Runner;
        execute(): Promise<void>;
        undo(): Promise<void>;
    };
};

export { Command, CommandClass, CommandContext, Runner, compose, run };
