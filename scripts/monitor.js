#!/usr/bin/env node

const { program } = require('commander');
const os = require('os');
const fs = require('fs').promises;
const path = require('path');
const mongoose = require('mongoose');
const Redis = require('ioredis');
const { execSync } = require('child_process');
require('dotenv').config();

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

// Thresholds
const THRESHOLDS = {
    cpu: 80, // 80% CPU usage
    memory: 85, // 85% memory usage
    disk: 90, // 90% disk usage
    responseTime: 1000, // 1 second
    errorRate: 0.01 // 1% error rate
};

// Monitoring Functions
async function checkSystemHealth() {
    try {
        const health = {
            timestamp: new Date(),
            system: await getSystemMetrics(),
            application: await getApplicationMetrics(),
            services: await checkServices(),
            security: await checkSecurity()
        };

        // Check if any metrics exceed thresholds
        const alerts = analyzeHealth(health);
        
        // Log results
        await logHealthCheck(health, alerts);

        return { health, alerts };
    } catch (error) {
        log.error('Health check failed');
        throw error;
    }
}

async function getSystemMetrics() {
    const cpuUsage = os.loadavg()[0] * 100 / os.cpus().length;
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const memoryUsage = ((totalMemory - freeMemory) / totalMemory) * 100;

    // Get disk usage
    const diskUsage = await getDiskUsage();

    return {
        cpu: {
            usage: cpuUsage,
            cores: os.cpus().length
        },
        memory: {
            total: totalMemory,
            free: freeMemory,
            usage: memoryUsage
        },
        disk: diskUsage,
        uptime: os.uptime(),
        loadAverage: os.loadavg()
    };
}

async function getApplicationMetrics() {
    try {
        // Get application-specific metrics
        const metrics = {
            activeUsers: await getActiveUsers(),
            responseTime: await getAverageResponseTime(),
            errorRate: await getErrorRate(),
            requestRate: await getRequestRate()
        };

        // Get resource usage for each container
        const containers = await getContainerMetrics();

        return {
            ...metrics,
            containers
        };
    } catch (error) {
        log.error('Failed to get application metrics');
        throw error;
    }
}

async function checkServices() {
    const services = {
        mongodb: await checkMongoDB(),
        redis: await checkRedis(),
        api: await checkAPI(),
        websocket: await checkWebSocket()
    };

    return services;
}

async function checkSecurity() {
    return {
        sslCertificate: await checkSSLCertificate(),
        firewallRules: await checkFirewallRules(),
        securityUpdates: await checkSecurityUpdates()
    };
}

// Utility Functions
async function getDiskUsage() {
    try {
        const df = execSync('df -h /').toString();
        const usage = df.split('\n')[1].split(/\s+/);
        return {
            total: usage[1],
            used: usage[2],
            free: usage[3],
            usagePercent: parseInt(usage[4])
        };
    } catch (error) {
        return null;
    }
}

async function getActiveUsers() {
    try {
        const redis = new Redis(process.env.REDIS_URL);
        const activeUsers = await redis.scard('active_users');
        await redis.quit();
        return activeUsers;
    } catch (error) {
        return null;
    }
}

async function getAverageResponseTime() {
    try {
        const logs = await fs.readFile('logs/access.log', 'utf8');
        const times = logs.match(/response-time: (\d+)ms/g);
        if (!times) return null;
        
        const average = times.reduce((sum, time) => {
            return sum + parseInt(time.match(/\d+/)[0]);
        }, 0) / times.length;
        
        return average;
    } catch (error) {
        return null;
    }
}

async function getErrorRate() {
    try {
        const logs = await fs.readFile('logs/error.log', 'utf8');
        const errors = logs.match(/ERROR/g)?.length || 0;
        const total = logs.split('\n').length;
        return errors / total;
    } catch (error) {
        return null;
    }
}

async function getRequestRate() {
    try {
        const logs = await fs.readFile('logs/access.log', 'utf8');
        const lastMinute = Date.now() - 60000;
        const recentRequests = logs.split('\n').filter(line => {
            const timestamp = new Date(line.match(/\[(.*?)\]/)?.[1]).getTime();
            return timestamp > lastMinute;
        }).length;
        return recentRequests;
    } catch (error) {
        return null;
    }
}

async function getContainerMetrics() {
    try {
        const stats = execSync('docker stats --no-stream --format "{{.Name}}\t{{.CPUPerc}}\t{{.MemPerc}}"').toString();
        return stats.split('\n').filter(Boolean).map(line => {
            const [name, cpu, memory] = line.split('\t');
            return {
                name,
                cpu: parseFloat(cpu),
                memory: parseFloat(memory)
            };
        });
    } catch (error) {
        return [];
    }
}

async function checkMongoDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const status = await mongoose.connection.db.admin().serverStatus();
        await mongoose.disconnect();
        return {
            status: 'healthy',
            connections: status.connections,
            opCounters: status.opcounters
        };
    } catch (error) {
        return { status: 'unhealthy', error: error.message };
    }
}

