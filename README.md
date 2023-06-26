# TypeScript Command Pattern

This is an implementation of the Command pattern for TypeScript. It allows you
to wrap computations in an object, compose them, call them sequentially, stop
on failure, and undo them.

```typescript
interface GenerateNumberContext {
  success: boolean;
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

interface AddTwoContext {
  success: boolean;
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

interface GenerateStringContext {
  success: boolean;
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
    this.context.string = "Undone";
  }
}

interface FailConext {
  success: boolean;
}

class FailCommand extends Command {
  context: FailConext;

  constructor(context: FailConext) {
    super(context);
  }

  run() {
    this.context.success = false;
  }
}
```

## Compose

```typescript
const context = { success: true, value: 0, string: "" };
const command = compose<typeof context>(
  GenerateNumberCommand,
  AddTwoCommand,
  GenerateStringCommand
);

const result = command(context);

expect(result.success).toEqual(true);
expect(result.value).toEqual(4);
expect(result.string).toEqual("Hello");
```

## Stops on Failure

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

## Undo

```typescript
const context = { success: true, value: 0, string: "" };
const command = compose<typeof context>(GenerateStringCommand, FailCommand);

const result = command(context);

expect(result.success).toEqual(false);
expect(result.string).toEqual("Undone");
```
