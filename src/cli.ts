#!/usr/bin/env node

import { Retrieve } from './retrieve';
import { writeFileSync } from 'fs';
import { join } from 'path';

interface CLIOptions {
  output?: string;
  pretty?: boolean;
  help?: boolean;
}

export function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);
  const options: CLIOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '-o':
      case '--output':
        options.output = args[++i];
        break;
      case '-p':
      case '--pretty':
        options.pretty = true;
        break;
      case '-h':
      case '--help':
        options.help = true;
        break;
      default:
        if (arg.startsWith('-')) {
          console.error(`Unknown option: ${arg}`);
          process.exit(1);
        }
        break;
    }
  }

  return options;
}

export function printHelp(): void {
  console.log(`
Retrieves a list of TSE from BSI

Usage: tse-id-js [options]

Options:
  -o, --output <file>    Output file path (default: stdout)
  -p, --pretty          Pretty print JSON output
  -h, --help            Show this help message

Examples:
  tse-id-js                    # Output to stdout
  tse-id-js -p                 # Pretty print to stdout
  tse-id-js -o data.json       # Save to file
  tse-id-js -o data.json -p    # Save pretty printed JSON to file
`);
}

export function stringifyWithEscaping(obj: any, pretty: boolean = false): string {
  // Use post-processing approach to avoid double escaping
  let jsonString = JSON.stringify(obj, null, pretty ? 4 : 0);
  
  // Post-process to escape forward slashes to match example.json format
  jsonString = jsonString.replaceAll('/', '\\/');
  
  // Post-process to escape unicode characters
  jsonString = jsonString.replace(/[\u007f-\uffff]/g, (c: string) => {
    const codePoint = c.charCodeAt(0);
    return '\\u' + codePoint.toString(16).padStart(4, '0');
  });
  
  return jsonString;
}

// Alternative native approach 2: Post-processing (less efficient but more straightforward)
export function stringifyWithPostProcessing(obj: any, pretty: boolean = false): string {
  let jsonString = JSON.stringify(obj, null, pretty ? 4 : 0);
  
  // Post-process to escape forward slashes
  jsonString = jsonString.replaceAll('/', '\\/');
  
  // Post-process to escape unicode characters
  jsonString = jsonString.replace(/[\u007f-\uffff]/g, (c: string) => {
    const codePoint = c.charCodeAt(0);
    return '\\u' + codePoint.toString(16).padStart(4, '0');
  });
  
  return jsonString;
}

// Alternative native approach 3: Using toJSON method (requires object modification)
export function createEscapingObject(obj: any): any {
  if (typeof obj === 'object' && obj !== null) {
    if (Array.isArray(obj)) {
      return obj.map(createEscapingObject);
    } else {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
          result[key] = {
            toJSON() {
              return value.replaceAll('/', '\\/').replace(/[\u007f-\uffff]/g, (c: string) => {
                const codePoint = c.charCodeAt(0);
                return '\\u' + codePoint.toString(16).padStart(4, '0');
              });
            }
          };
        } else {
          result[key] = createEscapingObject(value);
        }
      }
      return result;
    }
  }
  return obj;
}

async function main(): Promise<void> {
  const options = parseArgs();

  if (options.help) {
    printHelp();
    return;
  }

  try {
    console.log('Starting TSE data retrieval...');
    const retrieve = new Retrieve();
    const data = await retrieve.withRetry();
    
    const jsonString = stringifyWithEscaping(data, options.pretty);

    if (options.output) {
      const outputPath = options.output.startsWith('/') ? options.output : join(process.cwd(), options.output);
      writeFileSync(outputPath, jsonString, 'utf8');
      console.log(`Data saved to: ${outputPath}`);
      console.log(`Total entries: ${Object.keys(data).length}`);
    } else {
      console.log(jsonString);
    }

  } catch (error) {
    console.error('Error retrieving TSE data:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the main function
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
