import fs from 'fs';

const token = JSON.parse(fs.readFileSync(`${process.env.USERPROFILE}/.railway/config.json`, 'utf8')).user.token;

const res = await fetch('https://backboard.railway.com/graphql/v2', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: `{ __schema { mutationType { fields { name } } } }`,
  }),
});

const json = await res.json();
const names = json.data.__schema.mutationType.fields
  .map((f) => f.name)
  .filter((n) => /deploy|github|service|source|trigger|restart/i.test(n))
  .sort();
console.log(names.join('\n'));
