"""Nominal, no-follow source capture and lock/SRI-only public blob restoration."""
import os, hashlib, stat, json, sys, subprocess, base64, urllib.request, tarfile, io
from pathlib import PurePosixPath
from urllib.parse import urlparse

BLOCKED = (".specs/evidence/r11-t13/boot-resume/logs/api-serve-ttl15.log", "src/api/config.ts", "tests/r19b/receipts/tsc-r19b-v1.log", "tests/r19b/tsconfig.json")
GIT = ['git', '--no-optional-locks', '-c', 'core.fsmonitor=false', '-c', 'core.hooksPath=/dev/null']
EXCLUDES = [':(exclude,literal)' + p for p in BLOCKED]
BASE_COMMIT = 'f801b24df3e750f727dacc9cdc69dab75e5fbab9'
CACHE = '/mnt/data/npm-cache/cache/_cacache/content-v2'
OWN_PATH = 'src/lib/public-church-utils.ts'
OWN_BASE_MODE = '100644'
OWN_BASE_BLOB = '001090c4ed2c540ff8ebfe5616bc2e7f5a2fb3f9'
OWN_BASE_SHA256 = 'f7d4d4818adc79087a3407ba3312c94d91f1618b91a13e98029cfcbbd6c9f131'
OWN_SNAPSHOT_SHA256 = '145321e59829cc5b397671d58ed5678c7700d88ee983cf52ae7d0a5e10851e53'
OWN_SNAPSHOT_BLOB = '27a4fab531e1d01a01349f1ab23bb8ba582bd101'
OWN_ORIGIN = 'OWN:normalizeAddress'
PRIOR_ATTEMPTS = ('attempt-04', 'attempt-05')
SOURCE_TREE_PATHS = ('src', 'public', 'package.json', 'package-lock.json', 'next.config.ts', 'postcss.config.mjs', 'tsconfig.json')

def guard(path):
    if not path or '..' in path.split('/') or any(b in path for b in BLOCKED):
        raise ValueError('forbidden lexical path')
    return path

def capture(root, path):
    guard(path)
    if path.startswith('/'):
        raise ValueError('source must be relative')
    full = os.path.abspath(root).split('/')[1:] + path.split('/')
    for i in range(1, len(full) + 1):
        guard('/'.join(full[:i]))
    fd = os.open('/', os.O_RDONLY | os.O_DIRECTORY)
    try:
        for part in full[:-1]:
            child = os.open(part, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW, dir_fd=fd)
            os.close(fd)
            fd = child
        child = os.open(full[-1], os.O_RDONLY | os.O_NOFOLLOW, dir_fd=fd)
        with os.fdopen(child, 'rb') as handle:
            info = os.fstat(handle.fileno())
            if not stat.S_ISREG(info.st_mode):
                raise ValueError('not regular')
            data = handle.read()
    finally:
        os.close(fd)
    return data, {'path': path, 'sha256': hashlib.sha256(data).hexdigest(), 'mode': stat.S_IMODE(info.st_mode)}

def list_directory(root, path):
    guard(path)
    if path.startswith('/'):
        raise ValueError('directory must be relative')
    full = os.path.abspath(root).split('/')[1:] + path.split('/')
    for i in range(1, len(full) + 1):
        guard('/'.join(full[:i]))
    fd = os.open('/', os.O_RDONLY | os.O_DIRECTORY)
    try:
        for part in full:
            child = os.open(part, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW, dir_fd=fd)
            os.close(fd)
            fd = child
        if stat.S_IMODE(os.fstat(fd).st_mode) != 0o700:
            raise ValueError('private input directory mode mismatch')
        return os.listdir(fd)
    finally:
        os.close(fd)

def put(path, data):
    guard(str(path))
    os.makedirs(os.path.dirname(path), mode=0o700, exist_ok=True)
    with os.fdopen(os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600), 'wb') as f:
        f.write(data if isinstance(data, bytes) else data.encode())

def record(path, value):
    put(path, json.dumps(value, indent=2, ensure_ascii=False))

def git_blob(data):
    return hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()

def source_tree(repo, commit):
    output = git(repo, 'ls-tree', '-r', '-z', commit, '--', *SOURCE_TREE_PATHS)
    entries = {}
    for entry in output.split(b'\0'):
        if not entry:
            continue
        fields, path = entry.decode().split('\t')
        mode, kind, oid = fields.split()
        guard(path)
        assert kind == 'blob' and mode in ('100644', '100755')
        assert path not in entries
        entries[path] = (oid, mode)
    return entries

