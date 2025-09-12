# TSE ID JS

A Node.js package to fetch TSE (Technische Sicherheitseinrichtungen) system details from the official BSI (Bundesamt für Sicherheit in der Informationstechnik) website.

## Overview

This package scrapes certified TSE systems from the BSI website and provides them in a structured JSON format. It's designed to be used in GitHub workflows and can be easily integrated into other projects.

## Features

- 🔍 **Automated Scraping**: Fetches data from all paginated pages on the BSI website
- 🚀 **Playwright Integration**: Uses Playwright for reliable web scraping
- 📦 **CLI Interface**: Easy-to-use command-line interface
- 🧪 **Comprehensive Testing**: Full test coverage with Jest
- ⚡ **GitHub Actions Ready**: Optimized for CI/CD workflows
- 🔄 **Retry Logic**: Built-in retry mechanism for reliability
- 📊 **Structured Output**: Clean JSON format matching the example structure

## Installation

```bash
npm install tse-id-js
```

## Usage

### Command Line Interface

```bash
# Basic usage - output to stdout
npx tse-id-js

# Pretty print output
npx tse-id-js --pretty

# Save to file
npx tse-id-js --output tse-data.json

# Pretty print and save to file
npx tse-id-js --output tse-data.json --pretty
```

### Programmatic Usage

```javascript
const { fetchTSEData, TSEScraper } = require('tse-id-js');

// Simple usage
const data = await fetchTSEData();
console.log(data);

// Advanced usage with options
const scraper = new TSEScraper({
  maxPages: 5,
  timeout: 30000
});

const data = await scraper.scrapeWithRetry();
```

### TypeScript Usage

```typescript
import { fetchTSEData, TSEScraper, TSEData } from 'tse-id-js';

const data: TSEData = await fetchTSEData();
```

## Output Format

The package outputs data in the following JSON structure:

```json
{
  "0781-2025": {
    "id": "0781",
    "year": "2025",
    "content": "EPSON USB TSE Epson USB TSE 1.0.4/1.0.3, 1.1.0/1.1.0, 1.0.4/1.1.0, 1.1.1/1.1.0 Epson microSD TSE 1.0.4/1.0.3, 1.1.0/1.1.0",
    "manufacturer": "Epson Europe BV",
    "date_issuance": "30.04.2025"
  }
}
```

## GitHub Actions Integration

### Basic Workflow

```yaml
name: Fetch TSE Data
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC

jobs:
  fetch-data:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm install tse-id-js
      - run: npx tse-id-js --output tse-data.json --pretty
      - uses: actions/upload-artifact@v4
        with:
          name: tse-data
          path: tse-data.json
```

### Optimized Workflow (Recommended)

For better performance, use dependency caching:

```yaml
name: Fetch TSE Data
on:
  schedule:
    - cron: '0 2 * * *'

jobs:
  fetch-data:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx tse-id-js --output tse-data.json --pretty
```

## Development

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Setup

```bash
# Clone the repository
git clone https://github.com/rechtlogisch/tse-id-js.git
cd tse-id-js

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install --with-deps
```

### Scripts

```bash
# Build the project
npm run build

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run the scraper
npm run scrape

# Development mode
npm run dev
```

### Testing

The project uses Jest for testing. Tests are located in the `src/__tests__` directory.

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Configuration

### Scraping Options

```typescript
interface ScrapingOptions {
  baseUrl: string;      // Base URL for scraping (default: BSI TSE page)
  maxPages: number;     // Maximum pages to scrape (default: 3)
  timeout: number;      // Timeout in milliseconds (default: 30000)
}
```

### CLI Options

- `-o, --output <file>`: Output file path (default: stdout)
- `-p, --pretty`: Pretty print JSON output
- `-h, --help`: Show help message

## Performance Considerations

### GitHub Actions Optimization

1. **Dependency Caching**: Use `cache: 'npm'` in `actions/setup-node` to cache dependencies
2. **Browser Caching**: Playwright browsers are cached between runs
3. **Parallel Execution**: The scraper processes pages in sequence but can be optimized for parallel processing

### Execution Time

- **Cold Start**: ~2-3 minutes (includes dependency installation)
- **Cached Dependencies**: ~30-60 seconds
- **Docker Image**: ~15-30 seconds (if pre-built)

## Error Handling

The package includes comprehensive error handling:

- **Retry Logic**: Automatic retries with exponential backoff
- **Page-level Errors**: Continues scraping other pages if one fails
- **Network Timeouts**: Configurable timeout settings
- **Graceful Degradation**: Returns partial data if some pages fail

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Related Projects

- [tse-id-php](https://github.com/rechtlogisch/tse-id-php) - PHP version of this package
- [tse-id](https://github.com/rechtlogisch/tse-id) - Main repository using this package

## Support

If you encounter any issues or have questions, please:

1. Check the [Issues](https://github.com/rechtlogisch/tse-id-js/issues) page
2. Create a new issue with detailed information
3. Provide logs and error messages when possible

## Changelog

### v1.0.0
- Initial release
- Basic scraping functionality
- CLI interface
- GitHub Actions integration
- Comprehensive test suite