async function checkRedis() {
    try {
        const redis = new Redis(process.env.REDIS_URL);
        const info = await redis.info();
        await redis.quit();
        return {
            status: 'healthy',
            info: parseRedisInfo(info)
        };
    } catch (error) {
        return { status: 'unhealthy', error: error.message };
    }
}

async function checkAPI() {
    try {
        const response = await fetch('http://localhost:3000/health');
        const data = await response.json();
        return {
            status: response.ok ? 'healthy' : 'unhealthy',
            responseTime: response.headers.get('x-response-time'),
            ...data
        };
    } catch (error) {
        return { status: 'unhealthy', error: error.message };
    }
}

async function checkWebSocket() {
    try {
        const WebSocket = require('ws');
        const ws = new WebSocket('ws://localhost:3000/ws');
        
        return new Promise((resolve) => {
            ws.on('open', () => {
                ws.close();
                resolve({ status: 'healthy' });
            });
            
            ws.on('error', (error) => {
                resolve({ status: 'unhealthy', error: error.message });
            });
            
            setTimeout(() => {
                ws.close();
                resolve({ status: 'unhealthy', error: 'timeout' });
            }, 5000);
        });
    } catch (error) {
        return { status: 'unhealthy', error: error.message };
    }
}

async function checkSSLCertificate() {
    try {
        const cert = await fs.readFile('ssl/cert.pem');
        const forge = require('node-forge');
        const certificate = forge.pki.certificateFromPem(cert);
        
        return {
            valid: true,
            expires: certificate.validity.notAfter,
            daysUntilExpiry: Math.floor((certificate.validity.notAfter - Date.now()) / (1000 * 60 * 60 * 24))
        };
    } catch (error) {
        return { valid: false, error: error.message };
    }
}

async function checkFirewallRules() {
    try {
        const rules = execSync('iptables -L').toString();
        return {
            status: 'active',
            rules: rules.split('\n').filter(Boolean).length
        };
    } catch (error) {
        return { status: 'unknown', error: error.message };
    }
}

async function checkSecurityUpdates() {
    try {
        const updates = execSync('apt list --upgradable').toString();
        return {
            pending: updates.split('\n').filter(Boolean).length - 1
        };
    } catch (error) {
        return { error: error.message };
    }
}

function analyzeHealth(health) {
    const alerts = [];

    // Check CPU usage
    if (health.system.cpu.usage > THRESHOLDS.cpu) {
        alerts.push({
            level: 'critical',
            message: `High CPU usage: ${health.system.cpu.usage.toFixed(2)}%`
        });
    }

    // Check memory usage
    if (health.system.memory.usage > THRESHOLDS.memory) {
        alerts.push({
            level: 'critical',
            message: `High memory usage: ${health.system.memory.usage.toFixed(2)}%`
        });
    }

    // Check disk usage
    if (health.system.disk.usagePercent > THRESHOLDS.disk) {
        alerts.push({
            level: 'warning',
            message: `High disk usage: ${health.system.disk.usagePercent}%`
        });
    }

    // Check response time
    if (health.application.responseTime > THRESHOLDS.responseTime) {
        alerts.push({
            level: 'warning',
            message: `High response time: ${health.application.responseTime}ms`
        });
    }

    // Check error rate
    if (health.application.errorRate > THRESHOLDS.errorRate) {
        alerts.push({
            level: 'critical',
            message: `High error rate: ${(health.application.errorRate * 100).toFixed(2)}%`
        });
    }

    return alerts;
}

async function logHealthCheck(health, alerts) {
    const logEntry = {
        timestamp: new Date(),
        health,
        alerts
    };

    await fs.appendFile(
        'logs/health.log',
        JSON.stringify(logEntry) + '\n'
    );

    // If there are critical alerts, notify
    const criticalAlerts = alerts.filter(alert => alert.level === 'critical');
    if (criticalAlerts.length > 0) {
        await notifyTeam(criticalAlerts);
    }
}

async function notifyTeam(alerts) {
    if (process.env.SLACK_WEBHOOK) {
        const message = {
            text: '🚨 Critical System Alerts',
            attachments: alerts.map(alert => ({
                color: alert.level === 'critical' ? 'danger' : 'warning',
                text: alert.message
            }))
        };

        try {
            await fetch(process.env.SLACK_WEBHOOK, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(message)
            });
        } catch (error) {
            log.error('Failed to send Slack notification');
        }
    }
}

// CLI Commands
program
    .version('1.0.0')
    .description('Monitoring utilities for Ally & Soul AI');

program
    .command('health')
    .description('Run health check')
    .action(async () => {
        try {
            const { health, alerts } = await checkSystemHealth();
            console.log('\nHealth Check Results:');
            console.log(JSON.stringify(health, null, 2));
            
            if (alerts.length > 0) {
                console.log('\nAlerts:');
                alerts.forEach(alert => {
                    const color = alert.level === 'critical' ? colors.red : colors.yellow;
                    console.log(`${color}${alert.level}: ${alert.message}${colors.reset}`);
                });
            }
        } catch (error) {
            log.error(error.message);
            process.exit(1);
        }
    });

// Parse command line arguments
program.parse(process.argv);

// If no command is specified, show help
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