def source_maps(manifest):
    if manifest.get('base_commit') != BASE_COMMIT:
        raise ValueError('source manifest BASE mismatch')
    base_tree = {}
    candidate_tree = {}
    own_count = 0
    for item in manifest['sources']:
        path = guard(item['path'])
        if path in base_tree:
            raise ValueError('duplicate source path')
        base_blob, base_mode = item['base_blob'], item['base_mode']
        snapshot_blob, snapshot_mode = item['snapshot_blob'], item['snapshot_mode']
        if len(item['base_sha256']) != 64 or len(item['snapshot_sha256']) != 64:
            raise ValueError('source SHA-256 pin malformed')
        try:
            int(item['base_sha256'], 16)
            int(item['snapshot_sha256'], 16)
        except (TypeError, ValueError):
            raise ValueError('source SHA-256 pin malformed')
        if base_mode not in ('100644', '100755') or snapshot_mode not in ('100644', '100755'):
            raise ValueError('source mode not approved')
        if path == OWN_PATH:
            admit_own_snapshot(path, base_mode, base_blob, item['base_sha256'], item['snapshot_sha256'], snapshot_blob)
            if snapshot_mode != OWN_BASE_MODE or item['snapshot_origin'] != OWN_ORIGIN:
                raise ValueError('OWN snapshot mode/origin mismatch')
            own_count += 1
        else:
            if item['snapshot_origin'] != 'BASE':
                raise ValueError('snapshot origin outside BASE/OWN closure')
            if snapshot_blob != base_blob or item['snapshot_sha256'] != item['base_sha256'] or snapshot_mode != base_mode:
                raise ValueError('BASE snapshot differs from immutable source')
        base_tree[path] = (base_blob, base_mode)
        candidate_tree[path] = (snapshot_blob, snapshot_mode)
    base_count = sum(item['snapshot_origin'] == 'BASE' for item in manifest['sources'])
    if len(base_tree) != 106 or base_count != 105 or own_count != 1 or OWN_PATH not in base_tree:
        raise ValueError('candidate must be 105 BASE sources plus one OWN source')
    return base_tree, candidate_tree

def validate_head_tree_state(current_head, is_base_ancestor, base_tree, current_tree, expected_base, expected_candidate):
    if base_tree != expected_base:
        raise ValueError('immutable BASE source tree mismatch')
    if current_head == BASE_COMMIT:
        if current_tree != expected_base:
            raise ValueError('pre-commit HEAD is not the BASE tree')
        return 'precommit-base'
    if not is_base_ancestor:
        raise ValueError('current HEAD is not a BASE descendant')
    if current_tree != expected_candidate:
        raise ValueError('current HEAD source tree is not the fixed candidate')
    return 'committed-candidate'

def guarded_source_capture(current_head, is_base_ancestor, base_tree, current_tree, expected_base, expected_candidate, read_sources):
    state = validate_head_tree_state(current_head, is_base_ancestor, base_tree, current_tree, expected_base, expected_candidate)
    return state, read_sources()

def admit_own_snapshot(path, base_mode, base_blob, base_sha256, snapshot_sha256, snapshot_blob):
    guard(path)
    if path != OWN_PATH:
        raise ValueError('OWN override path not approved')
    if (base_mode, base_blob, base_sha256) != (OWN_BASE_MODE, OWN_BASE_BLOB, OWN_BASE_SHA256):
        raise ValueError('OWN BASE preimage mismatch')
    if (snapshot_sha256, snapshot_blob) != (OWN_SNAPSHOT_SHA256, OWN_SNAPSHOT_BLOB):
        raise ValueError('OWN snapshot hash mismatch')
    return OWN_ORIGIN

def git(repo, *args):
    return subprocess.check_output(GIT + ['-C', repo] + list(args))

