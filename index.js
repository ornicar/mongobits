const MongoClient = require('mongodb').MongoClient;

// Connection URL
const conf = require('./config');

async function cursorOf(dbs, plan) {
  const sourceColl = collOf(dbs.source, plan);
  if (plan.each) {
    const from = plan.each.from;
    const destColl = collOf(dbs.dest, from);
    if (plan.each.distinct) {
      const values = await destColl.distinct(plan.each.distinct);
      return sourceColl.find(plan.each.match(values));
    }
    const limit = from.limit ? from.limit * 3 : undefined;
    const cursor = makeCursor(destColl, from.match, { [plan.each.foreignField]: true }, from.sort, limit);
    const docs = await cursor.toArray();
    const values = Array.from(new Set(docs.map(o => o[plan.each.foreignField]))).slice(0, plan.each.from.limit || Number.MAX_VALUE);
    return sourceColl.find(plan.each.match(values));
  }
  return makeCursor(sourceColl, plan.match, plan.projection, plan.sort, plan.limit);
}

function makeCursor(coll, match, projection, sort, limit) {
  const c = coll.find(match);
  if (sort) c.sort(sort);
  if (limit) c.limit(limit);
  if (projection) c.project(projection);
  return c;
}

function collOf(db, plan) {
  return db.collection(plan.coll);
}

function insert(coll, doc) {
  return coll.insert(doc).catch(err => {
    if (err.name === 'MongoError') {
      if ([11000, 15, 22].includes(err.code)) return;
    }
    console.error(err)
    process.exit(1)
  });
}

async function runPlan(dbs, plan) {
  function log(msg) { console.log(`[${plan.coll}]`, msg); }
  log(JSON.stringify(plan));
  const cursor = await cursorOf(dbs, plan);
  const destColl = collOf(dbs.dest, plan);
  let nb = 0;
  while(await cursor.hasNext()) {
    nb++;
    if (nb % 1000 === 0) log(nb);
    const doc = await cursor.next();
    await insert(destColl, doc);
  }
  log(`Inserted ${nb} documents`);
}

async function run() {
  const dbs = await Promise.all([
    MongoClient.connect(conf.source),
    MongoClient.connect(conf.dest)
  ]).then(([source, dest]) => {
    return { source, dest };
  });
  console.log("Connected successfully to both DBs");
  await conf.plan.filter(o => !o.skip).reduce(async (acc, plan) => {
    await acc;
    return await runPlan(dbs, plan);
  }, Promise.resolve(0));
  dbs.source.close();
  dbs.dest.close();
  console.log("Successfully closed both DBs");
}

process.on('unhandledRejection', (err) => {
  console.error(err)
  process.exit(1)
});

run().catch(function(err) {
  console.log(err.stack);
});
