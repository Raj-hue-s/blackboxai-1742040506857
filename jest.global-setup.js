// Global setup for Jest tests
const { MongoMemoryServer } = require('mongodb-memory-server');
const Redis = require('ioredis-mock');

module.exports = async () => {
    // Start MongoDB Memory Server
    const mongod = await MongoMemoryServer.create();
    const mongoUri = mongod.getUri();
    
    // Store MongoDB instance globally
    global.__MONGOD__ = mongod;
    process.env.MONGODB_URI = mongoUri;

    // Setup Redis Mock
    const redis = new Redis();
    global.__REDIS__ = redis;

    // Setup environment variables for testing
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.EMERGENCY_SECRET = 'test-emergency-secret';
    process.env.EMAIL_USER = 'test@example.com';
    process.env.EMAIL_PASS = 'test-email-password';

    // Create test directories
    const fs = require('fs').promises;
    const path = require('path');
    const testDirs = ['uploads', 'logs', 'temp'];

    for (const dir of testDirs) {
        const dirPath = path.join(__dirname, dir);
        try {
            await fs.mkdir(dirPath, { recursive: true });
        } catch (error) {
            if (error.code !== 'EEXIST') {
                console.error(`Error creating directory ${dir}:`, error);
            }
        }
    }

    // Setup test models directory
    const modelsDir = path.join(__dirname, 'models');
    try {
        await fs.mkdir(modelsDir, { recursive: true });
        // Create placeholder model files
        const modelTypes = ['text-emotion', 'voice-emotion', 'video-emotion'];
        for (const type of modelTypes) {
            const modelDir = path.join(modelsDir, type);
            await fs.mkdir(modelDir, { recursive: true });
            await fs.writeFile(
                path.join(modelDir, 'model.json'),
                JSON.stringify({ version: '1.0.0', type })
            );
        }
    } catch (error) {
        if (error.code !== 'EEXIST') {
            console.error('Error setting up models directory:', error);
        }
    }

    // Initialize test data
    global.__TEST_DATA__ = {
        users: [],
        sessions: new Map(),
        emergencies: [],
        logs: []
    };

    // Setup test event listeners
    const EventEmitter = require('events');
    global.__TEST_EVENTS__ = new EventEmitter();

    console.log('Jest global setup complete');
};
