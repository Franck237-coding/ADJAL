import os from 'os';
import fs from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env');

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return null;
}

const ip = getLocalIp();
if (!ip) {
  console.error('Impossible de detecter une adresse IP locale.');
  process.exit(1);
}

const content = `EXPO_PUBLIC_API_URL=http://${ip}:8099/api\n`;
fs.writeFileSync(envPath, content);
console.log(`Fichier .env cree avec : ${content.trim()}`);
