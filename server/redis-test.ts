#!/usr/bin/env bun

/**
 * Redis Connection Test Script
 * Run this in your Dokploy deployment to discover the correct Redis hostname
 */

import Redis from "ioredis";

const possibleHosts = [
    "redis",
    "localhost",
    "127.0.0.1",
    // Add Dokploy-specific patterns
    process.env.REDIS_HOST,
    `${process.env.PROJECT_NAME}-redis`,
    `${process.env.STACK_NAME}-redis`,
    "clipboard-redis",
    "clipboard_redis_1",
    "cpboard-redis-1",
].filter(Boolean);

console.log("🔍 Testing Redis connections...\n");
console.log("Environment variables:");
console.log(`  REDIS_HOST: ${process.env.REDIS_HOST || "(not set)"}`);
console.log(`  REDIS_PORT: ${process.env.REDIS_PORT || "(not set)"}`);
console.log(`  PROJECT_NAME: ${process.env.PROJECT_NAME || "(not set)"}`);
console.log(`  STACK_NAME: ${process.env.STACK_NAME || "(not set)"}`);
console.log("\n");

async function testConnection(host: string, port: number) {
    return new Promise((resolve) => {
        console.log(`Testing: ${host}:${port} ...`);
        
        const redis = new Redis({
            host,
            port,
            connectTimeout: 5000,
            maxRetriesPerRequest: 1,
            retryStrategy: () => null, // Don't retry
            lazyConnect: true,
        });

        const timeout = setTimeout(() => {
            redis.disconnect();
            console.log(`  ❌ Timeout\n`);
            resolve(false);
        }, 5000);

        redis.connect()
            .then(async () => {
                clearTimeout(timeout);
                try {
                    await redis.ping();
                    console.log(`  ✅ SUCCESS! Redis is accessible at ${host}:${port}\n`);
                    redis.disconnect();
                    resolve(true);
                } catch (err) {
                    console.log(`  ❌ Connected but ping failed: ${err}\n`);
                    redis.disconnect();
                    resolve(false);
                }
            })
            .catch((err) => {
                clearTimeout(timeout);
                console.log(`  ❌ Connection failed: ${err.message}\n`);
                redis.disconnect();
                resolve(false);
            });
    });
}

async function main() {
    const port = parseInt(process.env.REDIS_PORT || "6379");
    let successfulHost: string | null = null;

    for (const host of possibleHosts) {
        if (!host) continue;
        const success = await testConnection(host, port);
        if (success && !successfulHost) {
            successfulHost = host;
        }
    }

    console.log("━".repeat(60));
    if (successfulHost) {
        console.log("\n✅ SOLUTION FOUND!");
        console.log(`\nSet this environment variable in Dokploy:\n`);
        console.log(`  REDIS_HOST=${successfulHost}`);
        console.log(`  REDIS_PORT=${port}\n`);
    } else {
        console.log("\n❌ No working Redis connection found!");
        console.log("\nTroubleshooting steps:");
        console.log("1. Verify Redis service is running in Dokploy");
        console.log("2. Check that both services are in the same network");
        console.log("3. Try these commands in your container:");
        console.log("   - ping redis");
        console.log("   - nc -zv redis 6379");
        console.log("   - redis-cli -h redis ping");
    }
}

main().catch(console.error);
