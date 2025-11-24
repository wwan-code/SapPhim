import healthMonitor from '../utils/healthMonitor.js';
import logger from '../utils/logger.js';

export const poolMonitorMiddleware = (req, res, next) => {
    const start = Date.now();
    const startStats = healthMonitor.getSequelizePoolStats();

    // Log if pool is under heavy load before processing
    if (startStats.waiting > 0 || startStats.active > startStats.max * 0.8) {
        logger.warn(`⚠️ High DB Pool Usage at start of ${req.method} ${req.originalUrl}:`, startStats);
    }

    // Hook into response finish to check impact
    res.on('finish', () => {
        const duration = Date.now() - start;
        const endStats = healthMonitor.getSequelizePoolStats();

        // Log slow requests that might be holding connections
        if (duration > 1000) {
            logger.warn(`🐢 Slow Request (${duration}ms): ${req.method} ${req.originalUrl}`);
        }

        // In development, add stats header
        if (process.env.NODE_ENV === 'development') {
            // Note: Headers might already be sent, so this is best effort
            try {
                // res.setHeader('X-DB-Pool-Active', endStats.active);
            } catch (e) {
                // Ignore
            }
        }
    });

    next();
};

export default poolMonitorMiddleware;
