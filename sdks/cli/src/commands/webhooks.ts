import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { InmovaClient } from '@inmova/sdk';
import { getConfig } from '../utils/config';
import { outputTable, outputJson, success, error } from '../utils/output';

export const webhooksCommand = new Command('webhooks')
  .alias('hooks')
  .description('Manage webhooks');

webhooksCommand
  .command('list')
  .description('List webhook subscriptions')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    const config = getConfig();
    if (!config.apiKey) {
      error('Not authenticated. Run "inmova auth login" first.');
      process.exit(1);
    }

    const spinner = ora('Fetching webhooks...').start();

    try {
      const client = new InmovaClient({ apiKey: config.apiKey });
      const webhooks = await client.webhooks.list();

      spinner.succeed(`Found ${webhooks.length} webhooks`);

      if (options.json) {
        outputJson(webhooks);
      } else {
        outputTable(
          ['ID', 'URL', 'Events', 'Active', 'Created'],
          webhooks.map((hook) => [
            hook.id.substring(0, 8),
            hook.url.substring(0, 50) + (hook.url.length > 50 ? '...' : ''),
            hook.events.length.toString() + ' events',
            hook.active ? chalk.green('Yes') : chalk.red('No'),
            new Date(hook.createdAt).toLocaleDateString(),
          ])
        );
      }
    } catch (err: any) {
      spinner.fail('Error fetching webhooks');
      error(err.message || 'Unknown error');
      process.exit(1);
    }
  });

webhooksCommand
  .command('create')
  .description('Create a webhook subscription')
  .requiredOption('--url <url>', 'Webhook URL')
  .requiredOption(
    '--events <events>',
    'Comma-separated events (e.g., PROPERTY_CREATED,CONTRACT_SIGNED)'
  )
  .option('--description <text>', 'Webhook description')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    const config = getConfig();
    if (!config.apiKey) {
      error('Not authenticated. Run "inmova auth login" first.');
      process.exit(1);
    }

    const spinner = ora('Creating webhook...').start();

    try {
      const client = new InmovaClient({ apiKey: config.apiKey });

      const events = options.events.split(',').map((e: string) => e.trim());

      const webhook = await client.webhooks.create({
        url: options.url,
        events: events as any,
        description: options.description,
      });

      spinner.succeed('Webhook created successfully!');

      if (options.json) {
        outputJson(webhook);
      } else {
        success('\n🪝 New Webhook Created\n');
        console.log(chalk.yellow('⚠️  IMPORTANT: Save this secret for signature verification!\n'));
        console.log(chalk.cyan(`Secret: ${chalk.bold(webhook.secret)}\n`));
        console.log(`URL:    ${webhook.url}`);
        console.log(`Events: ${webhook.events.join(', ')}`);
      }
    } catch (err: any) {
      spinner.fail('Error creating webhook');
      error(err.message || 'Unknown error');
      process.exit(1);
    }
  });

webhooksCommand
  .command('delete')
  .description('Delete a webhook subscription')
  .argument('<id>', 'Webhook ID')
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
          message: `Are you sure you want to delete webhook ${id}?`,
          default: false,
        },
      ]);

      if (!confirm) {
        console.log('Cancelled');
        process.exit(0);
      }
    }

    const spinner = ora('Deleting webhook...').start();

    try {
      const client = new InmovaClient({ apiKey: config.apiKey });
      await client.webhooks.delete(id);

      spinner.succeed('Webhook deleted successfully!');
    } catch (err: any) {
      spinner.fail('Error deleting webhook');
      error(err.message || 'Unknown error');
      process.exit(1);
    }
  });
