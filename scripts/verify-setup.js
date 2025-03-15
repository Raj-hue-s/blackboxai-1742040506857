#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const mongoose = require('mongoose');
const Redis = require('ioredis');
require('dotenv').config();

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m'
};

// Required directories
const requiredDirs = [
    'uploads',
    'logs',
    'models',
    'temp',
    'dist',
    'ssl',
    'data/db',
    'data/redis',
    'test/data'
];

// Required files
const requiredFiles = [
    '.env',
    '.env.test',
    'ssl/cert.pem',
    'ssl/key.pem'
];

// Required dependencies
const requiredDeps = [
    '@tensorflow/tfjs-node',
    'express',
    'mongoose',
    'redis',
    'socket.io',
    'natural'
];

async function verifySetup() {
    console.log('🔍 Verifying development environment setup...\n');
    let hasErrors = false;

    try {
        // Check Node.js version
        const nodeVersion = process.version;
        const minVersion = 'v16.0.0';
        console.log(`Checking Node.js version...`);
        if (compareVersions(nodeVersion, minVersion) < 0) {
            console.error(`${colors.red}❌ Node.js version must be ${minVersion} or higher${colors.reset}`);
            hasErrors = true;
        } else {
            console.log(`${colors.green}✓ Node.js version: ${nodeVersion}${colors.reset}`);
        }

        // Check directories
        console.log('\nChecking required directories...');
        for (const dir of requiredDirs) {
            try {
                await fs.access(dir);
                console.log(`${colors.green}✓ ${dir} exists${colors.reset}`);
            } catch (error) {
                console.error(`${colors.red}❌ Missing directory: ${dir}${colors.reset}`);
                hasErrors = true;
            }
        }

        // Check files
        console.log('\nChecking required files...');
        for (const file of requiredFiles) {
            try {
                await fs.access(file);
                console.log(`${colors.green}✓ ${file} exists${colors.reset}`);
            } catch (error) {
                console.error(`${colors.red}❌ Missing file: ${file}${colors.reset}`);
                hasErrors = true;
            }
        }

        // Check dependencies
        console.log('\nChecking required dependencies...');
        const packageJson = require('../package.json');
        for (const dep of requiredDeps) {
            if (packageJson.dependencies[dep]) {
                console.log(`${colors.green}✓ ${dep} is installed${colors.reset}`);
            } else {
                console.error(`${colors.red}❌ Missing dependency: ${dep}${colors.reset}`);
                hasErrors = true;
            }
        }

        // Check MongoDB connection
        console.log('\nChecking MongoDB connection...');
        try {
            await mongoose.connect(process.env.MONGODB_URI, {
                serverSelectionTimeoutMS: 5000
            });
            console.log(`${colors.green}✓ MongoDB connection successful${colors.reset}`);
            await mongoose.disconnect();
        } catch (error) {
            console.error(`${colors.red}❌ MongoDB connection failed: ${error.message}${colors.reset}`);
            hasErrors = true;
        }

        // Check Redis connection
        console.log('\nChecking Redis connection...');
        try {
            const redis = new Redis(process.env.REDIS_URL);
            await redis.ping();
            console.log(`${colors.green}✓ Redis connection successful${colors.reset}`);
            await redis.quit();
        } catch (error) {
            console.error(`${colors.red}❌ Redis connection failed: ${error.message}${colors.reset}`);
            hasErrors = true;
        }

        // Check Docker
        console.log('\nChecking Docker...');
        try {
            execSync('docker --version');
            console.log(`${colors.green}✓ Docker is installed${colors.reset}`);
        } catch (error) {
            console.error(`${colors.red}❌ Docker is not installed or not running${colors.reset}`);
            hasErrors = true;
        }

        // Check Docker Compose
        console.log('\nChecking Docker Compose...');
        try {
            execSync('docker-compose --version');
            console.log(`${colors.green}✓ Docker Compose is installed${colors.reset}`);
        } catch (error) {
            console.error(`${colors.red}❌ Docker Compose is not installed${colors.reset}`);
            hasErrors = true;
        }

        // Check environment variables
        console.log('\nChecking environment variables...');
        const requiredEnvVars = [
            'JWT_SECRET',
            'EMERGENCY_SECRET',
            'MONGODB_URI',
            'REDIS_URL',
            'EMAIL_USER',
            'EMAIL_PASS'
        ];

        for (const envVar of requiredEnvVars) {
            if (process.env[envVar]) {
                console.log(`${colors.green}✓ ${envVar} is set${colors.reset}`);
            } else {
                console.error(`${colors.red}❌ Missing environment variable: ${envVar}${colors.reset}`);
                hasErrors = true;
            }
        }

        // Final verdict
        console.log('\n--- Setup Verification Complete ---');
        if (hasErrors) {
            console.error(`\n${colors.red}❌ Setup verification failed. Please fix the issues above.${colors.reset}`);
            process.exit(1);
        } else {
            console.log(`\n${colors.green}✓ All checks passed! Development environment is ready.${colors.reset}`);
        }

    } catch (error) {
        console.error(`\n${colors.red}Error during verification:${colors.reset}`, error);
        process.exit(1);
    }
}

function compareVersions(v1, v2) {
    const v1Parts = v1.replace('v', '').split('.').map(Number);
    const v2Parts = v2.replace('v', '').split('.').map(Number);

    for (let i = 0; i < 3; i++) {
        if (v1Parts[i] > v2Parts[i]) return 1;
        if (v1Parts[i] < v2Parts[i]) return -1;
    }
    return 0;
}

// Run verification
verifySetup().catch(error => {
    console.error(`\n${colors.red}Unexpected error during verification:${colors.reset}`, error);
    process.exit(1);
});