def is_base_ancestor(repo, current_head):
    result = subprocess.run(GIT + ['-C', repo, 'merge-base', '--is-ancestor', BASE_COMMIT, current_head], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    if result.returncode not in (0, 1):
        raise RuntimeError('cannot determine current HEAD ancestry')
    return result.returncode == 0

def pins(repo):
    values = {}
    for label, path in [('head_ref_file', '.git/HEAD'), ('index_file', '.git/index')]:
        _, values[label] = capture(repo, path)
    values['current_head_commit'] = git(repo, 'rev-parse', 'HEAD').decode().strip()
    return values

def closure(lock):
    packages = lock['packages']
    roots = list(packages['']['dependencies']) + ['@tailwindcss/postcss', '@playwright/test', 'typescript', '@types/node', '@types/react', '@types/react-dom']
    todo = ['node_modules/' + name for name in roots]
    seen = set()
    excluded = []
    while todo:
        p = todo.pop()
        if p in seen:
            continue
        v = packages[p]
        if (v.get('os') and 'linux' not in v['os']) or (v.get('cpu') and 'x64' not in v['cpu']) or (v.get('libc') and 'glibc' not in v['libc']) or p.endswith('-musl'):
            excluded.append(p)
            continue
        seen.add(p)
        for name in {**v.get('dependencies', {}), **v.get('optionalDependencies', {})}:
            parts = p.split('/')
            candidates = []
            while parts:
                candidates.append('/'.join(parts) + '/node_modules/' + name)
                parts.pop()
            candidates.append('node_modules/' + name)
            resolved = next((x for x in candidates if x in packages), None)
            if resolved:
                todo.append(resolved)
    return [{'path': p, **{k: packages[p][k] for k in ['version', 'resolved', 'integrity']}} for p in sorted(seen)], sorted(set(excluded))

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        raise ValueError('redirect forbidden')

def verified_prior_downloads(prior_root, allowlist):
    if not prior_root or not os.path.isabs(prior_root) or '..' in prior_root.split('/'):
        raise ValueError('prior input root must be an absolute lexical path')
    allowlist_data, allowlist_pin = capture(prior_root, 'attempt-05/allowlist.json')
    restoration_data, restoration_pin = capture(prior_root, 'attempt-05/restoration.json')
    assert allowlist_pin['mode'] == 0o600 and restoration_pin['mode'] == 0o600
    recorded_allowlist = json.loads(allowlist_data)
    restoration = json.loads(restoration_data)
    assert recorded_allowlist['packages'] == allowlist
    assert len(restoration['packages']) == len(allowlist)
    for item, receipt in zip(allowlist, restoration['packages']):
        assert (item['path'], item['version'], item['integrity']) == (receipt['package'], receipt['version'], receipt['integrity'])

    found = {}
    counts = {}
    for attempt in PRIOR_ATTEMPTS:
        directory = attempt + '/downloads'
        names = list_directory(prior_root, directory)
        receipt_names = sorted((name for name in names if name.endswith('.receipt.json')), key=lambda name: int(name.split('.')[0]))
        raw_names = {name for name in names if name.endswith('.raw')}
        assert all(name[:-len('.receipt.json')].isdigit() for name in receipt_names)
        assert raw_names == {name[:-len('.receipt.json')] + '.raw' for name in receipt_names}
        assert set(names) == set(receipt_names) | raw_names
        counts[attempt] = len(receipt_names)
        for receipt_name in receipt_names:
            index = int(receipt_name.split('.')[0])
            assert 0 <= index < len(allowlist) and index not in found
            item = allowlist[index]
            receipt_data, receipt_pin = capture(prior_root, directory + '/' + receipt_name)
            data, data_pin = capture(prior_root, directory + '/' + str(index) + '.raw')
            assert receipt_pin['mode'] == 0o600 and data_pin['mode'] == 0o600
            receipt = json.loads(receipt_data)
            parsed = urlparse(receipt['url'])
            assert item['resolved'].startswith('https://registry.npmjs.org/')
            assert receipt['url'] == item['resolved']
            assert parsed.scheme == 'https' and parsed.netloc == 'registry.npmjs.org'
            assert receipt['received_bytes'] == len(data)
            actual = 'sha512-' + base64.b64encode(hashlib.sha512(data).digest()).decode()
            assert actual == item['integrity']
            found[index] = {'data': data, 'attempt': attempt}
    return found, {
        'root': os.path.abspath(prior_root),
        'allowlist_sha256': hashlib.sha256(allowlist_data).hexdigest(),
        'restoration_sha256': hashlib.sha256(restoration_data).hexdigest(),
        'attempt_receipts': counts,
        'verified_raws': len(found),
    }

def prepare(repo, reserve, download=False, prior_requests=0, prior_bytes=0):
    os.umask(0o077)
    os.makedirs(reserve, mode=0o700, exist_ok=False)
    current_head = git(repo, 'rev-parse', 'HEAD').decode().strip()
    before = pins(repo)
    record(reserve + '/before-git.json', before)
    manifest = json.loads(capture(repo, 'tests/v1d-public-site-readiness/sources.json')[0])
    expected_base, expected_candidate = source_maps(manifest)
    base_tree = source_tree(repo, BASE_COMMIT)
    current_tree = source_tree(repo, current_head)
    ancestor = current_head == BASE_COMMIT or is_base_ancestor(repo, current_head)
    if not ancestor:
        raise ValueError('current HEAD is not a BASE descendant')

    def read_sources():
        if base_tree != expected_base:
            raise ValueError('immutable BASE source tree mismatch')
        captured = []
        payloads = []
        for item in manifest['sources']:
            path = guard(item['path'])
            data, working_pin = capture(repo, path)
            working_sha256 = hashlib.sha256(data).hexdigest()
            if (working_sha256, working_pin['mode']) != (item['working_tree_sha256'], item['working_tree_mode']):
                raise ValueError('pinned working tree source mismatch: ' + path)
            base_data = git(repo, 'show', BASE_COMMIT + ':' + path)
            base_blob = git_blob(base_data)
            base_sha256 = hashlib.sha256(base_data).hexdigest()
            if (base_blob, base_sha256) != (item['base_blob'], item['base_sha256']):
                raise ValueError('immutable BASE source pin mismatch: ' + path)
            if item['snapshot_origin'] == OWN_ORIGIN:
                snapshot_data = data
                snapshot_blob = git_blob(snapshot_data)
                snapshot_sha256 = hashlib.sha256(snapshot_data).hexdigest()
                admit_own_snapshot(path, item['base_mode'], base_blob, base_sha256, snapshot_sha256, snapshot_blob)
            else:
                snapshot_data = base_data
                snapshot_blob = base_blob
                snapshot_sha256 = base_sha256
            if (snapshot_blob, snapshot_sha256) != (item['snapshot_blob'], item['snapshot_sha256']):
                raise ValueError('fixed candidate snapshot pin mismatch: ' + path)
            row = dict(item)
            working_git_mode = '100755' if working_pin['mode'] & 0o111 else '100644'
            row['working_tree_matches_BASE'] = working_git_mode == item['base_mode'] and git_blob(data) == base_blob
            captured.append(row)
            payloads.append((path, snapshot_data))
        if len(captured) != 106 or sum(row['snapshot_origin'] == OWN_ORIGIN for row in captured) != 1:
            raise ValueError('candidate capture is not 105 BASE plus one OWN')
        return captured, payloads

    state, result = guarded_source_capture(current_head, ancestor, base_tree, current_tree, expected_base, expected_candidate, read_sources)
    captured, payloads = result
    record(reserve + '/snapshot-state.json', {
        'base_commit': BASE_COMMIT,
        'current_head_commit': current_head,
        'tree_state': state,
        'base_sources': sum(row['snapshot_origin'] == 'BASE' for row in captured),
        'own_sources': sum(row['snapshot_origin'] == OWN_ORIGIN for row in captured),
        'own_candidate': {'path': OWN_PATH, 'blob': OWN_SNAPSHOT_BLOB, 'sha256': OWN_SNAPSHOT_SHA256, 'mode': OWN_BASE_MODE},
    })
    record(reserve + '/sources-before.json', {'base_commit': BASE_COMMIT, 'current_head_commit': current_head, 'tree_state': state, 'sources': captured})
    for path, data in payloads:
        put(reserve + '/app/' + path, data)
    for name in ['run.mjs', 'fixture.mjs', 'public.spec.mjs', 'guard.py', 'sources.json', 'README.md']:
        data, _ = capture(repo, 'tests/v1d-public-site-readiness/' + name)
        put(reserve + '/harness/' + name, data)
    lock = json.loads(dict(payloads)['package-lock.json'])
    allowlist, excluded = closure(lock)
    assert len(allowlist) <= 88
    for item in allowlist:
        assert item['resolved'].startswith('https://registry.npmjs.org/')
        assert item['integrity'].startswith('sha512-')
    record(reserve + '/allowlist.json', {'packages': allowlist, 'excluded_platform_optional': excluded, 'caps': {'objects': 88, 'requests': 100, 'compressed_bytes': 250 * 1024**2, 'extracted_bytes': 1024**3, 'timeout_seconds': 30, 'retries': 0, 'concurrency': 1}})
    cached = {}
    baseline = []
    for item in allowlist:
        digest = base64.b64decode(item['integrity'][7:]).hex()
        relative = 'sha512/' + digest[:2] + '/' + digest[2:4] + '/' + digest[4:]
        try:
            data, pin = capture(CACHE, relative)
        except FileNotFoundError:
            continue
        assert hashlib.sha512(data).hexdigest() == digest
        cached[item['path']] = data
        baseline.append({'package': item['path'], **pin})
    record(reserve + '/cached-before.json', baseline)
    prior_root = os.environ.get('V1D_PRIOR_ROOT')
    prior_data, prior_pin = verified_prior_downloads(prior_root, allowlist) if prior_root else ({}, None)
    record(reserve + '/acquisition-plan.json', {
        'allowlist_sha256': hashlib.sha256(capture(reserve, 'allowlist.json')[0]).hexdigest(),
        'requests': prior_requests,
        'bytes': prior_bytes,
        'cache_objects': len(cached),
        'missing_objects': len(allowlist) - len(cached),
        'verified_prior_downloads': len(prior_data),
        'prior_input': prior_pin,
        'download_authorized_flag': download,
    })
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}), NoRedirect())
    requests, transferred, extracted = prior_requests, prior_bytes, 0
    journal = []
    validated = []
    for index, item in enumerate(allowlist):
        data = cached.get(item['path'])
        source = 'cache' if data is not None else None
        prior_attempt = None
        if data is None and index in prior_data:
            data = prior_data[index]['data']
            prior_attempt = prior_data[index]['attempt']
            source = 'prior'
        if data is None:
            if not download:
                raise RuntimeError('missing public blob; rerun in NEW reserve with --download after approval')
            source = 'network'
            requests += 1
            assert requests <= 100
            data = b''
            try:
                req = urllib.request.Request(item['resolved'], headers={'User-Agent': 'V1d-lock-restoration/1'})
                with opener.open(req, timeout=30) as response:
                    assert response.status == 200 and response.url == item['resolved']
                    assert response.headers.get_content_type() in ('application/octet-stream', 'application/x-tar', 'application/gzip')
                    while True:
                        block = response.read(65536)
                        if not block:
                            break
                        transferred += len(block)
                        assert transferred <= 250 * 1024**2
                        data += block
            finally:
                put(reserve + '/downloads/' + str(index) + '.raw', data)
                record(reserve + '/downloads/' + str(index) + '.receipt.json', {'url': item['resolved'], 'requests_cumulative': requests, 'bytes_cumulative': transferred, 'received_bytes': len(data)})
        assert 'sha512-' + base64.b64encode(hashlib.sha512(data).digest()).decode() == item['integrity']
        # Inspect the entire archive before any extraction or member filesystem IO.
        with tarfile.open(fileobj=io.BytesIO(data), mode='r:gz') as tar:
            members = tar.getmembers()
            roots = {member.name.split('/')[0] for member in members}
            assert len(roots) == 1
            archive_root = next(iter(roots))
            guard(archive_root)
            metadata = json.load(tar.extractfile(archive_root + '/package.json'))
            assert metadata['name'] == item['path'].split('node_modules/')[-1]
            assert metadata['version'] == item['version']
            for member in members:
                guard(member.name)
                assert (member.name == archive_root or member.name.startswith(archive_root + '/')) and not member.name.startswith('/')
                assert member.isfile() or member.isdir(), 'archive links/special files forbidden'
                extracted += member.size
                assert extracted <= 1024**3
        validated.append({'item': item, 'data': data, 'archive_root': archive_root, 'source': source, 'prior_attempt': prior_attempt})
    for package in validated:
        item = package['item']
        data = package['data']
        archive_root = package['archive_root']
        with tarfile.open(fileobj=io.BytesIO(data), mode='r:gz') as tar:
            for member in tar.getmembers():
                if member.isfile():
                    relative = member.name[len(archive_root) + 1:]
                    guard(relative)
                    put(reserve + '/app/' + item['path'] + '/' + relative, tar.extractfile(member).read())
        journal.append({
            'package': item['path'],
            'version': item['version'],
            'integrity': item['integrity'],
            'cache': package['source'] == 'cache',
            'prior_verified_download': package['source'] == 'prior',
            'prior_attempt': package['prior_attempt'],
            'source': package['source'],
            'compressed_bytes': len(data),
        })
    record(reserve + '/restoration.json', {'packages': journal, 'requests': requests, 'transferred_bytes': transferred, 'extracted_bytes': extracted, 'lifecycle': False})
    verify(repo, reserve, 'after-prepare')
    print(json.dumps({'reserve': reserve, 'sources': len(captured), 'packages': len(journal), 'requests': requests, 'bytes': transferred}))

