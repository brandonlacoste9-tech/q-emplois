import fs from 'fs';

const token = JSON.parse(fs.readFileSync(`${process.env.USERPROFILE}/.railway/config.json`, 'utf8')).user.token;
const PROJECT_ID = 'bce85347-5658-4038-987d-7a53d88c8c17';
const ENV_ID = '98325e50-93e2-4f92-8feb-9b29f510c861';
const SERVICE_ID = 'a7c2162b-e7c8-42c5-8363-f32495a379d8';

async function gql(query, variables) {
  const res = await fetch('https://backboard.railway.com/graphql/v2', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) {
    console.error(JSON.stringify(json.errors, null, 2));
    process.exit(1);
  }
  return json.data;
}

const cmd = process.argv[2];
const databaseUrl = process.argv[3];

if (cmd === 'list') {
  const data = await gql(`query {
    variables(projectId: "${PROJECT_ID}", environmentId: "${ENV_ID}", serviceId: "${SERVICE_ID}") {
      edges { node { name isMasked } }
    }
  }`);
  console.log(data.variables.edges.map((e) => `${e.node.name}${e.node.isMasked ? ' (masked)' : ''}`).join('\n'));
} else if (cmd === 'set-db' && databaseUrl) {
  await gql(
    `mutation($input: VariableCollectionUpsertInput!) {
      variableCollectionUpsert(input: $input)
    }`,
    {
      input: {
        projectId: PROJECT_ID,
        environmentId: ENV_ID,
        serviceId: SERVICE_ID,
        variables: {
          DATABASE_URL: databaseUrl,
        },
      },
    },
  );
  console.log('DATABASE_URL updated on Railway');
  await gql(`mutation { serviceInstanceRedeploy(serviceId: "${SERVICE_ID}", environmentId: "${ENV_ID}") }`);
  console.log('Redeploy triggered');
} else {
  console.log('Usage: node scripts/railway-vars.mjs list');
  console.log('       node scripts/railway-vars.mjs set-db "postgresql://..."');
}
