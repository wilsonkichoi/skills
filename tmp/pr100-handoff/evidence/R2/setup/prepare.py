# /// script
# requires-python = ">=3.11"
# ///
"""Seed batch R2 fixture state. Run once, locally, by the packet preparer (not in the cloud).

Mirrors evidence/R/prepare.py and R's later unchanged-ready-r seed, on the fresh R2 fixture.
Usage: uv run --script prepare.py <fixture checkout>
Writes every request and readback to setup/raw/ and the numbers to setup/fixtures.json.
"""
from pathlib import Path
import datetime, json, subprocess, sys

here = Path(__file__).resolve().parent
root = Path(sys.argv[1]).resolve()
repo = 'wilsonkichoi/wkc-yolo-fixture-r2-cloud-20261104'
tickets = here.parent.parent.parent / 'fixtures/tickets'
raw = here / 'raw'; raw.mkdir(exist_ok=True)
tr = ['uv', 'run', '-q', '--script', str(root / '.claude/skills/wkc-tracker/github.py'), '--repo', repo]
now = datetime.datetime.now(datetime.timezone.utc)
started = now.strftime('%Y-%m-%dT%H:%M:%SZ')
stamp = now.strftime('%Y%m%dT%H%M')
TITLES = {'help-usage': 'docs: usage page for kv help', 'keys-order': 'kv keys: list the keys',
          'append': 'kv append: add to a value', 'retired-prerequisite': 'docs: usage page for kv set'}


def run(cmd, name):
    r = subprocess.run([str(x) for x in cmd], cwd=root, text=True, capture_output=True)
    (raw / name).write_text(r.stdout + r.stderr)
    if r.returncode:
        raise SystemExit(f'{name}: {r.returncode}: {r.stdout + r.stderr}')
    return r.stdout


def call(args, name): return json.loads(run(tr + args, name + '.json'))
def file(name, text): p = raw / name; p.write_text(text); return str(p)


def ticket(m, source, suffix=''):
    body = (tickets / f'{source}.md').read_text()
    p = file(f'{m}-body-{source}.md', body)
    n = call(['create', '--title', TITLES[source] + suffix, '--body-file', p, '--milestone', m], f'{m}-create-{source}')['number']
    call(['move', str(n), 'ready'], f'{m}-ready-{n}')
    return n


def comment(n, text, name): return call(['comment', str(n), '--body-file', file(name + '.md', text)], name)


def branch(m):
    br = f'run/{m}-{stamp}'
    run(['git', 'branch', br, 'origin/main'], m + '-branch.txt')
    run(['git', 'push', 'origin', br], m + '-push.txt')
    return br


def config(m, ids, br, by='wilsonkichoi', maxadd=5, grants='none', pr='not opened'):
    text = f'''# Run config: {m}
Started: {started}. By: {by}.
- Milestone: {m}
- Scope: milestone
- Initial tickets: {', '.join('#' + str(n) for n in ids)}
- Run branch: {br}
- Run PR: {pr}
- Supersedes: none
- max_fix_attempts: 3
- max_additional_tickets: {maxadd}
- max_parallel_workers: 3
- Execution models: claude-code/sonnet/medium; claude-code/opus/medium
- Coordinator model: not used
- Headless workers: claude-code
- Planning: delegated
- New prerequisites: run
- Grants: {grants}
- Moved by the person: none
- Changes: none
'''
    ref = call(['run', 'create', '--run-branch', br, '--body-file', file(m + '-config.md', text)], m + '-run-create')['reference']
    for n in ids:
        comment(n, f'Run: {ref}\n', f'{m}-member-{n}')
    return ref


PARKED = ('needs-decision (wkc-implement): Should kv keys be sorted or in store order?\n'
          'Open because: the ticket and SPEC leave the order undecided.\n'
          'Recommendation: sorted order for stable output.\nNeeds: a person\n')
fixtures = {'repo': repo, 'fixture_main': run(['git', 'rev-parse', 'origin/main'], 'main-head.txt').strip(),
            'started': started}