def verify(repo, reserve, label):
    expected = json.loads(capture(reserve, 'sources-before.json')[0])
    actual = [capture(repo, p['path'])[1] for p in expected['sources']]
    assert all((p['path'], p['working_tree_sha256'], p['working_tree_mode']) == (a['path'], a['sha256'], a['mode']) for p, a in zip(expected['sources'], actual))
    before = json.loads(capture(reserve, 'before-git.json')[0])
    after = pins(repo)
    assert before == after
    record(reserve + '/' + label + '-preservation.json', {'sources': len(actual), 'identical': True, 'git': after, 'tree_state': expected['tree_state']})

def selftest():
    count = 0
    for p in BLOCKED:
        for value in [p, 'prefix/' + p, 'prefix/' + p + '.copy', '../' + p]:
            try:
                guard(value)
            except ValueError:
                count += 1
            else:
                raise AssertionError('protected lexical form accepted')
    try:
        guard('safe/../other')
    except ValueError:
        count += 1
    assert guard('src/app/page.tsx') == 'src/app/page.tsx'
    assert count == 17
    own_args = (OWN_PATH, OWN_BASE_MODE, OWN_BASE_BLOB, OWN_BASE_SHA256, OWN_SNAPSHOT_SHA256, OWN_SNAPSHOT_BLOB)
    assert admit_own_snapshot(*own_args) == OWN_ORIGIN
    own_rejections = 0
    invalid_own = [
        ('src/lib/other.ts', *own_args[1:]),
        (OWN_PATH, OWN_BASE_MODE, OWN_BASE_BLOB, '0' * 64, OWN_SNAPSHOT_SHA256, OWN_SNAPSHOT_BLOB),
        (OWN_PATH, '100755', OWN_BASE_BLOB, OWN_BASE_SHA256, OWN_SNAPSHOT_SHA256, OWN_SNAPSHOT_BLOB),
        (OWN_PATH, OWN_BASE_MODE, '0' * 40, OWN_BASE_SHA256, OWN_SNAPSHOT_SHA256, OWN_SNAPSHOT_BLOB),
        (OWN_PATH, OWN_BASE_MODE, OWN_BASE_BLOB, OWN_BASE_SHA256, '0' * 64, OWN_SNAPSHOT_BLOB),
        (OWN_PATH, OWN_BASE_MODE, OWN_BASE_BLOB, OWN_BASE_SHA256, OWN_SNAPSHOT_SHA256, '0' * 40),
    ]
    for args in invalid_own:
        try:
            admit_own_snapshot(*args)
        except ValueError:
            own_rejections += 1
        else:
            raise AssertionError('invalid OWN snapshot admission accepted')
    assert own_rejections == len(invalid_own)

    base = {OWN_PATH: (OWN_BASE_BLOB, OWN_BASE_MODE), 'src/app/page.tsx': ('base-app-blob', '100644')}
    candidate = {OWN_PATH: (OWN_SNAPSHOT_BLOB, OWN_BASE_MODE), 'src/app/page.tsx': ('base-app-blob', '100644')}
    assert validate_head_tree_state(BASE_COMMIT, True, base, base, base, candidate) == 'precommit-base'
    assert validate_head_tree_state('simulated-descendant', True, base, candidate, base, candidate) == 'committed-candidate'
    tree_rejections = 0
    invalid_trees = [
        ('simulated-non-descendant', False, candidate),
        ('simulated-divergent-source', True, {**candidate, 'src/app/page.tsx': ('different-app-blob', '100644')}),
        ('simulated-wrong-own', True, {**candidate, OWN_PATH: ('wrong-own-blob', OWN_BASE_MODE)}),
    ]
    for head, ancestor, tree in invalid_trees:
        try:
            validate_head_tree_state(head, ancestor, base, tree, base, candidate)
        except ValueError:
            tree_rejections += 1
        else:
            raise AssertionError('invalid current source tree accepted')
    assert tree_rejections == len(invalid_trees)
    capture_calls = []
    def source_io_probe():
        capture_calls.append('read')
        return 'captured'
    assert guarded_source_capture(BASE_COMMIT, True, base, base, base, candidate, source_io_probe) == ('precommit-base', 'captured')
    assert guarded_source_capture('simulated-descendant', True, base, candidate, base, candidate, source_io_probe) == ('committed-candidate', 'captured')
    io_rejections = 0
    for head, ancestor, tree in invalid_trees:
        before_calls = len(capture_calls)
        try:
            guarded_source_capture(head, ancestor, base, tree, base, candidate, source_io_probe)
        except ValueError:
            io_rejections += 1
            assert len(capture_calls) == before_calls
        else:
            raise AssertionError('tree guard ran source IO for invalid tree')
    assert io_rejections == 3
    try:
        verified_prior_downloads('relative/input', [])
    except ValueError:
        prior_root_rejections = 1
    else:
        raise AssertionError('relative prior input root accepted')
    print(json.dumps({'guard_rejections': count, 'positive_control': 1, 'own_snapshot_positive_controls': 1, 'own_snapshot_rejections': own_rejections, 'tree_state_positive_controls': 2, 'tree_state_rejections': tree_rejections, 'tree_guard_io_positive_controls': 2, 'pre_guard_io_rejections': io_rejections, 'prior_root_rejections': prior_root_rejections, 'forbidden_IO': 0}))

