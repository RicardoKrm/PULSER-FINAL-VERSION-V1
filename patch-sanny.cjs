const fs = require('fs');
const file = 'src/pages/produccion/ControlSanny.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. TruckData Interface
content = content.replace(
  "s7: Trip[];\n}",
  "s7: Trip[];\n  s8: Trip[];\n}"
);

// 2. DailySummary Interface
content = content.replace(
  "s7NocheVueltas: number;\n}",
  "s7NocheVueltas: number;\n  s8DiaTons: number;\n  s8DiaVueltas: number;\n  s8NocheTons: number;\n  s8NocheVueltas: number;\n}"
);

// 3. Initial State
content = content.replace(
  "useState<TruckData>({ s6: [], s7: [] });",
  "useState<TruckData>({ s6: [], s7: [], s8: [] });"
);

// 4. Fetch logic
content = content.replace(
  "const s7Trips: Trip[] = [];",
  "const s7Trips: Trip[] = [];\n      const s8Trips: Trip[] = [];"
);

content = content.replace(
  "else if (row.equipo === 's7') s7Trips.push(trip);",
  "else if (row.equipo === 's7') s7Trips.push(trip);\n        else if (row.equipo === 's8') s8Trips.push(trip);"
);

content = content.replace(
  "setData({ s6: s6Trips, s7: s7Trips });",
  "setData({ s6: s6Trips, s7: s7Trips, s8: s8Trips });"
);

content = content.replace(
  "const allDates = [...data.s6, ...data.s7].map(t => t.date.substring(0, 7));",
  "const allDates = [...data.s6, ...data.s7, ...data.s8].map(t => t.date.substring(0, 7));"
);

content = content.replace(
  "const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, truck: 's6' | 's7') => {",
  "const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, truck: 's6' | 's7' | 's8') => {"
);

content = content.replace(
  "s6DiaTons: 0, s6DiaVueltas: 0, s6NocheTons: 0, s6NocheVueltas: 0,",
  "s6DiaTons: 0, s6DiaVueltas: 0, s6NocheTons: 0, s6NocheVueltas: 0,\n            s8DiaTons: 0, s8DiaVueltas: 0, s8NocheTons: 0, s8NocheVueltas: 0,"
);

// Add data.s8 loop inside summaries
const loopS8 = `
      data.s8.forEach(trip => {
        let day = dailyMap.get(trip.date);
        if (day) {
          if (trip.shift === 'Día') {
            day.s8DiaTons += trip.capacity;
            day.s8DiaVueltas += 1;
          } else {
            day.s8NocheTons += trip.capacity;
            day.s8NocheVueltas += 1;
          }
        }
      });
`;
content = content.replace(
  /data\.s7\.forEach\(trip => \{[\s\S]*?\}\);/,
  "$&" + loopS8
);

fs.writeFileSync(file, content);
console.log("ControlSanny patch 1 completed.");
