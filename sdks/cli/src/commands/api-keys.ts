import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { InmovaClient } from '@inmova/sdk';
import { getConfig } from '../utils/config';
import { outputTable, outputJson, success, error, warning } from '../utils/output';

export const apiKeysCommand = new Command('api-keys').alias('keys').description('Manage API keys');

apiKeysCommand
  .command('list')
  .description('List API keys')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    const config = getConfig();
    if (!config.apiKey) {
      error('Not authenticated. Run "inmova auth login" first.');
      process.exit(1);
    }

    const spinner = ora('Fetching API keys...').start();

    try {
      const client = new InmovaClient({ apiKey: config.apiKey });
      const keys = await client.apiKeys.list();

      spinner.succeed(`Found ${keys.length} API keys`);

      if (options.json) {
        outputJson(keys);
      } else {
        outputTable(
          ['ID', 'Name', 'Prefix', 'Status', 'Rate Limit', 'Created'],
          keys.map((key) => [
            key.id.substring(0, 8),
            key.name,
            key.keyPrefix + '***',
            key.status === 'ACTIVE' ? chalk.green(key.status) : chalk.red(key.status),
            key.rateLimit.toString(),
            new Date(key.createdAt).toLocaleDateString(),
          ])
        );
      }
    } catch (err: any) {
      spinner.fail('Error fetching API keys');
      error(err.message || 'Unknown error');
      process.exit(1);
    }
  });

apiKeysCommand
  .command('create')
  .description('Create a new API key')
  .requiredOption('--name <name>', 'Key name')
  .option('--description <text>', 'Key description')
  .option('--scopes <scopes>', 'Comma-separated scopes', 'properties:read,properties:write')
  .option('--rate-limit <number>', 'Rate limit (requests/minute)', '1000')
  .option('--expires-at <date>', 'Expiration date (ISO 8601)')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    const config = getConfig();
    if (!config.apiKey) {
      error('Not authenticated. Run "inmova auth login" first.');
      process.exit(1);
    }

    const spinner = ora('Creating API key...').start();

    try {
      const client = new InmovaClient({ apiKey: config.apiKey });

      const scopes = options.scopes.split(',').map((s: string) => s.trim());

      const key = await client.apiKeys.create({
        name: options.name,
        description: options.description,
        scopes,
        rateLimit: parseInt(options.rateLimit),
        expiresAt: options.expiresAt,
      });

      spinner.succeed('API key created successfully!');

      if (options.json) {
        outputJson(key);
      } else {
        success('\n🔑 New API Key Created\n');
        console.log(chalk.yellow("⚠️  IMPORTANT: Save this key now. You won't see it again!\n"));
        console.log(chalk.cyan(`API Key: ${chalk.bold(key.key)}\n`));
        console.log(`Name:        ${key.name}`);
        console.log(`Scopes:      ${key.scopes.join(', ')}`);
        console.log(`Rate Limit:  ${key.rateLimit} req/min`);
        if (key.expiresAt) {
          console.log(`Expires:     ${new Date(key.expiresAt).toLocaleDateString()}`);
        }
      }
    } catch (err: any) {
      spinner.fail('Error creating API key');
      error(err.message || 'Unknown error');
      process.exit(1);
    }
  });

apiKeysCommand
  .command('revoke')
  .description('Revoke an API key')
  .argument('<id>', 'Key ID')
  .option('--yes', 'Skip confirmation')
  .action(async (id, options) => {
    const config = getConfig();
    if (!config.apiKey) {
      error('Not authenticated. Run "inmova auth login" first.');
      process.exit(1);
    }

    if (!options.yes) {
      const inquirer = (await import('inquirer')).default;
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: `Are you sure you want to revoke API key ${id}?`,
          default: false,
        },
      ]);

      if (!confirm) {
        console.log('Cancelled');
        process.exit(0);
      }
    }

    const spinner = ora('Revoking API key...').start();

    try {
      const client = new InmovaClient({ apiKey: config.apiKey });
      await client.apiKeys.revoke(id);

      spinner.succeed('API key revoked successfully!');
      warning('This key can no longer be used to authenticate');
    } catch (err: any) {
      spinner.fail('Error revoking API key');
      error(err.message || 'Unknown error');
      process.exit(1);
    }
  });
