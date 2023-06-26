import { Command, CommandContext, compose } from "../src/index";

describe("compose", () => {
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
      this.context.string = "Undone";
    }
  }

  class FailCommand extends Command {
    run() {
      this.context.success = false;
    }
  }

  test("stops on failure", () => {
    const context = { success: true, value: 0 };
    const command = compose<typeof context>(
      GenerateNumberCommand,
      FailCommand,
      AddTwoCommand
    );

    const result = command(context);

    expect(result.success).toEqual(false);
    expect(result.value).toEqual(2);
  });

  test("chains", () => {
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
  });

  test("undo", () => {
    const context = { success: true, string: "" };
    const command = compose<typeof context>(GenerateStringCommand, FailCommand);

    const result = command(context);

    expect(result.success).toEqual(false);
    expect(result.string).toEqual("Undone");
  });
});
