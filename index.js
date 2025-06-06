const net = require('net');
const axios = require('axios');

// 配置
const CONFIG = {
  DEFAULT_PORT: process.env.SERVER_PORT || 443,  // 使用环境变量或默认443
  CLOUDFLARE_IP: '162.159.152.11'
};

async function getLocalIPv4() {
  try {
    const response = await axios.get('https://api.ipify.org?format=json');
    return response.data.ip;
  } catch (error) {
    console.log('使用0.0.0.0作为监听地址');
    return '0.0.0.0';
  }
}

function createProxyServer(port) {
  net.createServer((clientSocket) => {
    console.log(`新连接: ${clientSocket.remoteAddress}`);
    
    const proxySocket = net.createConnection({
      host: CONFIG.CLOUDFLARE_IP,
      port: 443
    });

    clientSocket.pipe(proxySocket);
    proxySocket.pipe(clientSocket);

    clientSocket.on('error', (err) => {
      console.error('客户端错误:', err.message);
      proxySocket.end();
    });
    
    proxySocket.on('error', (err) => {
      console.error('Cloudflare错误:', err.message);
      clientSocket.end();
    });
  }).listen(port, '0.0.0.0', () => {
    console.log(`代理运行在 0.0.0.0:${port} -> ${CONFIG.CLOUDFLARE_IP}:443`);
  });
}

// 获取端口（优先级：命令行参数 > 环境变量 > 默认值）
const port = process.argv[2] 
  ? parseInt(process.argv[2]) 
  : CONFIG.DEFAULT_PORT;

if (isNaN(port)) {
  console.error('错误：端口必须是数字');
  process.exit(1);
}

createProxyServer(port);
console.log('测试提示：运行 curl -v --proxy http://IP:端口 https://example.com');
