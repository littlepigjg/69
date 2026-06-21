const axios = require('axios');
const net = require('net');
const { URL } = require('url');

async function checkHttp(service) {
  let url = service.target;
  const startTime = Date.now();
  const timeout = service.timeout_ms || 5000;

  try {
    if (service.type === 'http' && !/^https?:\/\//.test(url)) {
      url = `http://${url}`;
    } else if (service.type === 'https' && !/^https?:\/\//.test(url)) {
      url = `https://${url}`;
    }

    const method = (service.method || 'GET').toLowerCase();
    const expectedStatus = service.expectedStatus || 200;

    const response = await axios({
      method,
      url,
      timeout,
      validateStatus: () => true,
      httpsAgent: service.type === 'https' ? new (require('https').Agent)({ rejectUnauthorized: false }) : undefined
    });

    const responseTime = Date.now() - startTime;
    const success = response.status === expectedStatus;

    return {
      success,
      response_time_ms: responseTime,
      status_code: response.status,
      error_message: success ? null : `Expected status ${expectedStatus}, got ${response.status}`
    };
  } catch (err) {
    return {
      success: false,
      response_time_ms: Date.now() - startTime,
      status_code: null,
      error_message: err.code || err.message || 'Unknown error'
    };
  }
}

function checkTcp(service) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const timeout = service.timeout_ms || 5000;
    let host = service.target;
    let port = service.port;

    if (!port && service.target.includes(':')) {
      const parts = service.target.split(':');
      host = parts[0];
      port = parseInt(parts[1], 10);
    }

    const socket = new net.Socket();
    let finished = false;

    const finish = (success, error_message, status_code = null) => {
      if (finished) return;
      finished = true;
      socket.destroy();
      resolve({
        success,
        response_time_ms: Date.now() - startTime,
        status_code,
        error_message
      });
    };

    socket.setTimeout(timeout);

    socket.on('connect', () => {
      finish(true, null);
    });

    socket.on('timeout', () => {
      finish(false, 'Connection timeout');
    });

    socket.on('error', (err) => {
      finish(false, err.code || err.message);
    });

    try {
      socket.connect(port, host);
    } catch (err) {
      finish(false, err.message || 'Invalid target');
    }
  });
}

async function checkService(service) {
  if (service.type === 'tcp') {
    return checkTcp(service);
  }
  return checkHttp(service);
}

module.exports = {
  checkService,
  checkHttp,
  checkTcp
};
