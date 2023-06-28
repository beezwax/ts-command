# TypeScript Command Pattern

This is an implementation of the [Command
pattern](https://refactoring.guru/design-patterns/command) for TypeScript. It
allows you to wrap computations into objects, run them sequentially, stop on
failure, undo them, and compose them.

A command is just a class that implement the `Command` interface. All commands
have a `context: CommandContext` property, and an `execute(): void` method.

The `execute` method is where the command does the actual work by reading and
writing to its `context`.

The command is responsible for setting `context.success` to either `true` or
`false`, to reflect whether the command succeeded or not.

Commands can also define their own context interface, extending from
`CommandContext`. The interface defines all the fields your command uses from
the context.

Below is an example of a very simple command that simply generates a new
number (the number `2`), and saves it into `context.value`:

```typescript
interface GenerateNumberContext extends CommandContext {
  value: number;
}

class GenerateNumberCommand implements Command {
  context: GenerateNumberContext;

  constructor(context: GenerateNumberContext) {
    this.context = context;
  }

  execute() {
    this.context.success = true;
    this.context.value = 2;
  }
}
```

Note that `context.success` comes from `CommandContext`, and is something all
commands have in common.

Here is another command that takes a number and adds 2 to it:

```typescript
interface AddTwoContext extends CommandContext {
  value: number;
}

class AddTwoCommand implements Command {
  context: AddTwoContext;

  constructor(context: AddTwoContext) {
    this.context = context;
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

const result = await run<typeof context>(context, GenerateNumberCommand);

expect(result.success).toEqual(true);
expect(result.value).toEqual(2);
```

Or more succinctly:

```typescript
const { success, value } = await run(
  { success: true, value: 0 },
  GenerateNumberCommand
);

expect(success).toEqual(true);
expect(value).toEqual(2);
```

The `run` function will return a **copy** of the context, modified by the
given command.

## Async Commands

The `run` function will always return a promise, even if your commands are not
asynchronous, so you'll most likely always want to use `await` when calling
it.

As you might have guessed, you can define asynchronous commands just like
regular ones, just add `async` to `#execute` or `#undo` as needed:

```typescript
class MyAsyncCommand implements Command {
  context: MyAsyncContext;

  constructor(context: MyAsyncContext) {
    this.context = context;
  }

  async execute() {
    const result = await someAsyncFunction();
    this.context.success = true;
    this.context.value = result;
  }
}
```

## Running several commands

Chaining commands is the main reason to use the Command pattern. We can run
several commands one after the other by simply passing them to `run`:

```typescript
const context = { success: true, value: 0 };

const { success, value } = await run<typeof context>(
  context,
  GenerateNumberCommand,
  AddTwoCommand
);

expect(success).toEqual(true);
expect(value).toEqual(4);
```

TypeScript will do its magic and make sure the context is valid and satisfies
all our commands.

## Stops on Failure

Below is a very simple command that all it does is fail by setting
`context.success` to `false`.

If all the context we need is a `success` field, we can use the default
to `CommandContext`:

```typescript
class FailCommand implements Command {
  context: CommandContext;

  constructor(context: CommandContext) {
    this.context = context;
  }

  execute() {
    this.context.success = false;
  }
}
```

Because `FailCommand` sets `context.success` to `false`, subsequent commands
won't be executed:

```typescript
const context = { success: true, value: 0 };

const { success, value } = await run<typeof context>(
  context,
  GenerateNumberCommand,
  FailCommand,
  AddTwoCommand
);

expect(success).toEqual(false);
expect(value).toEqual(2);
```

Note that `result.value` is `2` because `AddTwoCommand` was not executed.

## Undo

You can define an `undo` method if you need to clean up after your command
when a subsequent command fails:

```typescript
interface GenerateStringContext extends CommandContext {
  string: string;
}

class GenerateStringCommand implements Command {
  context: GenerateStringContext;

  constructor(context: GenerateStringContext) {
    this.context = context;
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

const { success, string } = await run<typeof context>(
  context,
  GenerateStringCommand,
  FailCommand
);

expect(success).toEqual(false);
expect(string).toEqual("Undone");
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
const { success, value, string } = await run<typeof context>(
  context,
  GenerateNumberAndString,
  AddTwoCommand
);

expect(success).toBe(true);
expect(value).toEqual(4);
expect(string).toEqual("Hello");
```

## Testing

Another big advantage of the Command pattern is that your commands are just
JavaScript objects, and can easily be tested in isolation.

```typescript
const result = await run(dummyContext, MyCommand);

expect(result.something).toEqual(somethingElse);
```

If you know each command works independently (because you tested them), and
you know the command chaining and composition works (because this library
tested them), then you can feel safe when chaining and composing commands to
perform complex actions.
