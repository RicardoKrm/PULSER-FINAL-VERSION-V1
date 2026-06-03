const fs = require('fs');
let content = fs.readFileSync('src/pages/soporte/CentroAyuda.tsx', 'utf8');

content = content.replace(/ticket\.id(?!\w)/g, 'ticket.ticket_id');
content = content.replace(/ticket\.title/g, 'ticket.titulo');
content = content.replace(/ticket\.status/g, 'ticket.estado');
content = content.replace(/ticket\.priority/g, 'ticket.prioridad');
content = content.replace(/ticket\.user/g, 'ticket.usuario');
content = content.replace(/ticket\.date/g, 'ticket.fecha_creacion');

content = content.replace(/selectedTicket\.title/g, 'selectedTicket.titulo');
content = content.replace(/selectedTicket\.status/g, 'selectedTicket.estado');
content = content.replace(/selectedTicket\.priority/g, 'selectedTicket.prioridad');
content = content.replace(/selectedTicket\.user/g, 'selectedTicket.usuario');
content = content.replace(/selectedTicket\?\.id(?!\w)/g, 'selectedTicket?.ticket_id');

// But wait, there is `key={ticket.id}` inside the mapped list! So we have to revert `key={ticket.ticket_id}` to `key={ticket.id}` because `id` is the primary key UUID.
content = content.replace(/key=\{ticket\.ticket_id\}/g, 'key={ticket.id}');

// And the filter mapping `setTickets(prev => prev.map(t => t.id === updatedTicket.id...` must use `id`.
content = content.replace(/t\.ticket_id === updatedTicket\.id/g, 't.id === updatedTicket.id');

content = content.replace(/EMPRESAS_MOCK/g, 'empresasList');

fs.writeFileSync('src/pages/soporte/CentroAyuda.tsx', content);
console.log('Replaced successfully');
