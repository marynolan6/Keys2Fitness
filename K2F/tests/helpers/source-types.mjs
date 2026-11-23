import { registerHooks } from "node:module";

// Match Metro's extensionless TypeScript imports in Node's strip-types runner.
const source = new URL("../../src/", import.meta.url).href;
export function registerSourceTypes() {
  return registerHooks({ resolve(specifier, context, next) {
    return next(context.parentURL?.startsWith(source) && specifier.startsWith(".") && !/\.[a-z]+$/.test(specifier)
      ? specifier + ".ts" : specifier, context);
  } });
}
