import { astro } from 'iztro';

const solarChart = astro.bySolar('2000-01-01', 0, '男', true, 'zh-CN');
const horoscope = solarChart.horoscope(new Date());

console.log("=== HOROSCOPE DECADAL PROPERTIES ===");
for (const key of Object.keys(horoscope.decadal)) {
  const val = horoscope.decadal[key];
  if (typeof val !== 'function' && typeof val !== 'object') {
    console.log(`- ${key}: ${val}`);
  } else if (Array.isArray(val)) {
    console.log(`- ${key} (Array, length ${val.length})`);
  } else if (val !== null) {
    console.log(`- ${key} (Object)`);
  }
}

console.log("\n=== HOROSCOPE YEARLY PROPERTIES ===");
for (const key of Object.keys(horoscope.yearly)) {
  const val = horoscope.yearly[key];
  if (typeof val !== 'function' && typeof val !== 'object') {
    console.log(`- ${key}: ${val}`);
  } else if (Array.isArray(val)) {
    console.log(`- ${key} (Array, length ${val.length})`);
  } else if (val !== null) {
    console.log(`- ${key} (Object)`);
  }
}

if (horoscope.decadal.stars) {
  console.log("\n=== DECADAL STARS EXAMPLE ===");
  console.log(horoscope.decadal.stars);
}
if (horoscope.yearly.stars) {
  console.log("\n=== YEARLY STARS EXAMPLE ===");
  console.log(horoscope.yearly.stars);
}
