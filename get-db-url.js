const https = require('https');

const token = '7u9JXMPqs9Jn8w9a8by9hUAQ';
const projectId = 'prj_A0DI1y9tn7xV1vIVm99Qd2GbhVKK';

const options = {
  hostname: 'api.vercel.com',
  port: 443,
  path: `/v9/projects/${projectId}/env`,
  method: 'GET',
  headers: {
    Authorization: `Bearer ${token}`,
  },
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const envs = JSON.parse(data);
      if (envs.envs) {
        const dbUrl = envs.envs.find((e) => e.key === 'POSTGRES_PRISMA_URL');
        if (dbUrl && dbUrl.value) {
          console.log(dbUrl.value);
        } else {
          console.error('DATABASE_URL not found');
        }
      }
    } catch (e) {
      console.error('Error parsing response:', e.message);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.end();
