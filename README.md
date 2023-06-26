# TypeScript Command Pattern

This is an implementation of the [Command
pattern](https://refactoring.guru/design-patterns/command) for TypeScript. It
allows you to wrap computations in an object, compose them, call them
sequentially, stop on failure, and undo them.

A command must extend the `Command` abstract class and implement the `run`
method. The `run` method is where your command does the actual work by reading
and writing to its received `context`.

The command is responsible for setting `context.success` to either `true` or
`false`, to reflect whether the command succeeded or not.

Commands must also define their required context interface, which must extend
`CommandContext`. The interface must include all the fields your command uses
from the context, either by reading them or modifying them.

Below is an example of a very simple command which simply generates a new
number (the number `2`), and saves it into `context.value`:

```typescript
interface GenerateNumberContext extends CommandContext {
  value: number;
}

class GenerateNumberCommand extends Command {
  context: GenerateNumberContext;

  constructor(context: GenerateNumberContext) {
    super(context);
  }

  run() {
    this.context.success = true;
    this.context.value = 2;
  }
}
```

Note that `context.success` is present in all commands and is defined in
`CommandContext`.

Here is another command that takes a number and adds 2 to it:

```typescript
interface AddTwoContext extends CommandContext {
  value: number;
}

class AddTwoCommand extends Command {
  context: AddTwoContext;

  constructor(context: AddTwoContext) {
    super(context);
  }

  run() {
    this.context.success = true;
    this.context.value = this.context.value + 2;
  }
}
```

## Running a command

You can run a command with the `run` function:

```typescript
const context = { success: true, value: 0 };

const result = run(GenerateNumberCommand, context);

expect(result.success).toEqual(true);
expect(result.value).toEqual(2);
```

## Composing commands

Composing commands is the main reason to use the Command pattern. We can
compose several small commands into a bigger one using `compose`.

The `compose` function will return a new command that will call all of the
given commands one after the other.

```typescript
const context = { success: true, value: 0 };
const command = compose<typeof context>(GenerateNumberCommand, AddTwoCommand);

const result = command(context);

expect(result.success).toEqual(true);
expect(result.value).toEqual(4);
```

TypeScript will do its magic and make sure the context is valid and satisfies
all our commands.

## Stops on Failure

Below is a very simple command that all it does is fail by setting
`context.success` to `false`.

If all we need is a success field, we can use the default `CommandContext`:

```typescript
class FailCommand extends Command {
  run() {
    this.context.success = false;
  }
}
```

Because `FailCommand` sets `context.success` to `false`, subsequent commands
won't be executed:

```typescript
const context = { success: true, value: 0 };
const command = compose<typeof context>(
  GenerateNumberCommand,
  FailCommand,
  AddTwoCommand
);

const result = command(context);

expect(result.success).toEqual(false);
expect(result.value).toEqual(2);
```

Note that `result.value` is `2` because `AddTwoCommand` was not executed.

## Undo

You can define an `undo` command if you need to clean up after your command
when a subsequent command fails:

```typescript
interface GenerateStringContext extends CommandContext {
  string: string;
}

class GenerateStringCommand extends Command {
  context: GenerateStringContext;

  constructor(context: GenerateStringContext) {
    super(context);
  }

  run() {
    this.context.success = true;
    this.context.string = "Hello";
  }

  undo() {
    // Could do some cleanup here...
    this.context.string = "Undone";
  }
}
```

```typescript
const context = { success: true, string: "" };
const command = compose<typeof context>(GenerateStringCommand, FailCommand);

const result = command(context);

expect(result.success).toEqual(false);
expect(result.string).toEqual("Undone");
```

Note that the initial value of `context.string` is `"Hello"`, but after
`FailCommand` is executed, it calls `GenerateStringCommand#undo` and
`context.string` ends up being `"Undone"`.

The `#undo` method is also called by the `run` function.
