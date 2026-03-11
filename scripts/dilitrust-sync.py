#!/usr/bin/env python3
"""
DiliTrust Sync — Automated document synchronization for Grupo Vidaro.

Downloads all documents from DiliTrust and organizes them by folder structure.
Supports incremental sync (only downloads new documents since last run).

Usage:
  python3 scripts/dilitrust-sync.py                  # Full sync
  python3 scripts/dilitrust-sync.py --new-only        # Only new docs since last sync
  python3 scripts/dilitrust-sync.py --list-folders     # List folder tree
  python3 scripts/dilitrust-sync.py --check-new        # Check for new docs without downloading

Environment:
  DILITRUST_EMAIL     (default: dvillagra@vidaroinversiones.com)
  DILITRUST_PASSWORD  (default from config)
  DILITRUST_GROUP_ID  (default: 7513017)

Scheduling (cron):
  # Run daily at 7 AM to pick up new documents
  0 7 * * * cd /workspace && python3 scripts/dilitrust-sync.py --new-only >> /var/log/inmova/dilitrust-sync.log 2>&1
"""
import sys, json, time, os, argparse, hashlib
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

EMAIL = os.environ.get('DILITRUST_EMAIL', 'dvillagra@vidaroinversiones.com')
PASSWORD = os.environ.get('DILITRUST_PASSWORD', 'Pucela000000#')
WEB = 'https://exec-eu.dilitrust.com'
GROUP_ID = os.environ.get('DILITRUST_GROUP_ID', '7513017')
DOWNLOAD_DIR = '/workspace/data/dilitrust-docs'
MANIFEST_FILE = '/workspace/data/dilitrust-manifest.json'
INVENTORY_FILE = '/workspace/data/dilitrust-inventory.json'
LANG = 'es'

os.makedirs(DOWNLOAD_DIR, exist_ok=True)

def log(msg, level='INFO'):
    ts = time.strftime('%Y-%m-%d %H:%M:%S')
    print(f"[{ts}] [{level}] {msg}")

def sanitize(name):
    for c in ['/', '\\', ':', '*', '?', '"', '<', '>', '|']:
        name = name.replace(c, '_')
    return name.strip()

def load_manifest():
    if os.path.exists(MANIFEST_FILE):
        with open(MANIFEST_FILE, 'r') as f:
            return json.load(f)
    return {'downloaded': {}, 'last_sync': None, 'stats': {}}

def save_manifest(manifest):
    with open(MANIFEST_FILE, 'w') as f:
        json.dump(manifest, f, indent=2, default=str)


