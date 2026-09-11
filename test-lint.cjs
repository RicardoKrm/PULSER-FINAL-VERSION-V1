const { execSync } = require('child_process');
try {
  execSync('npm run lint', { stdio: 'inherit' });
  console.log('Linting passed.');
} catch (e) {
  console.log('Linting failed.');
}
