const mocha = require("eslint-plugin-mocha");
const globals = require("globals");
const js = require("@eslint/js");

const {
    FlatCompat,
} = require("@eslint/eslintrc");

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

module.exports = [{
    ignores: [
        // this needs to combine all other eslintignore files so that lint-staged knows what to ignore
        "packages/cli/scaffold/*.js",
        "packages/cli/src/generators/templates/**/*.template.js",
        "**/.yarn",
        "example-apps/onedrive/test/*",

    ],
}, ...compat.extends("eslint:recommended", "standard", "prettier"), {
    plugins: {
        mocha,
    },

    languageOptions: {
        globals: {
            ...globals.node,
        },
    },
}, {
    files: [
        "packages/*/test/**/*.js",
        "packages/*/smoke-test/**/*.js",
        "packages/*/integration-test/**/*.js",
        "packages/cli/src/tests/**/*.js",
        "packages/cli/src/smoke-tests/**/*.js",
    ],

    languageOptions: {
        globals: {
            ...globals.mocha,
        },
    },

    rules: {
        "mocha/no-exclusive-tests": "error",
    },
}, {
    files: ["packages/cli/snippets/**/*.js"],

    languageOptions: {
        globals: {
            ...globals.mocha,
        },
    },

    rules: {
        "no-unused-vars": 0,
    },
}, {
    files: ["example-apps/minimal-esm/*"],

    languageOptions: {
        ecmaVersion: 2025,
        globals: {
            ...globals.mocha,
        },
        sourceType: "module",
    },

    rules: {
        "no-unused-vars": 0,
    },
}];
