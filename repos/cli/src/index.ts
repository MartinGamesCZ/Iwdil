#!/usr/bin/env bun

import { DaemonCommand } from "./commands/daemon";
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

  case "daemon":
    await DaemonCommand.run();
    break;

  default:
    console.error("Error: Subcommand not found");
    process.exit();
}
