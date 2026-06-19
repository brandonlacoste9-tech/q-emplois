import fs from 'fs';

const token = JSON.parse(fs.readFileSync(`${process.env.USERPROFILE}/.railway/config.json`, 'utf8')).user.token;

async function gql(query, variables) {
  const res = await fetch('https://backboard.railway.com/graphql/v2', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) {
    console.error(JSON.stringify(json.errors, null, 2));
    process.exit(1);
  }
  return json.data;
}

const SERVICE_ID = 'a7c2162b-e7c8-42c5-8363-f32495a379d8';
const ENV_ID = '98325e50-93e2-4f92-8feb-9b29f510c861';
const PROJECT_ID = 'bce85347-5658-4038-987d-7a53d88c8c17';

const cmd = process.argv[2];

if (cmd === 'clear-start') {
  await gql(
    `mutation($input: ServiceInstanceUpdateInput!) {
      serviceInstanceUpdate(serviceId: "${SERVICE_ID}", environmentId: "${ENV_ID}", input: $input)
    }`,
    { input: { startCommand: '' } },
  );
  console.log('Cleared startCommand');
} else if (cmd === 'set-start') {
  const start = process.argv[3] || 'node dist/src/main.js';
  await gql(
    `mutation($input: ServiceInstanceUpdateInput!) {
      serviceInstanceUpdate(serviceId: "${SERVICE_ID}", environmentId: "${ENV_ID}", input: $input)
    }`,
    { input: { startCommand: start } },
  );
  console.log(`Set startCommand to: ${start}`);
} else if (cmd === 'project-token') {
  const data = await gql(
    `mutation($input: ProjectTokenCreateInput!) {
      projectTokenCreate(input: $input)
    }`,
    {
      input: {
        projectId: PROJECT_ID,
        environmentId: ENV_ID,
        name: `cursor-deploy-${Date.now()}`,
      },
    },
  );
  console.log(data.projectTokenCreate);
} else if (cmd === 'deploy-latest') {
  await gql(
    `mutation {
      serviceInstanceDeploy(
        serviceId: "${SERVICE_ID}"
        environmentId: "${ENV_ID}"
        latestCommit: true
      )
    }`,
  );
  console.log('Deploy from latest GitHub commit triggered');
} else if (cmd === 'redeploy') {
  await gql(
    `mutation {
      serviceInstanceRedeploy(serviceId: "${SERVICE_ID}", environmentId: "${ENV_ID}")
    }`,
  );
  console.log('Redeploy triggered');
} else if (cmd === 'status') {
  const data = await gql(`{
    service(id: "${SERVICE_ID}") {
      deployments(first: 1) { edges { node { id status meta } } }
    }
    serviceInstance(serviceId: "${SERVICE_ID}", environmentId: "${ENV_ID}") {
      startCommand builder dockerfilePath rootDirectory
    }
  }`);
  console.log(JSON.stringify(data, null, 2));
} else if (cmd === 'logs') {
  const depId = process.argv[3];
  const data = await gql(
    `query($id: String!) {
      deploymentLogs(deploymentId: $id, limit: 40) { ... on Log { message severity } }
    }`,
    { id: depId },
  );
  for (const line of data.deploymentLogs.slice(-25)) {
    console.log(`${line.severity}: ${line.message}`);
  }
} else if (cmd === 'build-logs') {
  const depId = process.argv[3];
  const data = await gql(
    `query($id: String!) {
      buildLogs(deploymentId: $id, limit: 40) { ... on Log { message severity } }
    }`,
    { id: depId },
  );
  for (const line of data.buildLogs.slice(-25)) {
    console.log(`${line.severity}: ${line.message}`);
  }
} else {
  console.log('Usage: node scripts/railway-api.mjs [clear-start|project-token|redeploy|status|logs|build-logs] [deploymentId]');
}
