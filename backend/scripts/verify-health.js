// Native fetch is available in Node.js 18+

const checkHealth = async () => {
    try {
        console.log('🔍 Checking Backend Health...');
        const response = await fetch('http://localhost:5000/health/detailed');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        console.log('\n✅ Health Check Passed!');
        console.log('----------------------------------------');
        console.log('📅 Timestamp:', data.timestamp);

        console.log('\n🗄️  Database Pool:');
        console.log(`   Active: ${data.database.active}`);
        console.log(`   Idle: ${data.database.idle}`);
        console.log(`   Waiting: ${data.database.waiting}`);
        console.log(`   Total: ${data.database.size}/${data.database.max}`);

        console.log('\n🔴 Redis Pools:');
        if (data.redis.main) {
            console.log(`   Main:   Active ${data.redis.main.active}, Idle ${data.redis.main.idle}, Size ${data.redis.main.size}`);
        }
        if (data.redis.cache) {
            console.log(`   Cache:  Active ${data.redis.cache.active}, Idle ${data.redis.cache.idle}, Size ${data.redis.cache.size}`);
        }
        if (data.redis.pubsub) {
            console.log(`   PubSub: Active ${data.redis.pubsub.active}, Idle ${data.redis.pubsub.idle}, Size ${data.redis.pubsub.size}`);
        }

        console.log('\n🔌 Socket.IO:');
        console.log(`   Connected Clients: ${data.socketIO.connected}`);

        console.log('\n💻 System:');
        console.log(`   Memory: ${data.system.rss}`);
        console.log('----------------------------------------');

    } catch (error) {
        console.error('❌ Health Check Failed:', error.message);
        console.log('Make sure the backend server is running on port 5000.');
    }
};

checkHealth();