class DiliTrustSync:
    def __init__(self):
        self.session = None
        self.cookies = {}
        self.manifest = load_manifest()
    
    def login(self):
        """Login to DiliTrust using Playwright and return session cookies."""
        from playwright.sync_api import sync_playwright
        
        log("Authenticating with DiliTrust...")
        
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context()
            page = context.new_page()
            
            page.goto(f"{WEB}/{LANG}/", wait_until='domcontentloaded', timeout=60000)
            page.wait_for_timeout(3000)
            
            # Two-step login: email → password
            page.locator('#login-name-input').fill(EMAIL)
            page.locator('button:has-text("Siguiente")').click()
            page.wait_for_timeout(3000)
            
            page.locator('input[type="password"]:visible').fill(PASSWORD)
            page.locator('button:has-text("Iniciar sesión")').click()
            page.wait_for_timeout(8000)
            
            if 'homepage' not in page.url:
                log(f"Unexpected URL after login: {page.url}", 'WARN')
            
            for cookie in context.cookies():
                self.cookies[cookie['name']] = cookie['value']
            
            browser.close()
        
        import requests
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/pdf, */*',
        })
        cookie_str = '; '.join([f"{n}={v}" for n, v in self.cookies.items()])
        self.session.headers['Cookie'] = cookie_str
        
        log("Authentication successful")
    
    def get_folders(self):
        """Get the complete folder tree."""
        import requests
        
        s = requests.Session()
        s.headers.update({
            'User-Agent': 'Mozilla/5.0',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
        })
        cookie_str = '; '.join([f"{n}={v}" for n, v in self.cookies.items()])
        s.headers['Cookie'] = cookie_str
        
        r = s.get(f"{WEB}/{LANG}/api/internal/folders", params={'group_id': GROUP_ID})
        if r.status_code != 200:
            log(f"Failed to get folders: HTTP {r.status_code}", 'ERROR')
            return []
        
        folders_data = r.json().get('data', [])
        
        result = []
        def flatten(folders, path=''):
            for f in folders:
                label = f.get('label', '?')
                fid = f.get('id', '?')
                current = f"{path}/{label}" if path else label
                result.append({'id': fid, 'label': label, 'path': current})
                if f.get('children'):
                    flatten(f['children'], current)
        
        flatten(folders_data)
        return result
    
    def get_documents_from_folders(self):
        """Get document list from each folder using the internal API.
        
        NOTE: The documents endpoint is intermittent (sometimes returns 404).
        This method works when the session has the right state.
        Falls back to the inventory file from the last successful scan.
        """
        import requests
        
        s = requests.Session()
        s.headers.update({
            'User-Agent': 'Mozilla/5.0',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
        })
        cookie_str = '; '.join([f"{n}={v}" for n, v in self.cookies.items()])
        s.headers['Cookie'] = cookie_str
        
        folders = self.get_folders()
        documents = []
        seen_ids = set()
        
        for folder in folders:
            fid = folder['id']
            fpath = folder['path']
            
            r = s.get(f"{WEB}/{LANG}/api/internal/documents", params={
                'group_id': GROUP_ID,
                'folder_id': fid,
            })
            
            if r.status_code != 200:
                continue
            
            try:
                items = r.json().get('data', [])
            except:
                continue
            
            if not isinstance(items, list) or len(items) == 0:
                continue
            
            for doc in items:
                file_info = doc.get('file', {})
                doc_id = str(doc.get('id', ''))
                if not doc_id or doc_id in seen_ids:
                    continue
                seen_ids.add(doc_id)
                
                documents.append({
                    'id': doc_id,
                    'filename': file_info.get('fileName', f'{doc_id}.pdf'),
                    'url': file_info.get('fileURI', f'{WEB}/{LANG}/system/encrypted-files/{GROUP_ID}/{doc_id}.pdf'),
                    'size': int(file_info.get('fileSize', 0)),
                    'folder_path': fpath,
                })
        
        return documents
    
    def get_documents_from_activities(self):
        """Get recent documents from promoted activities endpoint."""
        import requests
        
        s = requests.Session()
        s.headers.update({
            'User-Agent': 'Mozilla/5.0',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
        })
        cookie_str = '; '.join([f"{n}={v}" for n, v in self.cookies.items()])
        s.headers['Cookie'] = cookie_str
        
        r = s.get(f"{WEB}/{LANG}/api/internal/latest-activities", params={
            'group_id': GROUP_ID,
            'promote_only': '1',
            'tabular_id': 'latest_activities_tabular',
        })
        
        if r.status_code != 200:
            return []
        
        documents = []
        for act in r.json().get('data', []):
            a = act.get('activity', {})
            f = a.get('file', {})
            doc_id = str(a.get('nid', f.get('file_id', '')))
            if not doc_id:
                continue
            
            origin = f.get('file_origin', {})
            documents.append({
                'id': doc_id,
                'filename': a.get('title', f'{doc_id}.pdf'),
                'url': f.get('file_path', f'{WEB}/{LANG}/system/encrypted-files/{GROUP_ID}/{doc_id}.pdf'),
                'size': int(f.get('file_size', 0)),
                'folder_path': origin.get('label', 'Recent'),
            })
        
        return documents
    
    def get_all_documents(self):
        """Get complete document list from all sources."""
        # Primary source: folder listing
        docs = self.get_documents_from_folders()
        log(f"  Documents from folders: {len(docs)}")
        
        # Secondary source: promoted activities (always works)
        activity_docs = self.get_documents_from_activities()
        log(f"  Documents from activities: {len(activity_docs)}")
        
        # Merge, dedup by ID
        seen = {d['id'] for d in docs}
        for d in activity_docs:
            if d['id'] not in seen:
                docs.append(d)
                seen.add(d['id'])
        
        # Tertiary source: previous inventory (if folder listing failed)
        if len(docs) < 100 and os.path.exists(INVENTORY_FILE):
            with open(INVENTORY_FILE) as f:
                prev_inventory = json.load(f)
            for d in prev_inventory:
                if d['id'] not in seen:
                    docs.append(d)
                    seen.add(d['id'])
            log(f"  Added from previous inventory: {len(docs) - len(activity_docs)}")
        
        # Save inventory
        with open(INVENTORY_FILE, 'w') as f:
            json.dump(docs, f, indent=2, default=str)
        
        log(f"  Total unique documents: {len(docs)}")
        return docs
    
    def download(self, documents, new_only=False):
        """Download documents to organized folder structure."""
        downloaded = 0
        skipped = 0
        errors = 0
        total_bytes = 0
        
        for doc in documents:
            doc_id = doc['id']
            filename = sanitize(doc['filename'])
            folder = sanitize(doc['folder_path'].replace('/', os.sep))
            
            target_dir = os.path.join(DOWNLOAD_DIR, folder)
            os.makedirs(target_dir, exist_ok=True)
            target_path = os.path.join(target_dir, filename)
            
            # Skip if already downloaded
            if new_only and doc_id in self.manifest.get('downloaded', {}):
                existing = self.manifest['downloaded'][doc_id]
                if os.path.exists(existing.get('path', '')) and os.path.getsize(existing['path']) > 500:
                    skipped += 1
                    continue
            
            if os.path.exists(target_path) and os.path.getsize(target_path) > 500:
                self.manifest['downloaded'][doc_id] = {
                    'path': target_path,
                    'size': os.path.getsize(target_path),
                    'filename': filename,
                    'folder': doc['folder_path'],
                }
                skipped += 1
                continue
            
            try:
                r = self.session.get(doc['url'], stream=True, timeout=60)
                if r.status_code == 200:
                    with open(target_path, 'wb') as f:
                        for chunk in r.iter_content(chunk_size=8192):
                            f.write(chunk)
                    
                    file_size = os.path.getsize(target_path)
                    
                    with open(target_path, 'rb') as f:
                        header = f.read(5)
                    
                    if header == b'%PDF-' or file_size > 10000:
                        total_bytes += file_size
                        downloaded += 1
                        self.manifest['downloaded'][doc_id] = {
                            'path': target_path,
                            'size': file_size,
                            'filename': filename,
                            'folder': doc['folder_path'],
                            'synced_at': time.strftime('%Y-%m-%d %H:%M:%S'),
                        }
                    else:
                        os.remove(target_path)
                        errors += 1
                else:
                    errors += 1
            except Exception as e:
                errors += 1
                log(f"Error downloading {filename}: {str(e)[:60]}", 'ERROR')
            
            if (downloaded + errors) % 20 == 0 and downloaded > 0:
                save_manifest(self.manifest)
                log(f"  Progress: {downloaded} downloaded, {skipped} skipped, {errors} errors")
        
        return downloaded, skipped, errors, total_bytes
    
    def check_new(self):
        """Check for new documents without downloading."""
        docs = self.get_all_documents()
        known = set(self.manifest.get('downloaded', {}).keys())
        new_docs = [d for d in docs if d['id'] not in known]
        
        if new_docs:
            log(f"New documents found: {len(new_docs)}")
            for d in new_docs:
                log(f"  [{d['id']}] {d['filename']} ({d['folder_path']})")
        else:
            log("No new documents found")
        
        return new_docs
    
    def run(self, new_only=False, list_folders=False, check_new=False):
        """Main sync workflow."""
        log("=" * 60)
        log("DiliTrust Sync — Grupo Vidaro / Baldomero")
        log("=" * 60)
        
        self.login()
        
        if list_folders:
            folders = self.get_folders()
            for f in folders:
                depth = f['path'].count('/')
                log(f"{'  ' * depth}[{f['id']}] {f['label']}")
            return
        
        if check_new:
            self.check_new()
            return
        
        documents = self.get_all_documents()
        
        log(f"\nDownloading (new_only={new_only})...")
        downloaded, skipped, errors, total_bytes = self.download(documents, new_only)
        
        self.manifest['last_sync'] = time.strftime('%Y-%m-%d %H:%M:%S')
        self.manifest['stats'] = {
            'total_documents': len(documents),
            'downloaded_this_run': downloaded,
            'skipped': skipped,
            'errors': errors,
            'total_bytes_this_run': total_bytes,
            'total_in_manifest': len(self.manifest['downloaded']),
        }
        save_manifest(self.manifest)
        
        log(f"\n{'=' * 60}")
        log(f"Sync complete:")
        log(f"  Downloaded: {downloaded} ({total_bytes/1024/1024:.1f} MB)")
        log(f"  Skipped:    {skipped}")
        log(f"  Errors:     {errors}")
        log(f"  Total in manifest: {len(self.manifest['downloaded'])}")
        log(f"{'=' * 60}")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='DiliTrust Document Sync')
    parser.add_argument('--new-only', action='store_true', help='Only download new documents')
    parser.add_argument('--list-folders', action='store_true', help='List folder tree')
    parser.add_argument('--check-new', action='store_true', help='Check for new docs without downloading')
    args = parser.parse_args()
    
    sync = DiliTrustSync()
    sync.run(
        new_only=args.new_only,
        list_folders=args.list_folders,
        check_new=args.check_new,
    )
