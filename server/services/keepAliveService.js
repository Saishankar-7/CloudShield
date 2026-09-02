const https = require('https');
const http = require('http');
const logger = require('../utils/logger');

/**
 * Background Keep-Alive Service for Render.com & cloud deployments
 * Prevents free-tier instances from idling/sleeping by sending periodic heartbeat pings.
 */
function startKeepAlive() {
  const renderUrl = process.env.RENDER_EXTERNAL_URL || process.env.BACKEND_URL || process.env.RENDER_URL;
  const pingIntervalMinutes = parseInt(process.env.PING_INTERVAL_MINUTES || '14', 10);
  const intervalMs = pingIntervalMinutes * 60 * 1000;

  if (!renderUrl) {
    logger.info('KeepAlive: No RENDER_EXTERNAL_URL / BACKEND_URL detected in environment. Self-ping idle (Ready for external monitors like UptimeRobot).');
    return;
  }

  const targetUrl = renderUrl.endsWith('/') ? `${renderUrl}health` : `${renderUrl}/health`;

  logger.info(`KeepAlive: Initializing automatic self-ping service for Render (${targetUrl}) every ${pingIntervalMinutes} minutes.`);

  setInterval(() => {
    try {
      const client = targetUrl.startsWith('https') ? https : http;
      
      const req = client.get(targetUrl, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          logger.info(`[KeepAlive Heartbeat] Successfully pinged ${targetUrl} (Status ${res.statusCode} OK) - Render instance active.`);
        } else {
          logger.warn(`[KeepAlive Heartbeat] Ping to ${targetUrl} responded with status: ${res.statusCode}`);
        }
      });

      req.on('error', (err) => {
        logger.warn(`[KeepAlive Heartbeat] Ping error to ${targetUrl}: ${err.message}`);
      });

      req.setTimeout(10000, () => {
        req.destroy();
      });
    } catch (error) {
      logger.error(`[KeepAlive Heartbeat] Unexpected exception: ${error.message}`);
    }
  }, intervalMs);
}

module.exports = { startKeepAlive };
