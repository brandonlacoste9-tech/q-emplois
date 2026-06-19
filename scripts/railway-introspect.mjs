import fs from 'fs';

const token = JSON.parse(fs.readFileSync(`${process.env.USERPROFILE}/.railway/config.json`, 'utf8')).user.token;

const res = await fetch('https://backboard.railway.com/graphql/v2', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: `{ __schema { mutationType { fields(includeDeprecated: true) { name args { name type { name kind ofType { name kind ofType { name } } } } } } } }`,
  }),
});

const json = await res.json();
for (const name of ['githubRepoDeploy', 'serviceInstanceDeployV2', 'serviceInstanceDeploy', 'environmentTriggersDeploy']) {
  const field = json.data.__schema.mutationType.fields.find((f) => f.name === name);
  console.log(`\n=== ${name} ===`);
  console.log(JSON.stringify(field?.args, null, 2));
}
