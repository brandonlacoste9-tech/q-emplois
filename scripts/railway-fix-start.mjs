import fs from 'fs';

const token = JSON.parse(fs.readFileSync(`${process.env.USERPROFILE}/.railway/config.json`, 'utf8')).user.token;
const SERVICE_ID = 'a7c2162b-e7c8-42c5-8363-f32495a379d8';
const ENV_ID = '98325e50-93e2-4f92-8feb-9b29f510c861';

async function gql(query, variables) {
  const res = await fetch('https://backboard.railway.com/graphql/v2', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  console.log(JSON.stringify(json, null, 2));
}

const inputs = [
  { startCommand: 'node dist/src/main.js', railwayConfigFile: null },
  { startCommand: 'node dist/src/main.js', railwayConfigFile: '' },
  { startCommand: 'node dist/src/main.js', dockerfilePath: 'Dockerfile' },
];

for (const input of inputs) {
  console.log('\n=== Trying', JSON.stringify(input), '===');
  await gql(
    `mutation($input: ServiceInstanceUpdateInput!) {
      serviceInstanceUpdate(serviceId: "${SERVICE_ID}", environmentId: "${ENV_ID}", input: $input)
    }`,
    { input },
  );
}

await gql(`mutation { serviceInstanceRedeploy(serviceId: "${SERVICE_ID}", environmentId: "${ENV_ID}") }`);
