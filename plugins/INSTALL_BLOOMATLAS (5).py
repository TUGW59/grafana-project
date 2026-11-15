#!/usr/bin/env python3
"""Safely replace ONLY BloomAtlas World Explorer plugin files in the WSL project.
Preserves node_modules and dist so the running Grafana bind mount stays valid.
Backs up old plugin source outside the git repository.
"""
import json
import shutil
import subprocess
import sys
from datetime import datetime
from pathlib import Path

NAME = 'tugcetopuz-bloomatlasworld-panel'
SRC = Path(__file__).resolve().parent / NAME
ROOT = Path.cwd().resolve()
DEST = ROOT / 'plugins' / NAME
PRESERVE = {'node_modules', 'dist'}

if not ((ROOT / '.git').exists() and (ROOT / 'plugins').is_dir() and (ROOT / 'dashboards').is_dir()):
    sys.exit('ERROR: run from ~/projects/grafana-project (root containing .git/plugins/dashboards).')
if not DEST.is_dir():
    sys.exit(f'ERROR: plugin directory missing: {DEST}. Nothing was changed.')
try:
    branch = subprocess.check_output(['git','branch','--show-current'],cwd=ROOT,text=True).strip()
except Exception as ex:
    sys.exit('ERROR: cannot verify Git branch: ' + str(ex))
if branch != 'feat/world-explorer-mvp':
    sys.exit(f'ERROR: current branch is {branch!r}. Switch to feat/world-explorer-mvp first. No files changed.')
try:
    pkg=json.loads((SRC/'package.json').read_text())
    meta=json.loads((SRC/'src/plugin.json').read_text())
    lock=json.loads((SRC/'package-lock.json').read_text())
    if pkg['name'] != lock['name'] or meta['id'] != NAME: raise ValueError('metadata mismatch')
except Exception as ex:
    sys.exit('ERROR: invalid installation package: ' + str(ex))

backup_root=Path.home()/'bloomatlas-plugin-backups'
backup_root.mkdir(parents=True,exist_ok=True)
backup=backup_root/('before-clean-install-'+datetime.now().strftime('%Y%m%d-%H%M%S-%f'))
backup.mkdir()
moved=[]
try:
    # Move existing source/config, including stray copied files, to a reversible backup.
    # Keep node_modules and dist IN PLACE to protect dependencies and Grafana's bind mount.
    for item in list(DEST.iterdir()):
        if item.name in PRESERVE or item.name == '.env' or item.name.startswith('.env.'):
            continue
        shutil.move(str(item),str(backup/item.name))
        moved.append(item.name)
    # Copy complete, verified scaffold + MVP, without touching npm deps/dist.
    for item in SRC.iterdir():
        target=DEST/item.name
        if item.is_dir(): shutil.copytree(item,target)
        else: shutil.copy2(item,target)
    json.loads((DEST/'package.json').read_text())
except Exception as ex:
    # Restore original files on failure without touching preserved directories.
    for item in list(DEST.iterdir()):
        if item.name in PRESERVE or item.name == '.env' or item.name.startswith('.env.'): continue
        if item.is_dir():shutil.rmtree(item)
        else:item.unlink()
    for item in backup.iterdir():shutil.move(str(item),str(DEST/item.name))
    sys.exit('ERROR: installation rolled back. ' + str(ex))

print('\n✅ BloomAtlas World Explorer plugin source restored.')
print('✅ Previous non-runtime files backed up to:',backup)
print('✅ node_modules/ preserved:',(DEST/'node_modules').exists())
print('✅ dist/ preserved:',(DEST/'dist').exists())
print('✅ package.json valid; plugin ID:',meta['id'])
print('✅ Current branch:',branch)
print('NEXT: cd plugins/'+NAME+' && npm run typecheck && npm run lint && npm run test:ci && npm run build')
print('DO NOT run docker compose or delete the current Grafana container.')
