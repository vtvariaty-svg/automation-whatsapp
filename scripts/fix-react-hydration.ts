import * as fs from 'fs';
import * as path from 'path';

function findAndReplaceStrings(dir: string) {
  const files = fs.readdirSync(dir);
  let totalFixed = 0;

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory() && !fullPath.includes('node_modules') && !fullPath.includes('.next')) {
      totalFixed += findAndReplaceStrings(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      const regex1 = /\{([a-zA-Z0-9_.\s\[\]]+)\s*\?\s*(['"])(Salvando\.\.\.|Salvar|Salvar Alterações|Salvar configurações|Salvar empresa|Carregando\.\.\.|Enviando\.\.\.|Excluindo\.\.\.|Conectando\.\.\.|Processando\.\.\.|Atualizando\.\.\.|Gerando\.\.\.|Executando\.\.\.|Criando\.\.\.|Criar Produto|Salvo)\2\s*:\s*(['"])([^'"]+)\4\s*\}/g;
      
      let newContent = content.replace(regex1, (match, condition, q1, text1, q2, text2) => {
        // Skip if already in span or HTML tag
        if (text1.includes('<') || text2.includes('<')) return match;
        return `{${condition.trim()} ? <span>${text1}</span> : <span>${text2}</span>}`;
      });

      const regex2 = /\{([a-zA-Z0-9_.\s\[\]!]+)\s*\?\s*(['"])([^'"]+)\2\s*:\s*(['"])(Salvando\.\.\.|Salvar|Salvar Alterações|Salvar configurações|Salvar empresa|Carregando\.\.\.|Enviando\.\.\.|Excluindo\.\.\.|Conectando\.\.\.|Processando\.\.\.|Atualizando\.\.\.|Gerando\.\.\.|Executando\.\.\.|Criando\.\.\.|Criar Produto|Salvo)\4\s*\}/g;
      
      newContent = newContent.replace(regex2, (match, condition, q1, text1, q2, text2) => {
        if (text1.includes('<') || text2.includes('<')) return match;
        if (text1.length < 40 && !text1.includes('bg-') && !text1.includes('text-')) {
          return `{${condition.trim()} ? <span>${text1}</span> : <span>${text2}</span>}`;
        }
        return match;
      });

      // Simple {loading && "Carregando..."}
      const regex3 = /\{([a-zA-Z0-9_.\s\[\]!]+)\s*&&\s*(['"])(Carregando\.\.\.|Salvando\.\.\.|Enviando\.\.\.|Conectando\.\.\.)\2\s*\}/g;
      newContent = newContent.replace(regex3, (match, condition, q, text) => {
        return `{${condition.trim()} && <span>${text}</span>}`;
      });


      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log(`Fixed: ${fullPath.split('\\apps\\web\\')[1]}`);
        totalFixed++;
      }
    }
  }
  return totalFixed;
}

console.log('--- React Hydration Auto-Fixer ---');
const frontendDir = path.join(process.cwd(), 'apps', 'web');
const dirsToScan = [
  path.join(frontendDir, 'app'),
  path.join(frontendDir, 'components')
];

let total = 0;
for (const dir of dirsToScan) {
  if (fs.existsSync(dir)) {
    total += findAndReplaceStrings(dir);
  }
}
console.log(`\nTotal files protected: ${total}`);
