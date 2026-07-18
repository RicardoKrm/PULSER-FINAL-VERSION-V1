fetch('http://localhost:3000/api/reportes')
  .then(res => res.json())
  .then(console.log)
  .catch(console.error);
