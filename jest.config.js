/** @type {import('ts-jest').JestConfigWithTsJest} **/
export default {
  testEnvironment: "jsdom",
  testRegex: "\\.test\\.ts$",
  transform: {
    "^.+\.ts$": ["ts-jest", {}],
  },
};