run(['git', 'fetch', 'origin'], 'fetch.txt')
for m in ['login-r2', 'unchanged-r2', 'unchanged-ready-r2', 'spent-r2', 'change-r2', 'review-r2']:
    call(['milestone', 'ensure', m], m + '-milestone')
    br = branch(m)
    if m == 'login-r2':
        n = ticket(m, 'help-usage'); r = config(m, [n], br, by='wchoi42')
        fixtures[m] = {'tickets': [n], 'run': r, 'branch': br, 'old_login': 'wchoi42', 'old_held': []}
    elif m in ('unchanged-r2', 'change-r2'):
        n = ticket(m, 'keys-order'); r = config(m, [n], br)
        comment(n, PARKED, m + '-parked')
        fixtures[m] = {'tickets': [n], 'run': r, 'branch': br}
    elif m == 'unchanged-ready-r2':
        n = ticket(m, 'help-usage'); r = config(m, [n], br)
        fixtures[m] = {'tickets': [n], 'run': r, 'branch': br}
    elif m == 'spent-r2':
        n = ticket(m, 'append'); spent = ticket(m, 'retired-prerequisite', ' (retired prerequisite)')
        hb = ''.join(l for l in (tickets / 'store-helper.md').read_text().splitlines(True)
                     if not l.startswith('The driver must verify'))
        helper = call(['create', '--title', 'store: provide read_store and write_store helpers', '--body-file',
                       file(m + '-helper.md', hb), '--milestone', m], m + '-helper')['number']
        call(['link', str(n), str(helper)], m + '-link')
        r = config(m, [n], br, maxadd=1)
        comment(spent, f'Run: {r}\n', m + '-spent-run')
        comment(n, f'Decision (wkc-yolo): prior prerequisite admission\nChoice: #{spent} used slot 1 of 1 before it was canceled. No refund.\nSource: run limit\n', m + '-spent-decision')
        call(['move', str(spent), 'cancel'], m + '-cancel')
        comment(n, 'Discovered: SPEC 2.3 store helpers are missing. Out of scope because bin/lib.sh is its own component and must land before append. Blocks this ticket: yes.\nObserved: bin/lib.sh and tests/test_lib.sh do not exist at fixture main. SPEC 2.3 requires both.\nReproduce: rg --files bin tests.\nBecause: append acceptance criteria require read_store and write_store.\nVerified: yes. Unchecked: nothing.\n', m + '-discovered')
        comment(n, f'Decision (wkc-implement): Can append proceed?\nChoice: wait for prerequisite #{helper}, filed at backlog. No branch or PR exists.\nSource: ticket acceptance criteria and SPEC 2.3.\nExecution: claude-code, sonnet, effort medium\nObserved execution: unavailable\n', m + '-return')
        fixtures[m] = {'tickets': [n], 'spent': spent, 'helper': helper, 'run': r, 'branch': br}
    elif m == 'review-r2':
        n = ticket(m, 'keys-order')
        run(['git', 'checkout', '-q', br], m + '-checkout.txt')
        p = root / 'docs/usage/review-r2.md'; p.parent.mkdir(exist_ok=True)
        p.write_text('Batch R2 requested-change fixture. The keys ordering question is still open.\n')
        run(['git', 'add', 'docs/usage/review-r2.md'], m + '-add.txt')
        run(['git', 'commit', '-q', '-m', 'test: seed requested-change run PR'], m + '-commit.txt')
        run(['git', 'push', 'origin', br], m + '-seed-push.txt')
        head = run(['git', 'rev-parse', 'HEAD'], m + '-head.txt').strip()
        body = file(m + '-pr.md', f'ready: verified at {head}\n\nDriver-seeded ready run PR for requested-change resume validation. The unfinished keys ticket remains required. This marker seeds the case and is not validation evidence.\n')
        url = run(['gh', 'pr', 'create', '--repo', repo, '--base', 'main', '--head', br, '--title',
                   'Batch R2 requested changes fixture', '--body-file', body], m + '-pr-create.txt').strip()
        grant = ('Grant 1: r23. Target: disposable shared test marker. Impact: writes only '
                 '/tmp/wkc-yolo-env/r23.deployed and r23.cleaned. Operations: sh scripts/env.sh deploy r23; '
                 'sh scripts/env.sh smoke r23. Limits: 1 deploy, local only, no cost, no retries. '
                 'Cleanup: sh scripts/env.sh cleanup r23. Expires: 2026-11-12T23:59:00Z.')
        r = config(m, [n], br, grants='\n- ' + grant, pr=url)
        comment(n, PARKED, m + '-parked')
        run(['gh', 'pr', 'comment', url, '--repo', repo, '--body-file', file(m + '-request1.md',
             'Requested changes: the open kv keys ticket must state its unresolved output-order decision clearly in the test plan. Keep both order choices visible until I decide. This correction is covered by the existing unfinished keys ticket.\n')], m + '-request1.txt')
        fixtures[m] = {'tickets': [n], 'run': r, 'branch': br, 'pr': url, 'pr_head': head, 'grant1': grant}
        run(['git', 'checkout', '-q', 'main'], m + '-return-main.txt')
for m, v in fixtures.items():
    if isinstance(v, dict):
        for n in v.get('tickets', []) + [v['run']]:
            call(['run', 'show', str(v['run'])] if n == v['run'] else ['show', str(n)], f'readback-{m}-{n}')
(here / 'fixtures.json').write_text(json.dumps(fixtures, indent=2) + '\n')
print(json.dumps(fixtures, indent=2))
