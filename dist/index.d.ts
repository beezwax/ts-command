interface Context {
    success: boolean;
}
interface Command {
    context: Context;
    execute(): void | Promise<void>;
    undo?(): void | Promise<void>;
}
interface CommandClass<T extends Context> {
    new (context: T): Command;
}
declare class Runner {
    commands: Command[];
    executed: Command[];
    constructor(...commands: Command[]);
    execute(): Promise<void>;
    undo(): Promise<void>;
}
declare const run: <T extends Context>(context: T, ...commands: CommandClass<T>[]) => Promise<T>;
declare const compose: <T extends Context>(...klasses: CommandClass<T>[]) => {
    new (context: T): {
        context: T;
        runner: Runner;
        execute(): Promise<void>;
        undo(): Promise<void>;
    };
};
declare const cond: <T extends Context>(fn: (context: T) => CommandClass<T>) => {
    new (context: T): {
        context: T;
        command: Command | null;
        execute(): Promise<void>;
        undo(): Promise<void>;
    };
};

export { Command, CommandClass, Context, Runner, compose, cond, run };
