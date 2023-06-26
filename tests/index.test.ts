import { Command, Runner } from "../src/index";

test("works", () => {
  interface GenerateNumberContext {
    success: boolean;
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

  interface AddTwoContext {
    success: boolean;
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

  interface GenerateStringContext {
    success: boolean;
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
  }

  // Compose
  const context = { success: true, value: 0, string: "" };
  const generateNumber = new GenerateNumberCommand(context);
  const addTwo = new AddTwoCommand(context);
  const generateString = new GenerateStringCommand(context);
  const runner = new Runner(generateNumber, addTwo, generateString);
  runner.execute();
  console.log(context);
});
