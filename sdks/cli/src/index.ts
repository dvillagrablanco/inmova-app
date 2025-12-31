#!/usr/bin/env node

import { Command } from 'commander';
import { authCommand } from './commands/auth';
import { propertiesCommand } from './commands/properties';
import { apiKeysCommand } from './commands/api-keys';
import { webhooksCommand } from './commands/webhooks';

const program = new Command();

program.name('inmova').description('Official CLI for Inmova PropTech API').version('1.0.0');

// Add commands
program.addCommand(authCommand);
program.addCommand(propertiesCommand);
program.addCommand(apiKeysCommand);
program.addCommand(webhooksCommand);

// Global options
program.option('--verbose', 'Verbose output');

program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
