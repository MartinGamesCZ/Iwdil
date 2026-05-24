#!/usr/bin/env bun

import { LoginCommand } from "./commands/login";
import { QuickCreateCommand } from "./commands/qc";

const subcommand = process.argv[2];

switch (subcommand) {
  case "qc":
    await QuickCreateCommand.run();
    break;

  case "login":
    await LoginCommand.run();
    break;

  default:
    console.error("Error: Subcommand not found");
    process.exit();
}
