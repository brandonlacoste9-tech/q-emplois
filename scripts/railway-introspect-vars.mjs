import fs from 'fs';

const token = JSON.parse(fs.readFileSync(`${process.env.USERPROFILE}/.railway/config.json`, 'utf8')).user.token;

const res = await fetch('https://backboard.railway.com/graphql/v2', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: `{ __type(name: "VariableCollectionUpsertInput") { inputFields { name type { name kind ofType { name } } } } }`,
  }),
});
console.log(JSON.stringify(await res.json(), null, 2));
