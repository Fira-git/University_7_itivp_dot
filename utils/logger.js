const winston = require('winston');

// logger configuration
const logger = winston.createLogger({
  level: 'error',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log' }), // logfile
    new winston.transports.Console()
  ],
});

module.exports = logger;