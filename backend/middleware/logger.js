// ✅ CORREÇÃO: Logger simplificado e funcional
class Logger {
    static info(message, ...args) {
        const timestamp = new Date().toISOString();
        console.log(`ℹ️ ${timestamp} [INFO]: ${message}`, ...args);
    }

    static error(message, ...args) {
        const timestamp = new Date().toISOString();
        console.error(`❌ ${timestamp} [ERROR]: ${message}`, ...args);
    }

    static warn(message, ...args) {
        const timestamp = new Date().toISOString();
        console.warn(`⚠️ ${timestamp} [WARN]: ${message}`, ...args);
    }

    static debug(message, ...args) {
        const timestamp = new Date().toISOString();
        console.log(`🐛 ${timestamp} [DEBUG]: ${message}`, ...args);
    }
}

// ✅ CORREÇÃO: Middleware de request logging
const requestLogger = (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        Logger.info(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    });
    
    next();
};

module.exports = Logger;
module.exports.requestLogger = requestLogger;