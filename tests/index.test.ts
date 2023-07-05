import { Command, Context, run, compose, cond } from "../src/index";

describe("commands", () => {
  interface GenerateNumberContext extends Context {
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

  interface AddTwoContext extends Context {
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

  interface GenerateStringContext extends Context {
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
      this.context.string = "Undone";
    }
  }

  class AsyncAddTwoCommand implements Command {
    context: AddTwoContext;

    constructor(context: AddTwoContext) {
      this.context = context;
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

  class FailCommand implements Command {
    context: Context;

    constructor(context: Context) {
      this.context = context;
    }

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

  describe("cond", () => {
    it("generates based on context", async () => {
      const context = { success: true, value: 0, string: "", foo: true };

      interface GenerateNumberOrCommandBasedOnFooContext extends Context {
        foo: boolean;
      }

      const GenerateNumberOrCommandBasedOnFoo = cond<
        GenerateNumberOrCommandBasedOnFooContext &
          GenerateNumberContext &
          GenerateStringContext
      >((ctx) => (ctx.foo ? GenerateNumberCommand : GenerateStringCommand));

      const { value, string } = await run<typeof context>(
        context,
        GenerateNumberOrCommandBasedOnFoo
      );

      expect(value).toEqual(2);
      expect(string).toEqual("");
    });

    it("generates based on context again", async () => {
      const context = { success: true, value: 0, string: "", foo: false };

      const { value, string } = await run<typeof context>(
        context,
        cond<typeof context>((ctx) =>
          ctx.foo ? GenerateNumberCommand : GenerateStringCommand
        )
      );

      expect(value).toEqual(0);
      expect(string).toEqual("Hello");
    });

    it("can undo", async () => {
      const context = { success: true, value: 0, string: "", foo: false };

      const { value, string } = await run<typeof context>(
        context,
        cond<typeof context>((ctx) =>
          ctx.foo ? GenerateNumberCommand : GenerateStringCommand
        ),
        FailCommand
      );

      expect(value).toEqual(0);
      expect(string).toEqual("Undone");
    });

    it("can be composed", async () => {
      const context = { success: true, value: 0, string: "", foo: false };

      const Composed = compose(
        GenerateNumberCommand,
        cond<typeof context>(() => GenerateStringCommand),
        FailCommand
      );
      const { value, string } = await run<typeof context>(context, Composed);

      expect(value).toEqual(2);
      expect(string).toEqual("Undone");
    });
  });
});
