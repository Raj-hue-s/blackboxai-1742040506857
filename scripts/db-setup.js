#!/usr/bin/env node

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { program } = require('commander');
require('dotenv').config();

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m'
};

// Sample data for seeding
const sampleData = {
    admins: [
        {
            email: 'admin@example.com',
            password: 'admin123',
            role: 'super_admin'
        }
    ],
    users: [
        {
            email: 'user1@example.com',
            password: 'user123',
            name: 'Test User 1'
        },
        {
            email: 'user2@example.com',
            password: 'user123',
            name: 'Test User 2'
        }
    ],
    emotionModels: [
        {
            name: 'text-emotion-v1',
            type: 'text',
            version: '1.0.0',
            accuracy: 0.85
        },
        {
            name: 'voice-emotion-v1',
            type: 'voice',
            version: '1.0.0',
            accuracy: 0.82
        },
        {
            name: 'video-emotion-v1',
            type: 'video',
            version: '1.0.0',
            accuracy: 0.78
        }
    ]
};

// Schema definitions
const schemas = {
    Admin: new mongoose.Schema({
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        role: { type: String, enum: ['admin', 'super_admin'], default: 'admin' },
        lastLogin: Date,
        active: { type: Boolean, default: true }
    }),

    User: new mongoose.Schema({
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        name: String,
        preferences: {
            theme: { type: String, default: 'light' },
            notifications: { type: Boolean, default: true }
        },
        lastActive: Date,
        createdAt: { type: Date, default: Date.now }
    }),

    EmotionModel: new mongoose.Schema({
        name: { type: String, required: true },
        type: { type: String, required: true },
        version: { type: String, required: true },
        accuracy: Number,
        parameters: mongoose.Schema.Types.Mixed,
        createdAt: { type: Date, default: Date.now }
    })
};

// Initialize models
const models = {};
for (const [name, schema] of Object.entries(schemas)) {
    models[name] = mongoose.model(name, schema);
}

// Database operations
async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log(`${colors.green}Connected to MongoDB${colors.reset}`);
    } catch (error) {
        console.error(`${colors.red}MongoDB connection error:${colors.reset}`, error);
        process.exit(1);
    }
}

async function dropDatabase() {
    try {
        await mongoose.connection.dropDatabase();
        console.log(`${colors.yellow}Database dropped${colors.reset}`);
    } catch (error) {
        console.error(`${colors.red}Error dropping database:${colors.reset}`, error);
        throw error;
    }
}

async function seedDatabase() {
    try {
        // Seed admins
        for (const admin of sampleData.admins) {
            const hashedPassword = await bcrypt.hash(admin.password, 10);
            await models.Admin.create({
                ...admin,
                password: hashedPassword
            });
        }
        console.log(`${colors.green}✓ Admins seeded${colors.reset}`);

        // Seed users
        for (const user of sampleData.users) {
            const hashedPassword = await bcrypt.hash(user.password, 10);
            await models.User.create({
                ...user,
                password: hashedPassword
            });
        }
        console.log(`${colors.green}✓ Users seeded${colors.reset}`);

        // Seed emotion models
        for (const model of sampleData.emotionModels) {
            await models.EmotionModel.create(model);
        }
        console.log(`${colors.green}✓ Emotion models seeded${colors.reset}`);

    } catch (error) {
        console.error(`${colors.red}Error seeding database:${colors.reset}`, error);
        throw error;
    }
}

async function createIndexes() {
    try {
        await models.Admin.createIndexes();
        await models.User.createIndexes();
        await models.EmotionModel.createIndexes();
        console.log(`${colors.green}✓ Indexes created${colors.reset}`);
    } catch (error) {
        console.error(`${colors.red}Error creating indexes:${colors.reset}`, error);
        throw error;
    }
}

// Command line interface
program
    .version('1.0.0')
    .description('Database management tool for Ally & Soul AI');

program
    .command('reset')
    .description('Reset database (drop and recreate with sample data)')
    .action(async () => {
        try {
            await connectDB();
            await dropDatabase();
            await seedDatabase();
            await createIndexes();
            console.log(`${colors.green}Database reset complete!${colors.reset}`);
            process.exit(0);
        } catch (error) {
            console.error(`${colors.red}Error resetting database:${colors.reset}`, error);
            process.exit(1);
        }
    });

program
    .command('seed')
    .description('Seed database with sample data')
    .action(async () => {
        try {
            await connectDB();
            await seedDatabase();
            console.log(`${colors.green}Database seeding complete!${colors.reset}`);
            process.exit(0);
        } catch (error) {
            console.error(`${colors.red}Error seeding database:${colors.reset}`, error);
            process.exit(1);
        }
    });

program
    .command('indexes')
    .description('Create database indexes')
    .action(async () => {
        try {
            await connectDB();
            await createIndexes();
            console.log(`${colors.green}Index creation complete!${colors.reset}`);
            process.exit(0);
        } catch (error) {
            console.error(`${colors.red}Error creating indexes:${colors.reset}`, error);
            process.exit(1);
        }
    });

// Parse command line arguments
program.parse(process.argv);

// If no command is specified, show help
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
