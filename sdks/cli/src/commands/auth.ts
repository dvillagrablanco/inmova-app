import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import { InmovaClient } from '@inmova/sdk';
import { setApiKey, clearConfig, getConfig } from '../utils/config';
import { success, error, info } from '../utils/output';

export const authCommand = new Command('auth').description('Authentication commands');

authCommand
  .command('login')
  .description('Login with API key')
  .option('--api-key <key>', 'API key (skip prompt)')
  .action(async (options) => {
    let apiKey = options.apiKey;

    if (!apiKey) {
      const answers = await inquirer.prompt([
        {
          type: 'password',
          name: 'apiKey',
          message: 'Enter your API key:',
          validate: (input) => (input.length > 0 ? true : 'API key is required'),
        },
      ]);
      apiKey = answers.apiKey;
    }

    const spinner = ora('Validating API key...').start();

    try {
      const client = new InmovaClient({ apiKey });
      await client.properties.list({ limit: 1 });

      spinner.succeed('API key validated successfully!');
      setApiKey(apiKey);
      success('You are now authenticated!');
    } catch (err: any) {
      spinner.fail('Invalid API key');
      error(err.message || 'Authentication failed');
      process.exit(1);
    }
  });

authCommand
  .command('logout')
  .description('Logout (remove stored API key)')
  .action(() => {
    clearConfig();
    success('Logged out successfully');
  });

authCommand
  .command('whoami')
  .description('Show current authentication status')
  .action(() => {
    const config = getConfig();

    if (config.apiKey) {
      info(`Authenticated with API key: ${config.apiKey.substring(0, 15)}...`);
      info(`Base URL: ${config.baseURL}`);
    } else {
      warning('Not authenticated. Run "inmova auth login" to authenticate.');
    }
  });
