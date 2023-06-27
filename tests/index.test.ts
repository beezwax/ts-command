import { Command, CommandContext, run, compose } from "../src/index";

describe("commands", () => {
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
      this.context.string = "Undone";
    }
  }

  class AsyncAddTwoCommand extends Command {
    context: AddTwoContext;

    constructor(context: AddTwoContext) {
      super(context);
    }

    async execute() {
      this.context.success = true;
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          this.context.value = this.context.value + 2;
          resolve();
        }, 500);
      });
    }
  }

  class FailCommand extends Command {
    execute() {
      this.context.success = false;
    }
  }

  test("run", async () => {
    const context = { success: true, value: 0, string: "" };

    const result = await run<typeof context>(
      context,
      GenerateNumberCommand,
      AddTwoCommand,
      GenerateStringCommand
    );

    expect(result.success).toEqual(true);
    expect(result.value).toEqual(4);
    expect(result.string).toEqual("Hello");
  });

  test("async commands", async () => {
    const context = { success: true, value: 0 };

    const result = await run<typeof context>(
      context,
      GenerateNumberCommand,
      AsyncAddTwoCommand,
      AddTwoCommand
    );

    expect(result.success).toEqual(true);
    expect(result.value).toEqual(6);
  });

  test("stops on failure", async () => {
    const context = { success: true, value: 0 };

    const result = await run<typeof context>(
      context,
      GenerateNumberCommand,
      FailCommand,
      AddTwoCommand
    );

    expect(result.success).toEqual(false);
    expect(result.value).toEqual(2);
  });

  test("undo", async () => {
    const context = { success: true, string: "" };

    const result = await run<typeof context>(
      context,
      GenerateStringCommand,
      FailCommand
    );

    expect(result.success).toEqual(false);
    expect(result.string).toEqual("Undone");
  });

  describe("compose", () => {
    test("compose", async () => {
      const GenerateAndAddTwo = compose<GenerateNumberContext & AddTwoContext>(
        GenerateNumberCommand,
        AddTwoCommand
      );

      const context = { success: true, value: 0 };
      const result = await run<typeof context>(context, GenerateAndAddTwo);

      expect(result.success).toBe(true);
      expect(result.value).toEqual(4);
    });

    test("async inside compose", async () => {
      const GenerateAndAddTwoAsync = compose<
        GenerateNumberContext & AddTwoContext
      >(GenerateNumberCommand, AsyncAddTwoCommand);

      const context = { success: true, value: 0 };
      const result = await run<typeof context>(context, GenerateAndAddTwoAsync);

      expect(result.success).toBe(true);
      expect(result.value).toEqual(4);
    });

    test("run", async () => {
      const GenerateAndAddTwo = compose<GenerateNumberContext & AddTwoContext>(
        GenerateNumberCommand,
        AddTwoCommand
      );

      const context = { success: true, value: 0, string: "" };
      const result = await run<typeof context>(
        context,
        GenerateAndAddTwo,
        GenerateStringCommand
      );

      expect(result.success).toBe(true);
      expect(result.value).toEqual(4);
      expect(result.string).toEqual("Hello");
    });

    test("another run", async () => {
      const GenerateNumberAndString = compose<
        GenerateNumberContext & GenerateStringContext
      >(GenerateNumberCommand, GenerateStringCommand);

      const context = { success: true, value: 0, string: "" };
      const result = await run<typeof context>(
        context,
        GenerateNumberAndString,
        AddTwoCommand
      );

      expect(result.success).toBe(true);
      expect(result.value).toEqual(4);
      expect(result.string).toEqual("Hello");
    });

    test("can undo", async () => {
      const GenerateNumberAndString = compose<
        GenerateNumberContext & GenerateStringContext
      >(GenerateNumberCommand, GenerateStringCommand);

      const context = { success: true, value: 0, string: "" };
      const result = await run<typeof context>(
        context,
        GenerateNumberAndString,
        FailCommand
      );

      expect(result.success).toBe(false);
      expect(result.value).toEqual(2);
      expect(result.string).toEqual("Undone");
    });

    test("stops on failure", async () => {
      const GenerateNumberAndString = compose<
        GenerateNumberContext & GenerateStringContext
      >(GenerateNumberCommand, GenerateStringCommand);

      const context = { success: true, value: 0, string: "" };
      const result = await run<typeof context>(
        context,
        GenerateNumberAndString,
        FailCommand,
        AddTwoCommand
      );

      expect(result.success).toEqual(false);
      expect(result.value).toEqual(2);
      expect(result.string).toEqual("Undone");
    });

    test("stops on failure, fails inside the composite command", async () => {
      const GenerateStringAndFail = compose<GenerateStringContext>(
        GenerateStringCommand,
        FailCommand
      );

      const context = { success: true, string: "", value: 0 };
      const result = await run<typeof context>(
        context,
        GenerateStringAndFail,
        AddTwoCommand
      );

      expect(result.success).toEqual(false);
      expect(result.string).toEqual("Undone");
      expect(result.value).toEqual(0);
    });
  });
});
