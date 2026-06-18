import fetch from "node-fetch";

async function test() {
   const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiaWF0IjoxNzgwNTk0MDAxLCJleHAiOjQ5MzQxOTQwMDF9.XSMC_zxhn-d_BXzsWLuILtVkep4QxIhekRBGR0Hc8WA';
   const url = "http://localhost:3000/api/gps/dominio";
   const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
         patente: 'LDTP16',
         desde: '2026-06-15T00:00:00',
         hasta: '2026-06-18T00:00:00',
         token
      })
   });
   
   const data = await res.json();
   console.log("Count:", data.rawData?.count);
   console.log("Elements returned:", data.rawData?.elements?.length);
   console.log("TotalKm:", data.totalKm);
}
test();
