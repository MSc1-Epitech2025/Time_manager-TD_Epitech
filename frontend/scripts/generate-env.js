const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../../.env');
const outputDir = path.resolve(__dirname, '../src/environments');

function parseEnvFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const env = {};
  
  content.split('\n').forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      env[key.trim()] = valueParts.join('=').trim();
    }
  });
  
  return env;
}

function generateEnvironmentFile(production) {
  const env = parseEnvFile(envPath);
  
  const content = `export const environment = {
  production: ${production},
  GRAPHQL_ENDPOINT: '${env.GRAPHQL_ENDPOINT}',
  JWT_EXP_MINUTES: ${env.SECURITY_JWT_EXPMINUTES},
  JWT_REFRESH_DAYS: ${env.SECURITY_JWT_REFRESH_DAYS},
  MAX_REFRESH_COUNT: 4 //here
};
`;

  const fileName = production ? 'environment.development.ts' : 'environment.ts';
  const outputPath = path.join(outputDir, fileName);
  
  fs.writeFileSync(outputPath, content, 'utf-8');
  console.log(`Generated ${fileName}`);
}

if (!fs.existsSync(envPath)) {
  console.error('.env file not found');
  process.exit(1);
}

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

generateEnvironmentFile(false);
generateEnvironmentFile(true);

console.log('Environment files generated successfully');
