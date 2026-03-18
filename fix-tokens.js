const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(fullPath));
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            results.push(fullPath);
        }
    });
    return results;
}

const rootDir = __dirname;
const dirs = [
    path.join(rootDir, 'apps', 'web', 'app'),
    path.join(rootDir, 'apps', 'web', 'components')
];

let updatedCount = 0;

dirs.forEach(dir => {
    const files = walk(dir);
    files.forEach(file => {
        let content = fs.readFileSync(file, 'utf8');
        
        let newContent = content.replaceAll("localStorage.getItem('token')", "(localStorage.getItem('auth_token') ?? localStorage.getItem('token'))");
        
        // Clean up any double wraps
        newContent = newContent.replaceAll("(localStorage.getItem('auth_token') ?? (localStorage.getItem('auth_token') ?? localStorage.getItem('token')))", "(localStorage.getItem('auth_token') ?? localStorage.getItem('token'))");
        newContent = newContent.replaceAll("((localStorage.getItem('auth_token') ?? localStorage.getItem('token')) ?? (localStorage.getItem('auth_token') ?? localStorage.getItem('token')))", "(localStorage.getItem('auth_token') ?? localStorage.getItem('token'))");

        if (content !== newContent) {
            fs.writeFileSync(file, newContent, 'utf8');
            console.log('Fixed:', file);
            updatedCount++;
        }
    });
});
console.log('Total files updated:', updatedCount);
