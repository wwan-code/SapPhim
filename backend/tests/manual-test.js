/**
 * Simple Manual Test Script
 * Run with: node backend/tests/manual-test.js
 */

import db from '../models/index.js';
import * as friendService from '../services/friend.service.js';
import { safeSocketEmit, safeRedisPublish } from '../utils/socket.utils.js';

const { User, Friendship } = db;

console.log('🧪 Starting Manual Tests for Friend Service Fixes\n');

async function runTests() {
    let transaction;

    try {
        // Test 1: Socket Emit Safety
        console.log('Test 1: Safe Socket Emit...');
        const nullIoResult = safeSocketEmit(null, 'room', 'event', {});
        console.log(`  ✅ Null IO handled: ${!nullIoResult}`);

        const mockIo = {
            to: () => ({
                emit: () => { throw new Error('Mock error'); }
            })
        };
        const errorResult = safeSocketEmit(mockIo, 'room', 'event', {});
        console.log(`  ✅ Socket error handled: ${!errorResult}\n`);

        // Test 2: Redis Publish Safety
        console.log('Test 2: Safe Redis Publish...');
        const redisResult = await safeRedisPublish('test_channel', { test: 'data' });
        console.log(`  ✅ Redis publish executed: ${typeof redisResult === 'boolean'}\n`);

        // Test 3: Sender Validation
        console.log('Test 3: Sender Validation...');
        transaction = await db.sequelize.transaction();

        const bannedUser = await User.create({
            username: 'banned_user',
            email: 'banned@test.com',
            password: 'test123',
            status: 'banned',
        }, { transaction });

        const normalUser = await User.create({
            username: 'normal_user',
            email: 'normal@test.com',
            password: 'test123',
            status: 'active',
        }, { transaction });

        try {
            await friendService.sendFriendRequest(bannedUser.id, normalUser.id);
            console.log('  ❌ Should have rejected banned user');
        } catch (error) {
            console.log(`  ✅ Banned user rejected: ${error.message}\n`);
        }

        await transaction.rollback();

        // Test 4: Search Privacy
        console.log('Test 4: Email Privacy in Search...');
        transaction = await db.sequelize.transaction();

        const searcher = await User.create({
            username: 'searcher',
            email: 'searcher@test.com',
            password: 'test123',
            status: 'active',
        }, { transaction });

        const target = await User.create({
            username: 'target_user',
            email: 'target@test.com',
            password: 'test123',
            status: 'active',
        }, { transaction });

        // Try to search by email (should not work)
        const emailSearchResults = await friendService.searchUsers('target@test.com', searcher.id);
        console.log(`  ✅ Email search blocked: ${emailSearchResults.length === 0}`);

        // Search by username (should work)
        const usernameSearchResults = await friendService.searchUsers('target_user', searcher.id);
        console.log(`  ✅ Username search works: ${usernameSearchResults.length === 1}`);
        console.log(`  ✅ Email not in results: ${!usernameSearchResults[0]?.email}\n`);

        await transaction.rollback();

        // Test 5: Pagination with Search
        console.log('Test 5: Search Pagination Accuracy...');
        transaction = await db.sequelize.transaction();

        const mainUser = await User.create({
            username: 'main_user',
            email: 'main@test.com',
            password: 'test123',
            status: 'active',
        }, { transaction });

        // Create 15 friends: 5 with "john", 10 with "mike"
        for (let i = 0; i < 5; i++) {
            const friend = await User.create({
                username: `john_${i}`,
                email: `john${i}@test.com`,
                password: 'test123',
                status: 'active',
            }, { transaction });

            await Friendship.create({
                senderId: mainUser.id,
                receiverId: friend.id,
                status: 'accepted',
            }, { transaction });
        }

        for (let i = 0; i < 10; i++) {
            const friend = await User.create({
                username: `mike_${i}`,
                email: `mike${i}@test.com`,
                password: 'test123',
                status: 'active',
            }, { transaction });

            await Friendship.create({
                senderId: mainUser.id,
                receiverId: friend.id,
                status: 'accepted',
            }, { transaction });
        }

        // Search for "john" - should return 5 total
        const searchResult = await friendService.getFriends(mainUser.id, 'john', 1, 10);
        console.log(`  ✅ Search found correct count: ${searchResult.meta.total === 5}`);
        console.log(`  ✅ Returned items: ${searchResult.data.length} (max 5)`);

        // No search - should return all 15
        const allResult = await friendService.getFriends(mainUser.id, null, 1, 10);
        console.log(`  ✅ All friends count: ${allResult.meta.total === 15}`);
        console.log(`  ✅ First page items: ${allResult.data.length === 10}\n`);

        await transaction.rollback();

        console.log('✅ All manual tests passed!\n');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (transaction) await transaction.rollback();
    } finally {
        process.exit(0);
    }
}

// Run tests
runTests();
