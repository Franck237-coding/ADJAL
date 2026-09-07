import { defineConfig, InputTransformerFn } from "orval";
import path from "node:path";

const titleTransformer: InputTransformerFn = (config) => {
  config.info ??= {};
  config.info.title = "Api";
  return config;
};

export default defineConfig({
  "react": {
    input: { target: "./openapi.yaml", override: { transformer: titleTransformer } },
    output: {
      workspace: path.resolve("src/react"),
      target: "generated",
      client: "react-query",
      mode: "split",
      baseUrl: "/api",
      clean: true,
      prettier: true,
      override: {
        fetch: { includeHttpResponseReturnType: false },
        mutator: {
          path: path.resolve("src/react/custom-fetch.ts"),
          name: "customFetch",
        },
      },
    },
  },
  "zod": {
    input: { target: "./openapi.yaml", override: { transformer: titleTransformer } },
    output: {
      workspace: path.resolve("src/zod"),
      client: "zod",
      target: "generated",
      schemas: { path: "generated/types", type: "typescript" },
      mode: "split",
      clean: true,
      prettier: true,
      override: {
        zod: {
          coerce: {
            query: ["boolean", "number", "string"],
            param: ["boolean", "number", "string"],
            body: ["bigint", "date"],
            response: ["bigint", "date"],
          },
        },
        useDates: true,
        useBigInt: true,
      },
    },
  },
});
