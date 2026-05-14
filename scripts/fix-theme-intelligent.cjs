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

  // Let's fix missing dark:text classes for text-slate-*
  // We'll parse each className string separately to avoid cross-line match issues.
  text = text.replace(/className=(["'])(.*?)\1/g, (match, quote, classNames) => {
      let classes = classNames.split(' ');
      let newClasses = new Set(classes);

      // Map slate text colors
      const textMap = {
          'text-slate-900': 'dark:text-slate-100',
          'text-slate-800': 'dark:text-slate-200',
          'text-slate-700': 'dark:text-slate-300',
          'text-slate-600': 'dark:text-slate-400',
          'text-slate-500': 'dark:text-slate-400'
      };

      const bgMap = {
          'bg-slate-50': 'dark:bg-slate-900', // might want to change this if it conflicts
          'bg-white': 'dark:bg-slate-900'
      };
      
      const borderMap = {
          'border-slate-200': 'dark:border-slate-800',
          'border-slate-300': 'dark:border-slate-700'
      };

      // We only apply additions if there isn't ALREADY a dark: variant for text/bg/border
      // To strictly avoid over-application, let's just do it manually for things
      
      let hasDarkText = classes.some(c => c.startsWith('dark:text-'));
      let hasDarkBg = classes.some(c => c.startsWith('dark:bg-'));
      let hasDarkBorder = classes.some(c => c.startsWith('dark:border-') && !c.includes('dark:border-transparent'));
      
      if (!hasDarkText) {
          for (let c of classes) {
              if (textMap[c]) newClasses.add(textMap[c]);
          }
      }

      if (!hasDarkBg) {
          // If it has bg-white, add dark:bg-slate-900
          if (newClasses.has('bg-white')) newClasses.add('dark:bg-slate-900');
          if (newClasses.has('bg-slate-50')) newClasses.add('dark:bg-slate-900');
      }

      if (!hasDarkBorder) {
          for (let c of classes) {
              if (borderMap[c]) newClasses.add(borderMap[c]);
          }
          if (newClasses.has('border') && !newClasses.has('dark:border-slate-800') && !newClasses.has('dark:border-slate-700')) {
             // newClasses.add('dark:border-slate-800'); // wait, this could apply everywhere
          }
      }

      // Check for divide
      let hasDarkDivide = classes.some(c => c.startsWith('dark:divide-'));
      if (!hasDarkDivide && newClasses.has('divide-slate-100')) {
          newClasses.add('dark:divide-slate-800');
      }
      
      // Check for hover:bg
      let hasDarkHoverBg = classes.some(c => c.startsWith('dark:hover:bg-'));
      if (!hasDarkHoverBg) {
          if (newClasses.has('hover:bg-slate-50')) newClasses.add('dark:hover:bg-slate-800/50');
          if (newClasses.has('hover:bg-slate-100')) newClasses.add('dark:hover:bg-slate-800');
      }

      return `className=${quote}${Array.from(newClasses).join(' ')}${quote}`;
  });

  if (text !== originalFile) {
    fs.writeFileSync(file, text);
    console.log("Improved styling in:", file);
  }
});
