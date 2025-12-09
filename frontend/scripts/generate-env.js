const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../../.env');
const outputDir = path.resolve(__dirname, '../src/environments');

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn('.env file not found, using environment variables');
    return null;
  }
  
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

function getEnvValue(envFromFile, key) {
  if (process.env[key]) {
    return process.env[key];
  }
  if (envFromFile && envFromFile[key]) {
    return envFromFile[key];
  }
  return null;
}

function generateEnvironmentFile(production) {
  const envFromFile = parseEnvFile(envPath);
  
  const graphqlEndpoint = getEnvValue(envFromFile, 'GRAPHQL_ENDPOINT');
  const jwtExpMinutes = getEnvValue(envFromFile, 'SECURITY_JWT_EXPMINUTES');
  const jwtRefreshDays = getEnvValue(envFromFile, 'SECURITY_JWT_REFRESH_DAYS');
  
  const content = `export const environment = {
  production: ${production},
  GRAPHQL_ENDPOINT: '${graphqlEndpoint}',
  JWT_EXP_MINUTES: ${jwtExpMinutes},
  JWT_REFRESH_DAYS: ${jwtRefreshDays},
  MAX_REFRESH_COUNT: 3
};
`;

  const fileName = production ? 'environment.development.ts' : 'environment.ts';
  const outputPath = path.join(outputDir, fileName);
  
  fs.writeFileSync(outputPath, content, 'utf-8');
  console.log(`Generated ${fileName}`);
}

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

generateEnvironmentFile(false);
generateEnvironmentFile(true);

console.log('Environment files generated successfully');
