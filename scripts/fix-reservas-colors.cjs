const fs = require('fs');

const file = 'src/pages/operaciones/Reservas.tsx';
let text = fs.readFileSync(file, 'utf8');

// The class name might be bg-white dark:bg-slate-950 or bg-slate-50 dark:bg-slate-900/50
// We need to add dark:text-slate-100 in case it is missing
text = text.replace(/className=(["'])(.*?)\1/g, (match, quote, classesStr) => {
    let classes = classesStr.split(' ');
    
    // check if it's an input-like styling
    if (classes.includes('border') && classes.includes('rounded-lg')) {
        let newClasses = new Set(classes);
        if (!newClasses.has('text-transparent')) {
            newClasses.add('dark:text-slate-100');
        }
        return `className=${quote}${Array.from(newClasses).join(' ')}${quote}`;
    }
    
    return match;
});

// Since the screen shows that `bg-white dark:bg-slate-950` is a bit too dark (close to black)
// Let's change the background on dark mode for form controls to `dark:bg-slate-800/50` to make it better matching the slate-800 border styling.
text = text.replace(/dark:bg-slate-950/g, 'dark:bg-slate-800/50');

fs.writeFileSync(file, text);
console.log("Fixed input text colors and backgrounds in Reservas.tsx");
