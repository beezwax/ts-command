# TypeScript Command Pattern

This is an implementation of the Command pattern for TypeScript. It allows you
to wrap computations in an object, compose them, call them sequentially, stop
on failure, and undo them.

A command must extend the `Command` class, and define it's required context
interface, which must extend `CommandContext`.

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

Note that `this.context.success` is a boolean, and it's the only defined field
in `CommandContext`.

Here is another simple command that takes a number and adds 2 to it:

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

## Compose

With those two commands in place, we can compose them with `compose`:

```typescript
const context = { success: true, value: 0 };
const command = compose<typeof context>(GenerateNumberCommand, AddTwoCommand);

const result = command(context);

expect(result.success).toEqual(true);
expect(result.value).toEqual(4);
```

TypeScript will make sure the context we pass is valid and satisfies all our
commands.

## Stops on Failure

If all we need is a success field, we can use the default `CommandContext`:

```typescript
class FailCommand extends Command {
  run() {
    this.context.success = false;
  }
}
```

That command will simply always fail. Now the subsequent commands won't be
executed:

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

You can define an `undo` command if you need to clean up after your command if
a subsequent command fails:

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
