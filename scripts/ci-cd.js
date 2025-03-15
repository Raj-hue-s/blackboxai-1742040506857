#!/usr/bin/env node

const { program } = require('commander');
const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const semver = require('semver');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m'
};

// Logging utilities
const log = {
    info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
    success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
    warn: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}✖ ${msg}${colors.reset}`)
};

// Execute shell command
const execute = (command, silent = false) => {
    try {
        return execSync(command, {
            stdio: silent ? 'pipe' : 'inherit',
            encoding: 'utf-8'
        });
    } catch (error) {
        throw new Error(`Command failed: ${command}\n${error.message}`);
    }
};

// CI/CD Tasks
async function runTests() {
    try {
        log.info('Running test suite...');
        
        // Run linting
        log.info('Running linting checks...');
        execute('npm run lint');
        
        // Run unit tests
        log.info('Running unit tests...');
        execute('npm test');
        
        // Run integration tests
        log.info('Running integration tests...');
        execute('npm run test:integration');
        
        // Run e2e tests
        log.info('Running e2e tests...');
        execute('npm run test:e2e');
        
        log.success('All tests passed');
    } catch (error) {
        log.error('Test suite failed');
        throw error;
    }
}

async function buildApplication() {
    try {
        log.info('Building application...');
        
        // Clean dist directory
        await fs.rm('dist', { recursive: true, force: true });
        
        // Build frontend assets
        log.info('Building frontend assets...');
        execute('npm run build');
        
        // Build server
        log.info('Building server...');
        execute('npm run build:server');
        
        log.success('Build completed');
    } catch (error) {
        log.error('Build failed');
        throw error;
    }
}

async function runSecurityChecks() {
    try {
        log.info('Running security checks...');
        
        // Run npm audit
        log.info('Running npm audit...');
        execute('npm audit');
        
        // Run SAST analysis
        log.info('Running static analysis...');
        execute('npm run security:sast');
        
        // Check for secrets in code
        log.info('Checking for secrets in code...');
        execute('npm run security:secrets');
        
        log.success('Security checks passed');
    } catch (error) {
        log.error('Security checks failed');
        throw error;
    }
}

async function deployApplication(environment) {
    try {
        log.info(`Deploying to ${environment}...`);
        
        // Validate environment
        if (!['staging', 'production'].includes(environment)) {
            throw new Error('Invalid environment specified');
        }
        
        // Build Docker image
        log.info('Building Docker image...');
        const version = require('../package.json').version;
        execute(`docker build -t ally-soul:${version} .`);
        
        // Push to registry
        log.info('Pushing to registry...');
        execute(`docker push ally-soul:${version}`);
        
        // Deploy to environment
        log.info(`Deploying to ${environment}...`);
        execute(`./deploy.sh ${environment} ${version}`);
        
        log.success(`Deployment to ${environment} completed`);
    } catch (error) {
        log.error('Deployment failed');
        throw error;
    }
}

async function bumpVersion(type) {
    try {
        log.info(`Bumping version (${type})...`);
        
        // Read current version
        const pkg = require('../package.json');
        const currentVersion = pkg.version;
        
        // Calculate new version
        const newVersion = semver.inc(currentVersion, type);
        if (!newVersion) {
            throw new Error('Invalid version increment type');
        }
        
        // Update package.json
        pkg.version = newVersion;
        await fs.writeFile(
            'package.json',
            JSON.stringify(pkg, null, 2) + '\n'
        );
        
        // Create git tag
        execute(`git tag -a v${newVersion} -m "Version ${newVersion}"`);
        
        log.success(`Version bumped to ${newVersion}`);
        return newVersion;
    } catch (error) {
        log.error('Version bump failed');
        throw error;
    }
}

async function generateChangelog() {
    try {
        log.info('Generating changelog...');
        
        // Get latest tag
        const latestTag = execute('git describe --tags --abbrev=0', true).trim();
        
        // Get commits since last tag
        const commits = execute(
            `git log ${latestTag}..HEAD --pretty=format:"%h %s"`,
            true
        ).split('\n');
        
        // Categorize commits
        const categories = {
            feat: [],
            fix: [],
            docs: [],
            style: [],
            refactor: [],
            test: [],
            chore: []
        };
        
        commits.forEach(commit => {
            const [hash, ...messageParts] = commit.split(' ');
            const message = messageParts.join(' ');
            
            for (const category of Object.keys(categories)) {
                if (message.startsWith(`${category}:`)) {
                    categories[category].push({ hash, message });
                    break;
                }
            }
        });
        
        // Generate changelog content
        let changelog = '# Changelog\n\n';
        
        for (const [category, commits] of Object.entries(categories)) {
            if (commits.length > 0) {
                changelog += `\n## ${category}\n\n`;
                commits.forEach(({ hash, message }) => {
                    changelog += `- ${message} (${hash})\n`;
                });
            }
        }
        
        // Write changelog
        await fs.writeFile('CHANGELOG.md', changelog);
        
        log.success('Changelog generated');
    } catch (error) {
        log.error('Changelog generation failed');
        throw error;
    }
}

// CLI Commands
program
    .version('1.0.0')
    .description('CI/CD utilities for Ally & Soul AI');

program
    .command('test')
    .description('Run all tests')
    .action(async () => {
        try {
            await runTests();
        } catch (error) {
            process.exit(1);
        }
    });

program
    .command('build')
    .description('Build the application')
    .action(async () => {
        try {
            await buildApplication();
        } catch (error) {
            process.exit(1);
        }
    });

program
    .command('security')
    .description('Run security checks')
    .action(async () => {
        try {
            await runSecurityChecks();
        } catch (error) {
            process.exit(1);
        }
    });

program
    .command('deploy <environment>')
    .description('Deploy the application')
    .action(async (environment) => {
        try {
            await deployApplication(environment);
        } catch (error) {
            process.exit(1);
        }
    });

program
    .command('version <type>')
    .description('Bump version (patch|minor|major)')
    .action(async (type) => {
        try {
            await bumpVersion(type);
        } catch (error) {
            process.exit(1);
        }
    });

program
    .command('changelog')
    .description('Generate changelog')
    .action(async () => {
        try {
            await generateChangelog();
        } catch (error) {
            process.exit(1);
        }
    });

// Parse command line arguments
program.parse(process.argv);

// If no command is specified, show help
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
