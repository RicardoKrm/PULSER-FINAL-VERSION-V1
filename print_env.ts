console.log(Object.keys(process.env).filter(k => k.includes('SUPA') || k.includes('DB') || k.includes('URL') || k.includes('DATABASE')).join('\n'));
