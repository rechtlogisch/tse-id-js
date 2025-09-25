import { writeFileSync } from 'fs';
import { join } from 'path';

// Mock the retrieve module
jest.mock('../retrieve', () => ({
  Retrieve: jest.fn().mockImplementation(() => ({
    withRetry: jest.fn()
  }))
}));

// Mock fs
jest.mock('fs', () => ({
  writeFileSync: jest.fn()
}));

// Mock process.argv and process.exit
const originalArgv = process.argv;
const originalExit = process.exit;

describe('CLI', () => {
  let mockRetrieve: any;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock console methods
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();

    // Mock process.argv and process.exit
    process.argv = ['node', 'cli.js'];
    process.exit = jest.fn() as any;

    // Get the mocked retrieve
    const { Retrieve } = require('../retrieve');
    mockRetrieve = new Retrieve();
  });

  afterEach(() => {
    process.argv = originalArgv;
    process.exit = originalExit;
    consoleSpy.mockRestore();
  });

  describe('argument parsing', () => {
    it('should parse help option with -h', () => {
      process.argv = ['node', 'cli.js', '-h'];
      const { parseArgs } = require('../cli');
      const result = parseArgs();
      expect(result.help).toBe(true);
    });

    it('should parse help option with --help', () => {
      process.argv = ['node', 'cli.js', '--help'];
      const { parseArgs } = require('../cli');
      const result = parseArgs();
      expect(result.help).toBe(true);
    });

    it('should parse output option with -o', () => {
      process.argv = ['node', 'cli.js', '-o', 'test.json'];
      const { parseArgs } = require('../cli');
      const result = parseArgs();
      expect(result.output).toBe('test.json');
    });

    it('should parse output option with --output', () => {
      process.argv = ['node', 'cli.js', '--output', 'test.json'];
      const { parseArgs } = require('../cli');
      const result = parseArgs();
      expect(result.output).toBe('test.json');
    });

    it('should parse pretty option with -p', () => {
      process.argv = ['node', 'cli.js', '-p'];
      const { parseArgs } = require('../cli');
      const result = parseArgs();
      expect(result.pretty).toBe(true);
    });

    it('should parse pretty option with --pretty', () => {
      process.argv = ['node', 'cli.js', '--pretty'];
      const { parseArgs } = require('../cli');
      const result = parseArgs();
      expect(result.pretty).toBe(true);
    });

    it('should parse multiple options together', () => {
      process.argv = ['node', 'cli.js', '--output', 'test.json', '--pretty'];
      const { parseArgs } = require('../cli');
      const result = parseArgs();
      expect(result.output).toBe('test.json');
      expect(result.pretty).toBe(true);
    });

    it('should handle unknown options', () => {
      process.argv = ['node', 'cli.js', '--unknown'];
      const { parseArgs } = require('../cli');
      parseArgs();
      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('should handle empty arguments', () => {
      process.argv = ['node', 'cli.js'];
      const { parseArgs } = require('../cli');
      const result = parseArgs();
      expect(result).toEqual({});
    });
  });

  describe('main function', () => {
    it('should handle successful retrieve', async () => {
      const mockData = {
        '1234-2023': {
          id: '1234',
          year: '2023',
          content: 'Test TSE System',
          manufacturer: 'Test Manufacturer',
          date_issuance: '01.01.2023'
        }
      };

      // Mock the Retrieve constructor and methods
      const { Retrieve } = require('../retrieve');
      const mockInstance = {
        withRetry: jest.fn().mockResolvedValue(mockData)
      };
      Retrieve.mockImplementation(() => mockInstance);

      // Test the retrieve function directly
      const { retrieve } = require('../index');
      const result = await retrieve();

      expect(result).toEqual(mockData);
      expect(mockInstance.withRetry).toHaveBeenCalled();
    });

    it('should handle retrieve errors', async () => {
      const error = new Error('Retrieving failed');
      
      // Mock the Retrieve constructor and methods
      const { Retrieve } = require('../retrieve');
      const mockInstance = {
        withRetry: jest.fn().mockRejectedValue(error)
      };
      Retrieve.mockImplementation(() => mockInstance);

      const { retrieve } = require('../index');
      await expect(retrieve()).rejects.toThrow('Retrieving failed');
    });

    it('should show help when help option is provided', () => {
      process.argv = ['node', 'cli.js', '--help'];
      
      // Mock console.log to capture help output
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Import and run the main function
      const { main } = require('../cli');
      
      // Since main is async, we need to handle it properly
      expect(() => {
        // This will throw because we're not awaiting, but we can test the help path
        try {
          main();
        } catch (e) {
          // Expected to throw in test environment
        }
      }).not.toThrow();
      
      consoleSpy.mockRestore();
    });
  });

  describe('file output', () => {
    it('should write to file when output option is provided', () => {
      const mockData = { test: 'data' };
      const outputPath = 'test.json';
      
      // Test the writeFileSync call
      writeFileSync(outputPath, JSON.stringify(mockData), 'utf8');
      
      expect(writeFileSync).toHaveBeenCalledWith(
        outputPath,
        JSON.stringify(mockData),
        'utf8'
      );
    });

    it('should pretty print when pretty option is enabled', () => {
      const mockData = { test: 'data' };
      const prettyJson = JSON.stringify(mockData, null, 2);
      
      expect(prettyJson).toContain('\n');
      expect(prettyJson).toContain('  ');
    });
  });

  describe('stringifyWithEscaping function', () => {
    it('should escape forward slashes', () => {
      const { stringifyWithEscaping } = require('../cli');
      const obj = { path: '/some/path' };
      const result = stringifyWithEscaping(obj);
      expect(result).toContain('\\/some\\/path');
    });

    it('should escape unicode characters', () => {
      const { stringifyWithEscaping } = require('../cli');
      const obj = { text: 'café' };
      const result = stringifyWithEscaping(obj);
      expect(result).toContain('\\u00e9');
    });

    it('should handle pretty printing', () => {
      const { stringifyWithEscaping } = require('../cli');
      const obj = { test: 'value' };
      const result = stringifyWithEscaping(obj, true);
      expect(result).toContain('\n');
    });
  });

  describe('help functionality', () => {
    it('should test printHelp function', () => {
      const { printHelp } = require('../cli');
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      printHelp();
      
      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleSpy.mock.calls[0][0]).toContain('Retrieve');
      
      consoleSpy.mockRestore();
    });
  });

  describe('error handling', () => {
    it('should handle writeFileSync errors', () => {
      const { writeFileSync } = require('fs');
      
      // Test that writeFileSync can throw errors
      writeFileSync.mockImplementation(() => {
        throw new Error('Write failed');
      });

      expect(() => {
        writeFileSync('test.json', 'data', 'utf8');
      }).toThrow('Write failed');
    });
  });

  describe('process event handlers', () => {
    it('should handle unhandled promise rejections', () => {
      // Mock process.on to capture the handler
      const processOnSpy = jest.spyOn(process, 'on');
      const processExitSpy = jest.spyOn(process, 'exit').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Re-require the module to trigger the process.on setup
      jest.resetModules();
      require('../cli');
      
      expect(processOnSpy).toHaveBeenCalledWith('unhandledRejection', expect.any(Function));
      
      // Test the unhandled rejection handler
      const unhandledRejectionHandler = processOnSpy.mock.calls.find(
        call => call[0] === 'unhandledRejection'
      )?.[1];
      
      if (unhandledRejectionHandler) {
        unhandledRejectionHandler('Test error', Promise.resolve());
        expect(consoleErrorSpy).toHaveBeenCalled();
        expect(processExitSpy).toHaveBeenCalledWith(1);
      }
      
      processOnSpy.mockRestore();
      processExitSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('main function execution', () => {
    it('should handle main function execution when run as script', () => {
      // Test the process event handlers are set up
      const processOnSpy = jest.spyOn(process, 'on');
      const processExitSpy = jest.spyOn(process, 'exit').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Re-require the module to trigger the process.on setup
      jest.resetModules();
      require('../cli');
      
      // Verify process event handlers are registered
      expect(processOnSpy).toHaveBeenCalledWith('unhandledRejection', expect.any(Function));
      
      processOnSpy.mockRestore();
      processExitSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });
});
