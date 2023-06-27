# TypeScript Command Pattern

This is an implementation of the [Command
pattern](https://refactoring.guru/design-patterns/command) for TypeScript. It
allows you to wrap computations in an object, run them sequentially, stop on
failure, undo them, and compose them.

A command must extend the `Command` abstract class and implement `execute`.
The `execute` method is where your command does the actual work by reading and
writing to its received `context`.

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

  execute() {
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

  execute() {
    this.context.success = true;
    this.context.value = this.context.value + 2;
  }
}
```

## Running a command

You can run a command with the `run` function:

```typescript
const context = { success: true, value: 0 };

const result = run<typeof context>(context, GenerateNumberCommand);

expect(result.success).toEqual(true);
expect(result.value).toEqual(2);
```

The `run` function will return a new context, modified by the given command.

## Running several commands

Chaining commands is the main reason to use the Command pattern. We can run
several commands one after the other by simply passing them to `run`:

```typescript
const context = { success: true, value: 0 };

const result = run<typeof context>(
  context,
  GenerateNumberCommand,
  AddTwoCommand
);

expect(result.success).toEqual(true);
expect(result.value).toEqual(4);
```

TypeScript will do its magic and make sure the context is valid and satisfies
all our commands.

## Stops on Failure

Below is a very simple command that all it does is fail by setting
`context.success` to `false`.

If all the context we need is a `success` field, we can use the default
to `CommandContext`:

```typescript
class FailCommand extends Command {
  execute() {
    this.context.success = false;
  }
}
```

Because `FailCommand` sets `context.success` to `false`, subsequent commands
won't be executed:

```typescript
const context = { success: true, value: 0 };

const result = run<typeof context>(
  context,
  GenerateNumberCommand,
  FailCommand,
  AddTwoCommand
);

expect(result.success).toEqual(false);
expect(result.value).toEqual(2);
```

Note that `result.value` is `2` because `AddTwoCommand` was not executed.

## Undo

You can define an `undo` method if you need to clean up after your command
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

  execute() {
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

const result = run<typeof context>(context, GenerateStringCommand, FailCommand);

expect(result.success).toEqual(false);
expect(result.string).toEqual("Undone");
```

Note that the initial value of `context.string` is `"Hello"`, but after
`FailCommand` is executed, it calls `GenerateStringCommand#undo` and
`context.string` ends up being `"Undone"`.

The `#undo` command is called in reverse order from the specified commands. So
if you compose commands `A`, `B`, `C` and `D`, and command `D` fails, the
order of the `#undo` calls will be `D -> C -> B -> A`.

### Exceptions

Note that if one command throws, `#undo` will not be called. Also, if one
`#undo` throws, remaining `#undo` will not be called, either. It's up to you
to properly handle exceptions inside `#execute` and `#undo` for each command.

## Composing Commands

You can compose smaller simple commands into a bigger, more complex one. This
is particularly useful if you find you run the same subset of commands in
several places. You can extract them into a composite command with `compose`:

```typescript
const GenerateNumberAndString = compose<
  GenerateNumberContext & GenerateStringContext
>(GenerateNumberCommand, GenerateStringCommand);
```

You can then `run` them like regular commands:

```typescript
const context = { success: true, value: 0, string: "" };
const result = run<typeof context>(
  context,
  GenerateNumberAndString,
  AddTwoCommand
);

expect(result.success).toBe(true);
expect(result.value).toEqual(4);
expect(result.string).toEqual("Hello");
```

## Testing

Another big advantage of the Command pattern is that your commands are just
JavaScript objects, and can easily be tested in isolation.

```typescript
const result = run(dummyContext, MyCommand);

expect(result.something).toEqual(somethingElse);
```

If you now each command works independently, and you know the command chaining
works, then you can safely chain and compose your commands to generate complex
actions without the need to test as much.
