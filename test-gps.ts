import fetch from "node-fetch";

async function test() {
   const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiaWF0IjoxNzgwNTk0MDAxLCJleHAiOjQ5MzQxOTQwMDF9.XSMC_zxhn-d_BXzsWLuILtVkep4QxIhekRBGR0Hc8WA';
   const now = new Date();
   const past = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24h ago
   
   const formatLocalStr = (d: Date) => {
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
   };

   const url = "http://localhost:3000/api/gps/dominio";
   const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
         patente: 'LDTP16',
         desde: formatLocalStr(past),
         hasta: formatLocalStr(now),
         token
      })
   });
   
   const data: any = await res.json();
   console.log("24h km:", data.totalKm);
}
test();
