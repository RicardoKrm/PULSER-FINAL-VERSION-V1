const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('./src');

files.forEach(file => {
  let originalFile = fs.readFileSync(file, 'utf8');
  let text = originalFile;

  // Add dark:bg-slate-800 dark:text-slate-100 to input/select/textarea if they have border
  text = text.replace(/<input(.*?)className=["'](.*?)["']/g, (match, prefix, classNames) => {
      let classes = classNames.split(' ');
      let newClasses = new Set(classes);
      
      // if it has text color, probably fine. Let's ensure basic dark support
      if (!Array.from(newClasses).some(c => c.startsWith('dark:bg-'))) {
          // generic
          if (newClasses.has('border') || newClasses.has('border-slate-200')) {
             newClasses.add('dark:bg-slate-800');
          } else if (newClasses.has('bg-transparent')) {
             newClasses.add('dark:text-slate-100');
          } else if (newClasses.has('bg-slate-50')) {
             newClasses.add('dark:bg-slate-800');
          }
      }
      if (!Array.from(newClasses).some(c => c.startsWith('dark:text-'))) {
          if (!newClasses.has('text-transparent')) {
              newClasses.add('dark:text-slate-100');
          }
      }

      return `<input${prefix}className="${Array.from(newClasses).join(' ')}"`;
  });

  text = text.replace(/<select(.*?)className=["'](.*?)["']/g, (match, prefix, classNames) => {
      let classes = classNames.split(' ');
      let newClasses = new Set(classes);
      if (!Array.from(newClasses).some(c => c.startsWith('dark:bg-'))) {
          if (newClasses.has('border')) newClasses.add('dark:bg-slate-800');
      }
      if (!Array.from(newClasses).some(c => c.startsWith('dark:text-'))) {
          newClasses.add('dark:text-slate-100');
      }
      return `<select${prefix}className="${Array.from(newClasses).join(' ')}"`;
  });

  text = text.replace(/<textarea(.*?)className=["'](.*?)["']/g, (match, prefix, classNames) => {
      let classes = classNames.split(' ');
      let newClasses = new Set(classes);
      if (!Array.from(newClasses).some(c => c.startsWith('dark:bg-'))) {
          if (newClasses.has('border')) newClasses.add('dark:bg-slate-800');
      }
      if (!Array.from(newClasses).some(c => c.startsWith('dark:text-'))) {
          newClasses.add('dark:text-slate-100');
      }
      return `<textarea${prefix}className="${Array.from(newClasses).join(' ')}"`;
  });

  if (text !== originalFile) {
    fs.writeFileSync(file, text);
    console.log("Improved inputs in:", file);
  }
});
