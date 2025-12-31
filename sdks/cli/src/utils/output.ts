import Table from 'cli-table3';
import chalk from 'chalk';

export function outputTable(headers: string[], rows: string[][]): void {
  const table = new Table({
    head: headers.map((h) => chalk.cyan(h)),
    style: {
      head: [],
      border: [],
    },
  });

  rows.forEach((row) => table.push(row));
  console.log(table.toString());
}

export function outputJson(data: any): void {
  console.log(JSON.stringify(data, null, 2));
}

export function success(message: string): void {
  console.log(chalk.green(`✅ ${message}`));
}

export function error(message: string): void {
  console.error(chalk.red(`❌ ${message}`));
}

export function warning(message: string): void {
  console.warn(chalk.yellow(`⚠️  ${message}`));
}

export function info(message: string): void {
  console.log(chalk.blue(`ℹ️  ${message}`));
}
