import Conf from 'conf';
import path from 'path';
import os from 'os';

interface InmovaConfig {
  apiKey?: string;
  baseURL?: string;
  defaultFormat?: 'json' | 'table';
}

const config = new Conf<InmovaConfig>({
  projectName: 'inmova-cli',
  configName: 'config',
  cwd: path.join(os.homedir(), '.inmova'),
});

export function getConfig(): InmovaConfig {
  return {
    apiKey: config.get('apiKey'),
    baseURL: config.get('baseURL', 'https://inmovaapp.com/api/v1'),
    defaultFormat: config.get('defaultFormat', 'table'),
  };
}

export function setApiKey(apiKey: string): void {
  config.set('apiKey', apiKey);
}

export function setBaseURL(url: string): void {
  config.set('baseURL', url);
}

export function clearConfig(): void {
  config.clear();
}

export function getApiKey(): string | undefined {
  return config.get('apiKey');
}
