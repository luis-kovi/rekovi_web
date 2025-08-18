#!/usr/bin/env python3
import re
import os

def migrate_file(filepath):
    """Migra tags img para o componente Image do Next.js"""
    
    print(f"Processando: {filepath}")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Verifica se já tem o import do Image
    has_image_import = "import Image from 'next/image'" in content
    
    # Se não tem o import, adiciona após o último import
    if not has_image_import and '<img' in content:
        # Encontra o último import
        import_lines = []
        lines = content.split('\n')
        for i, line in enumerate(lines):
            if line.strip().startswith('import ') and ' from ' in line:
                import_lines.append(i)
        
        if import_lines:
            last_import_idx = import_lines[-1]
            lines.insert(last_import_idx + 1, "import Image from 'next/image'")
            content = '\n'.join(lines)
    
    # Substituições usando replace direto para evitar problemas com regex
    replacements = [
        # Logo principal
        ('<img \n              src="https://i.ibb.co/d4kbJGGY/rekovi-identity-updated-1-removebg-preview.png" \n              alt="Logo Kovi" \n              className="h-14 w-auto object-contain" \n              style={{ aspectRatio: \'406/130\' }}\n            />',
         '<Image \n              src="https://i.ibb.co/d4kbJGGY/rekovi-identity-updated-1-removebg-preview.png" \n              alt="Logo Kovi" \n              width={140}\n              height={45}\n              className="h-14 w-auto object-contain" \n              priority\n            />'),
        
        # Avatar
        ('<img \n                    src={userAvatar} \n                    alt="Avatar" \n                    className="w-10 h-10 rounded-full object-cover border-2 border-white/20"\n                  />',
         '<Image \n                    src={userAvatar} \n                    alt="Avatar" \n                    width={40}\n                    height={40}\n                    className="w-10 h-10 rounded-full object-cover border-2 border-white/20"\n                  />')
    ]
    
    # Aplica as substituições
    for old, new in replacements:
        content = content.replace(old, new)
    
    # Se houve mudanças, salva o arquivo
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ Migrado: {filepath}")
        return True
    else:
        print(f"ℹ️  Sem mudanças: {filepath}")
        return False

# Processa Header.tsx
migrate_file('components/Header.tsx')
