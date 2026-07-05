const dns = require('dns');
const srvName = '_mongodb._tcp.cluster0.irbir3w.mongodb.net';
dns.resolveSrv(srvName, (err, recs) => {
  if (err) { console.error('SRV FAIL', err.code, err.message); return; }
  recs.forEach(r => console.log(r.name, r.port));
});