def cloneown(prepared, destination):
    os.umask(0o077)
    source = prepared + '/app'
    manifest = json.loads(capture(prepared, 'sources-before.json')[0])
    own_count = 0
    base_count = 0
    for item in manifest['sources']:
        data, pin = capture(source, item['path'])
        assert pin['sha256'] == item['snapshot_sha256']
        if item['snapshot_origin'] == OWN_ORIGIN:
            assert item['path'] == OWN_PATH
            assert item['base_mode'] == OWN_BASE_MODE and item['base_blob'] == OWN_BASE_BLOB
            assert item['base_sha256'] == OWN_BASE_SHA256
            assert item['snapshot_mode'] == OWN_BASE_MODE
            assert item['snapshot_sha256'] == OWN_SNAPSHOT_SHA256
            assert item['snapshot_blob'] == OWN_SNAPSHOT_BLOB and git_blob(data) == item['snapshot_blob']
            own_count += 1
        else:
            assert item['snapshot_origin'] == 'BASE'
            assert item['snapshot_blob'] == item['base_blob'] and item['snapshot_mode'] == item['base_mode']
            assert git_blob(data) == item['base_blob'] and item['snapshot_sha256'] == item['base_sha256']
            base_count += 1
        put(destination + '/' + item['path'], data)
    assert own_count == 1 and base_count == 105, 'clone must contain 105 BASE sources plus one OWN snapshot source'
    dependency_pins = []
    for directory, dirs, files in os.walk(source + '/node_modules', followlinks=False):
        relative_directory = os.path.relpath(directory, source)
        guard(relative_directory)
        for name in dirs + files:
            guard(relative_directory + '/' + name)
        for name in files:
            relative = relative_directory + '/' + name
            data, pin = capture(source, relative)
            put(destination + '/' + relative, data)
            dependency_pins.append(pin)
    record(os.path.dirname(destination) + '/cloned-dependencies.json', dependency_pins)
    print(json.dumps({'clone_sources': len(manifest['sources']), 'base_sources': base_count, 'own_sources': own_count, 'tree_state': manifest['tree_state'], 'clone_dependency_files': len(dependency_pins)}))

if __name__ == '__main__':
    if sys.argv[1] == 'prepare':
        prepare(sys.argv[2], sys.argv[3], '--download' in sys.argv, int(os.environ.get('V1D_PRIOR_REQUESTS', '0')), int(os.environ.get('V1D_PRIOR_BYTES', '0')))
    elif sys.argv[1] == 'clone':
        cloneown(sys.argv[2], sys.argv[3])
    elif sys.argv[1] == 'verify':
        verify(*sys.argv[2:5])
    elif sys.argv[1] == 'selftest':
        selftest()
    else:
        for path in sys.argv[2:]:
            data, pin = capture(sys.argv[1], path)
            print('FILE', path, json.dumps(pin))
            print(data.decode())
