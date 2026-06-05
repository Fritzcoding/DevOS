import assert from "node:assert/strict";
import { message } from "../src/index.js";

assert.equal(message(), "env-builder sample ok");
console.log("env-builder sample ok");
