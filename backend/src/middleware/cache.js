import NodeCache from 'node-cache';

// stdTTL is 5 minutes (300 seconds)
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

/**
 * Cache middleware
 * Generates key based on user id and original url
 */
export const cacheMiddleware = (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
        return next();
    }

    const userId = req.user?._id?.toString() || req.user?.id?.toString() || 'guest';
    const key = `__cache__${userId}__${req.originalUrl}`;
    const cachedResponse = cache.get(key);

    if (cachedResponse) {
        return res.json(cachedResponse);
    } else {
        res.originalJson = res.json;
        res.json = (body) => {
            // Only cache if status is 2xx
            if (res.statusCode >= 200 && res.statusCode < 300) {
                cache.set(key, body);
            }
            res.originalJson(body);
        };
        next();
    }
};

/**
 * Invalidation middleware
 * Clears cache for the current user when data is modified
 */
export const clearCacheMiddleware = (req, res, next) => {
    const userId = req.user?.id;
    
    if (userId) {
        // Find all keys for this user and delete them
        const keys = cache.keys();
        const userKeys = keys.filter(k => k.startsWith(`__cache__${userId}__`));
        if (userKeys.length > 0) {
            cache.del(userKeys);
        }
    }
    next();
};

export default cache;
