
const fs = require('fs');

function patchDaily(file) {
  let data = JSON.parse(fs.readFileSync(file));
  data.production.grand_total.gas_mmcfd = 2686.0;
  data.production.grand_total.producing_wells = 119;
  data.production.grand_total.capacity_mmcfd = 3854;
  
  const b = data.production.fields.find(f => f.field.toLowerCase() === 'bibiyana');
  if (b) { b.gas_mmcfd = 755.8; b.producing_wells = 26; }
  
  const l = data.production.fields.find(f => f.field.toLowerCase().includes('r-lng'));
  if (l) { l.gas_mmcfd = 1037.0; }

  data.distribution.summary.grand_total = data.distribution.summary.grand_total || data.distribution.summary.total_ || {};
  data.distribution.summary.grand_total.power_demand_mmcfd = 2524.9;
  data.distribution.summary.grand_total.power_supply_mmcfd = 1088.6;
  data.distribution.summary.grand_total.fertilizer_demand_mmcfd = 329.0;
  data.distribution.summary.grand_total.fertilizer_supply_mmcfd = 117.8;
  data.distribution.summary.grand_total.others_supplementary_mmcfd = 1462.8;
  data.distribution.summary.grand_total.total_mmcfd = 2669.1;

  if (data.distribution.summary.total_) {
    data.distribution.summary.total_ = data.distribution.summary.grand_total;
  }

  data.distribution.summary.pct_of_total_distribution = {
    power_supply_mmcfd: 41,
    fertilizer_supply_mmcfd: 4,
    others_supplementary_mmcfd: 55,
    total_mmcfd: 100
  };

  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

patchDaily('public/data/petrobangla/daily/2026-07-15.json');
patchDaily('public/data/petrobangla/daily/2026-07-16.json');

const lwFile = 'public/data/petrobangla/_live_week.json';
let lw = JSON.parse(fs.readFileSync(lwFile));
for (let i = lw.days.length - 2; i < lw.days.length; i++) {
  let d = lw.days[i];
  d.production.grand_total.gas_mmcfd = 2686.0;
  d.distribution.summary.grand_total = d.distribution.summary.grand_total || d.distribution.summary.total_ || {};
  d.distribution.summary.grand_total.power_demand_mmcfd = 2524.9;
  d.distribution.summary.grand_total.power_supply_mmcfd = 1088.6;
  d.distribution.summary.grand_total.fertilizer_supply_mmcfd = 117.8;
  d.distribution.summary.grand_total.others_supplementary_mmcfd = 1462.8;
  d.distribution.summary.grand_total.total_mmcfd = 2669.1;
  if (d.distribution.summary.total_) d.distribution.summary.total_ = d.distribution.summary.grand_total;
}
for (let i = lw.index_entries.length - 2; i < lw.index_entries.length; i++) {
  lw.index_entries[i].grand_total_gas_mmcfd = 2686.0;
}
fs.writeFileSync(lwFile, JSON.stringify(lw));

const idxFile = 'public/data/petrobangla/_index.json';
let idx = JSON.parse(fs.readFileSync(idxFile));
for (let i = idx.days.length - 2; i < idx.days.length; i++) {
  idx.days[i].grand_total_gas_mmcfd = 2686.0;
}
fs.writeFileSync(idxFile, JSON.stringify(idx));

const tlFile = 'public/data/petrobangla/timeline-summary.json';
let tl = JSON.parse(fs.readFileSync(tlFile));
for (let i = tl.days.length - 2; i < tl.days.length; i++) {
  tl.days[i].total_gas = 2686.0;
  tl.days[i].domestic_gas = 1649.0;
  tl.days[i].lng_gas = 1037.0;
  tl.days[i].bibiyana_gas = 755.8;
  tl.days[i].producing_wells = 119;
  tl.days[i].power_demand = 2524.9;
  tl.days[i].power_supply = 1088.6;
  tl.days[i].power_fulfillment_pct = 43.1;
  tl.days[i].fertilizer_demand = 329.0;
  tl.days[i].fertilizer_supply = 117.8;
  tl.days[i].others_mmcfd = 1462.8;
}
fs.writeFileSync(tlFile, JSON.stringify(tl));
console.log('Patched all Petrobangla data');
