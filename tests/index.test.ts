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

  class FailCommand extends Command {
    execute() {
      this.context.success = false;
    }
  }

  test("run", () => {
    const context = { success: true, value: 0, string: "" };

    const result = run<typeof context>(
      context,
      GenerateNumberCommand,
      AddTwoCommand,
      GenerateStringCommand
    );

    expect(result.success).toEqual(true);
    expect(result.value).toEqual(4);
    expect(result.string).toEqual("Hello");
  });

  test("stops on failure", () => {
    const context = { success: true, value: 0 };

    const result = run<typeof context>(
      context,
      GenerateNumberCommand,
      FailCommand,
      AddTwoCommand
    );

    expect(result.success).toEqual(false);
    expect(result.value).toEqual(2);
  });

  test("undo", () => {
    const context = { success: true, string: "" };

    const result = run<typeof context>(
      context,
      GenerateStringCommand,
      FailCommand
    );

    expect(result.success).toEqual(false);
    expect(result.string).toEqual("Undone");
  });

  describe("compose", () => {
    test("compose", () => {
      const GenerateAndAddTwo = compose<GenerateNumberContext & AddTwoContext>(
        GenerateNumberCommand,
        AddTwoCommand
      );

      const context = { success: true, value: 0 };
      const result = run<typeof context>(context, GenerateAndAddTwo);

      expect(result.success).toBe(true);
      expect(result.value).toEqual(4);
    });

    test("run", () => {
      const GenerateAndAddTwo = compose<GenerateNumberContext & AddTwoContext>(
        GenerateNumberCommand,
        AddTwoCommand
      );

      const context = { success: true, value: 0, string: "" };
      const result = run<typeof context>(
        context,
        GenerateAndAddTwo,
        GenerateStringCommand
      );

      expect(result.success).toBe(true);
      expect(result.value).toEqual(4);
      expect(result.string).toEqual("Hello");
    });

    test("another run", () => {
      const GenerateNumberAndString = compose<
        GenerateNumberContext & GenerateStringContext
      >(GenerateNumberCommand, GenerateStringCommand);

      const context = { success: true, value: 0, string: "" };
      const result = run<typeof context>(
        context,
        GenerateNumberAndString,
        AddTwoCommand
      );

      expect(result.success).toBe(true);
      expect(result.value).toEqual(4);
      expect(result.string).toEqual("Hello");
    });

    test("can undo", () => {
      const GenerateNumberAndString = compose<
        GenerateNumberContext & GenerateStringContext
      >(GenerateNumberCommand, GenerateStringCommand);

      const context = { success: true, value: 0, string: "" };
      const result = run<typeof context>(
        context,
        GenerateNumberAndString,
        FailCommand
      );

      expect(result.success).toBe(false);
      expect(result.value).toEqual(2);
      expect(result.string).toEqual("Undone");
    });

    test("stops on failure", () => {
      const GenerateNumberAndString = compose<
        GenerateNumberContext & GenerateStringContext
      >(GenerateNumberCommand, GenerateStringCommand);

      const context = { success: true, value: 0, string: "" };
      const result = run<typeof context>(
        context,
        GenerateNumberAndString,
        FailCommand,
        AddTwoCommand
      );

      expect(result.success).toEqual(false);
      expect(result.value).toEqual(2);
      expect(result.string).toEqual("Undone");
    });

    test("stops on failure, fails inside the composite command", () => {
      const GenerateStringAndFail = compose<GenerateStringContext>(
        GenerateStringCommand,
        FailCommand
      );

      const context = { success: true, string: "", value: 0 };
      const result = run<typeof context>(
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
