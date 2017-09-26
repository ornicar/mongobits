const MongoClient = require('mongodb').MongoClient;

// Connection URL
const conf = require('./config');

async function cursorOf(dbs, plan) {
  const sourceColl = collOf(dbs.source, plan);
  if (plan.match) return sourceColl.find(plan.match).limit(plan.limit || Number.MAX_VALUE);
  if (plan.each) {
    const foreignFieldValues = await collOf(dbs.dest, plan.each).distinct(plan.each.foreignField);
    console.log(plan.each.match(foreignFieldValues));
    return sourceColl.find(plan.each.match(foreignFieldValues));
  }
}

function collOf(db, plan) {
  return db.collection(plan.coll);
}

function insert(coll, doc) {
  return coll.insert(doc).catch(err => {
    if (err.name === 'MongoError' && err.code === 11000) return;
    console.error(err)
    process.exit(1)
  });
}

async function runPlan(dbs, plan) {
  console.log(`[${plan.coll}]`, plan);
  const cursor = await cursorOf(dbs, plan);
  const destColl = collOf(dbs.dest, plan);
  let nb = 0;
  while(await cursor.hasNext()) {
    nb++;
    if (nb % 1000 === 0) console.log(`[${plan.coll}]`, nb);
    const doc = await cursor.next();
    await insert(destColl, doc);
  }
  console.log(`Inserted ${nb} documents`);
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
