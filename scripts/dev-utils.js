#!/usr/bin/env node

const { program } = require('commander');
const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { createHash } = require('crypto');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m'
};

// Utility Functions
const log = {
    info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
    success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
    warn: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}✖ ${msg}${colors.reset}`)
};

const execute = (command) => {
    try {
        execSync(command, { stdio: 'inherit' });
        return true;
    } catch (error) {
        log.error(`Command failed: ${command}`);
        log.error(error.message);
        return false;
    }
};

// Development Tasks
async function cleanDist() {
    try {
        await fs.rm('dist', { recursive: true, force: true });
        log.success('Cleaned dist directory');
    } catch (error) {
        log.error('Error cleaning dist directory: ' + error.message);
        throw error;
    }
}

async function cleanTemp() {
    try {
        await fs.rm('temp', { recursive: true, force: true });
        await fs.mkdir('temp');
        log.success('Cleaned temp directory');
    } catch (error) {
        log.error('Error cleaning temp directory: ' + error.message);
        throw error;
    }
}

async function generateSecrets() {
    try {
        const secrets = {
            JWT_SECRET: createHash('sha256').update(Math.random().toString()).digest('hex'),
            EMERGENCY_SECRET: createHash('sha256').update(Math.random().toString()).digest('hex')
        };

        let envContent = await fs.readFile('.env', 'utf8');
        
        for (const [key, value] of Object.entries(secrets)) {
            const regex = new RegExp(`${key}=.*`);
            if (envContent.match(regex)) {
                envContent = envContent.replace(regex, `${key}=${value}`);
            } else {
                envContent += `\n${key}=${value}`;
            }
        }

        await fs.writeFile('.env', envContent);
        log.success('Generated new secrets');
    } catch (error) {
        log.error('Error generating secrets: ' + error.message);
        throw error;
    }
}

async function checkDependencies() {
    try {
        log.info('Checking for outdated dependencies...');
        execute('npm outdated');
        
        log.info('Checking for security vulnerabilities...');
        execute('npm audit');
    } catch (error) {
        log.error('Error checking dependencies: ' + error.message);
        throw error;
    }
}

async function optimizeAssets() {
    try {
        // Optimize images
        log.info('Optimizing images...');
        const imageFiles = await findFiles(['png', 'jpg', 'jpeg', 'gif'], ['ally', 'soul']);
        for (const file of imageFiles) {
            execute(`npx imagemin ${file} --out-dir=dist/images`);
        }

        // Optimize SVGs
        log.info('Optimizing SVGs...');
        const svgFiles = await findFiles(['svg'], ['ally', 'soul']);
        for (const file of svgFiles) {
            execute(`npx svgo ${file} -o dist/images`);
        }

        log.success('Asset optimization complete');
    } catch (error) {
        log.error('Error optimizing assets: ' + error.message);
        throw error;
    }
}

async function findFiles(extensions, directories) {
    const files = [];
    for (const dir of directories) {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                files.push(...await findFiles(extensions, [fullPath]));
            } else if (extensions.includes(entry.name.split('.').pop())) {
                files.push(fullPath);
            }
        }
    }
    return files;
}

async function validateConfigs() {
    try {
        log.info('Validating configuration files...');
        
        // Check package.json
        const pkg = require('../package.json');
        if (!pkg.name || !pkg.version) {
            throw new Error('Invalid package.json: missing name or version');
        }

        // Check .env
        const envContent = await fs.readFile('.env', 'utf8');
        const requiredEnvVars = [
            'NODE_ENV',
            'PORT',
            'MONGODB_URI',
            'REDIS_URL',
            'JWT_SECRET'
        ];
        
        for (const envVar of requiredEnvVars) {
            if (!envContent.includes(envVar + '=')) {
                throw new Error(`Missing required environment variable: ${envVar}`);
            }
        }

        log.success('Configuration validation complete');
    } catch (error) {
        log.error('Configuration validation failed: ' + error.message);
        throw error;
    }
}

async function checkPerformance() {
    try {
        log.info('Running performance checks...');

        // Check bundle sizes
        log.info('Analyzing bundle sizes...');
        execute('npx source-map-explorer dist/**/*.js');

        // Run Lighthouse audit
        log.info('Running Lighthouse audit...');
        execute('npx lighthouse http://localhost:3000 --output-path=./reports/lighthouse.html');

        log.success('Performance checks complete');
    } catch (error) {
        log.error('Error running performance checks: ' + error.message);
        throw error;
    }
}

// CLI Commands
program
    .version('1.0.0')
    .description('Development utilities for Ally & Soul AI');

program
    .command('clean')
    .description('Clean build and temporary directories')
    .action(async () => {
        try {
            await cleanDist();
            await cleanTemp();
            log.success('Clean completed');
        } catch (error) {
            process.exit(1);
        }
    });

program
    .command('secrets')
    .description('Generate new secrets')
    .action(async () => {
        try {
            await generateSecrets();
        } catch (error) {
            process.exit(1);
        }
    });

program
    .command('check-deps')
    .description('Check dependencies for updates and vulnerabilities')
    .action(async () => {
        try {
            await checkDependencies();
        } catch (error) {
            process.exit(1);
        }
    });

program
    .command('optimize')
    .description('Optimize assets for production')
    .action(async () => {
        try {
            await optimizeAssets();
        } catch (error) {
            process.exit(1);
        }
    });

program
    .command('validate')
    .description('Validate configuration files')
    .action(async () => {
        try {
            await validateConfigs();
        } catch (error) {
            process.exit(1);
        }
    });

program
    .command('perf')
    .description('Run performance checks')
    .action(async () => {
        try {
            await checkPerformance();
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
