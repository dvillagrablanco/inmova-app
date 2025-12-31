import { Command } from 'commander';
import ora from 'ora';
import { InmovaClient } from '@inmova/sdk';
import { getConfig } from '../utils/config';
import { outputTable, outputJson, success, error } from '../utils/output';

export const propertiesCommand = new Command('properties')
  .alias('props')
  .description('Manage properties');

propertiesCommand
  .command('list')
  .description('List properties')
  .option('--city <city>', 'Filter by city')
  .option('--status <status>', 'Filter by status (AVAILABLE, RENTED, MAINTENANCE, SOLD)')
  .option('--type <type>', 'Filter by type (APARTMENT, HOUSE, ROOM, etc.)')
  .option('--limit <number>', 'Limit results', '20')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    const config = getConfig();
    if (!config.apiKey) {
      error('Not authenticated. Run "inmova auth login" first.');
      process.exit(1);
    }

    const spinner = ora('Fetching properties...').start();

    try {
      const client = new InmovaClient({ apiKey: config.apiKey });

      const result = await client.properties.list({
        city: options.city,
        status: options.status,
        type: options.type,
        limit: parseInt(options.limit),
      });

      spinner.succeed(`Found ${result.pagination.total} properties`);

      if (options.json) {
        outputJson(result);
      } else {
        outputTable(
          ['ID', 'Address', 'City', 'Price', 'Rooms', 'Status', 'Type'],
          result.data.map((prop) => [
            prop.id.substring(0, 8),
            prop.address,
            prop.city,
            `${prop.price}€`,
            prop.rooms?.toString() || '-',
            prop.status,
            prop.type,
          ])
        );
      }
    } catch (err: any) {
      spinner.fail('Error fetching properties');
      error(err.message || 'Unknown error');
      process.exit(1);
    }
  });

propertiesCommand
  .command('get')
  .description('Get property by ID')
  .argument('<id>', 'Property ID')
  .option('--json', 'Output as JSON')
  .action(async (id, options) => {
    const config = getConfig();
    if (!config.apiKey) {
      error('Not authenticated. Run "inmova auth login" first.');
      process.exit(1);
    }

    const spinner = ora('Fetching property...').start();

    try {
      const client = new InmovaClient({ apiKey: config.apiKey });
      const property = await client.properties.get(id);

      spinner.succeed('Property found');

      if (options.json) {
        outputJson(property);
      } else {
        console.log('\n');
        console.log(`ID:          ${property.id}`);
        console.log(`Address:     ${property.address}`);
        console.log(`City:        ${property.city}`);
        console.log(`Price:       ${property.price}€/month`);
        console.log(`Rooms:       ${property.rooms || 'N/A'}`);
        console.log(`Bathrooms:   ${property.bathrooms || 'N/A'}`);
        console.log(`Size:        ${property.squareMeters || 'N/A'} m²`);
        console.log(`Status:      ${property.status}`);
        console.log(`Type:        ${property.type}`);
        if (property.description) {
          console.log(`Description: ${property.description}`);
        }
      }
    } catch (err: any) {
      spinner.fail('Error fetching property');
      error(err.message || 'Unknown error');
      process.exit(1);
    }
  });

propertiesCommand
  .command('create')
  .description('Create a new property')
  .requiredOption('--address <address>', 'Property address')
  .requiredOption('--city <city>', 'City')
  .requiredOption('--price <price>', 'Monthly price (€)')
  .requiredOption('--type <type>', 'Property type')
  .option('--postal-code <code>', 'Postal code')
  .option('--country <country>', 'Country')
  .option('--rooms <number>', 'Number of rooms')
  .option('--bathrooms <number>', 'Number of bathrooms')
  .option('--square-meters <number>', 'Square meters')
  .option('--floor <number>', 'Floor number')
  .option('--status <status>', 'Status (default: AVAILABLE)', 'AVAILABLE')
  .option('--description <text>', 'Description')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    const config = getConfig();
    if (!config.apiKey) {
      error('Not authenticated. Run "inmova auth login" first.');
      process.exit(1);
    }

    const spinner = ora('Creating property...').start();

    try {
      const client = new InmovaClient({ apiKey: config.apiKey });

      const property = await client.properties.create({
        address: options.address,
        city: options.city,
        price: parseFloat(options.price),
        type: options.type,
        postalCode: options.postalCode,
        country: options.country,
        rooms: options.rooms ? parseInt(options.rooms) : undefined,
        bathrooms: options.bathrooms ? parseInt(options.bathrooms) : undefined,
        squareMeters: options.squareMeters ? parseFloat(options.squareMeters) : undefined,
        floor: options.floor ? parseInt(options.floor) : undefined,
        status: options.status,
        description: options.description,
      });

      spinner.succeed('Property created successfully!');

      if (options.json) {
        outputJson(property);
      } else {
        success(`\nProperty ID: ${property.id}`);
        console.log(`Address:     ${property.address}`);
        console.log(`Price:       ${property.price}€/month`);
        console.log(`View:        https://inmovaapp.com/properties/${property.id}`);
      }
    } catch (err: any) {
      spinner.fail('Error creating property');
      error(err.message || 'Unknown error');
      process.exit(1);
    }
  });

propertiesCommand
  .command('update')
  .description('Update a property')
  .argument('<id>', 'Property ID')
  .option('--price <price>', 'New price')
  .option('--status <status>', 'New status')
  .option('--description <text>', 'New description')
  .option('--json', 'Output as JSON')
  .action(async (id, options) => {
    const config = getConfig();
    if (!config.apiKey) {
      error('Not authenticated. Run "inmova auth login" first.');
      process.exit(1);
    }

    const updateData: any = {};
    if (options.price) updateData.price = parseFloat(options.price);
    if (options.status) updateData.status = options.status;
    if (options.description) updateData.description = options.description;

    if (Object.keys(updateData).length === 0) {
      error('No update data provided. Use --price, --status, or --description');
      process.exit(1);
    }

    const spinner = ora('Updating property...').start();

    try {
      const client = new InmovaClient({ apiKey: config.apiKey });
      const property = await client.properties.update(id, updateData);

      spinner.succeed('Property updated successfully!');

      if (options.json) {
        outputJson(property);
      } else {
        success(`\nProperty ${property.id} updated`);
        console.log(`Address: ${property.address}`);
        console.log(`Price:   ${property.price}€/month`);
        console.log(`Status:  ${property.status}`);
      }
    } catch (err: any) {
      spinner.fail('Error updating property');
      error(err.message || 'Unknown error');
      process.exit(1);
    }
  });

propertiesCommand
  .command('delete')
  .description('Delete a property')
  .argument('<id>', 'Property ID')
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
          message: `Are you sure you want to delete property ${id}?`,
          default: false,
        },
      ]);

      if (!confirm) {
        console.log('Cancelled');
        process.exit(0);
      }
    }

    const spinner = ora('Deleting property...').start();

    try {
      const client = new InmovaClient({ apiKey: config.apiKey });
      await client.properties.delete(id);

      spinner.succeed('Property deleted successfully!');
    } catch (err: any) {
      spinner.fail('Error deleting property');
      error(err.message || 'Unknown error');
      process.exit(1);
    }
  });
