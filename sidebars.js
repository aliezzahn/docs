// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  build: [
    "build/introduction",
    "build/get-started",
    "build/fundamentals",
    "build/develop-services",
    // {
    //   type: "category",
    //   label: "Quickstart",
    //   items: [
    //     "build/fundamentals",
    //     "build/develop-services",
    //     // "build/develop-distributed-algos"
    //   ],
    // },
    {
      type: "category",
      label: "Working with data",
      link: { id: "build/working-with-data", type: "doc" },
      items: [
        "build/local-data-storage",
        // "build/remote-data-storage",
        // "build/data-acquisition"
      ],
    },
    {
      type: "category",
      label: "Fluence JS Client",
      link: { id: "build/js-client/js-client", type: "doc" },
      items: [
        "build/js-client/installation",
        "build/js-client/setting-up",
        "build/js-client/hello-world",
        "build/js-client/advanced-ipfs",
        "build/js-client/marine-js",
      ],
    },
    // "build/thinking-in-aqua-marine/thinking-in-aqua-marine",
    "build/concepts/concepts",
    "build/security",
    "build/limits",
    "build/glossary",
    "build/reference",
  ],
  learn: [
    "learn/overview",
    "learn/how-it-works",
    "learn/why-fluence",
    "learn/fluence-comparison",
    "learn/use-cases",
    "learn/fluence-token",
    "learn/governance",
  ],
  "aqua-book": [
    "aqua-book/introduction",
    {
      type: "category",
      label: "Getting Started",
      link: { id: "aqua-book/getting-started/getting-started", type: "doc" },
      items: [
        "aqua-book/getting-started/installation/installation",
        "aqua-book/getting-started/quick-start",
      ],
    },
    {
      type: "category",
      label: "Language",
      link: { id: "aqua-book/language/language", type: "doc" },
      items: [
        "aqua-book/language/types",
        "aqua-book/language/values",
        "aqua-book/language/topology",
        {
          type: "category",
          label: "Execution flow",
          link: { id: "aqua-book/language/flow/flow", type: "doc" },
          items: [
            "aqua-book/language/flow/sequential",
            "aqua-book/language/flow/conditional",
            "aqua-book/language/flow/parallel",
            "aqua-book/language/flow/iterative",
          ],
        },
        "aqua-book/language/crdt-streams",
        "aqua-book/language/closures",
        {
          type: "category",
          label: "Imports and Exports",
          link: { id: "aqua-book/language/header/header", type: "doc" },
          items: ["aqua-book/language/header/control-scope-and-visibility"],
        },
        {
          type: "category",
          label: "Expressions",
          link: {
            id: "aqua-book/language/expressions/expressions",
            type: "doc",
          },
          items: [
            "aqua-book/language/expressions/header",
            "aqua-book/language/expressions/functions",
            "aqua-book/language/expressions/services",
            "aqua-book/language/expressions/overridable-constants",
          ],
        },
        "aqua-book/language/services",
        "aqua-book/language/abilities",
      ],
    },
    {
      type: "category",
      label: "Libraries",
      link: { id: "aqua-book/libraries/libraries", type: "doc" },
      items: [
        "aqua-book/libraries/aqua-lib",
        "aqua-book/libraries/aqua-ipfs",
        "aqua-book/libraries/registry",
      ],
    },
    "aqua-book/aqua-js-api",
    "aqua-book/changelog",
  ],
  "marine-book": [
    {
      type: "html",
      value: `<img src="/img/marine.jpg" alt="Marine logo" style="padding: 11px;" />`,
    },
    "marine-book/introduction",
    "marine-book/basic-concepts/basic-concepts",
    {
      type: "category",
      label: "🚴 Quick Start",
      link: { id: "marine-book/quick-start/quick-start", type: "doc" },
      items: [
        "marine-book/quick-start/setting-up-the-development-environment",
        "marine-book/quick-start/develop-a-single-module-service",
        "marine-book/quick-start/develop-a-multi-modules-service",
      ],
    },
    {
      type: "category",
      label: "Marine Runtime",
      link: { id: "marine-book/marine-runtime/marine-runtime", type: "doc" },
      items: [
        {
          type: "category",
          label: "Architecture",
          link: {
            id: "marine-book/marine-runtime/architecture/architecture/architecture",
            type: "doc",
          },
          items: [
            "marine-book/marine-runtime/architecture/core/core",
            "marine-book/marine-runtime/architecture/marine-js/marine-js",
            "marine-book/marine-runtime/architecture/interface-types-instructions",
          ],
        },
        "marine-book/marine-runtime/i-value-and-i-type",
        "marine-book/marine-runtime/host-exports",
        "marine-book/marine-runtime/mounted-binaries",
        "marine-book/marine-runtime/module-types/module-types",
        "marine-book/marine-runtime/configuration-file",
        {
          type: "category",
          label: "API",
          link: {
            id: "marine-book/marine-runtime/api/api",
            type: "doc",
          },
          items: [
            "marine-book/marine-runtime/api/marine-api",
            "marine-book/marine-runtime/api/marine-js-api",
            "marine-book/marine-runtime/api/core-api",
          ],
        },
      ],
    },
    {
      type: "category",
      label: "Marine Rust SDK",
      link: { id: "marine-book/marine-rust-sdk/marine-rust-sdk", type: "doc" },
      items: [
        {
          type: "category",
          label: "Developing",
          link: {
            id: "marine-book/marine-rust-sdk/developing/developing",
            type: "doc",
          },
          items: [
            "marine-book/marine-rust-sdk/developing/export-functions",
            "marine-book/marine-rust-sdk/developing/import-functions",
            "marine-book/marine-rust-sdk/developing/structures",
            "marine-book/marine-rust-sdk/developing/module-manifest",
            "marine-book/marine-rust-sdk/developing/call-parameters",
            "marine-book/marine-rust-sdk/developing/mounted-binaries",
            "marine-book/marine-rust-sdk/developing/logging",
            "marine-book/marine-rust-sdk/developing/environment-variables",
          ],
        },
        {
          type: "category",
          label: "Testing & Debugging",
          link: {
            id: "marine-book/marine-rust-sdk/testing-and-debugging/testing-and-debugging",
            type: "doc",
          },
          items: [
            "marine-book/marine-rust-sdk/testing-and-debugging/testing-a-module",
            "marine-book/marine-rust-sdk/testing-and-debugging/testing-a-service",
            "marine-book/marine-rust-sdk/testing-and-debugging/using-cargo-build-scripts",
            "marine-book/marine-rust-sdk/testing-and-debugging/internal-debugging-api",
          ],
        },
        "marine-book/marine-rust-sdk/module-abi",
      ],
    },
    {
      type: "category",
      label: "Marine Tooling Reference",
      link: {
        id: "marine-book/marine-tooling-reference/marine-tooling-reference",
        type: "doc",
      },
      items: [
        "marine-book/marine-tooling-reference/marine-repl",
        "marine-book/marine-tooling-reference/marine-cli",
      ],
    },
    "marine-book/changelog",
  ],
};

module.exports = sidebars;
