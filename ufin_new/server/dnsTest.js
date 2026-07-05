const { Resolver } = require('dns');
const r = new Resolver();
r.setServers(['8.8.8.8', '1.1.1.1']);
r.resolveSrv('_mongodb._tcp.cluster0.irbir3w.mongodb.net', (err, recs) => {
  if (err) {
    console.error('SRV FAIL', err.code, err.message);
    process.exit(1);
  }
  console.log('SRV OK count:', recs.length);
  recs.forEach(rec => console.log(' ', rec.name, ':', rec.port));
  process.exit(0);
});
