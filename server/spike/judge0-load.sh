#!/usr/bin/env bash
# Keeps N Java submissions in flight against the local Judge0 for DURATION seconds, to reproduce grading load.
# Submits async and polls (the sync wait=true path is broken on the CodeBite image). Prints count and median/max wall time.
# Usage: judge0-load.sh [concurrency=6] [duration=120] [label]
set -u
N=${1:-6}; DUR=${2:-120}; LABEL=${3:-load}; URL=${JUDGE0_URL:-http://localhost:2358}
OUT=$(mktemp -d)
SRC='public class Main { public static void main(String[] a){ long s=0; for(int i=0;i<2000000;i++){ s+=i%7; } System.out.println(s); } }'
BODY=$(python3 -c 'import json,sys; print(json.dumps({"language_id":62,"source_code":sys.argv[1],"stdin":""}))' "$SRC")
end=$(( $(date +%s) + DUR ))
one() {
  python3 - "$URL" "$BODY" <<'PY'
import json,sys,time,urllib.request
url,body=sys.argv[1],sys.argv[2].encode()
t0=time.time()
req=urllib.request.Request(url+"/submissions?base64_encoded=false&wait=false",data=body,headers={"Content-Type":"application/json"})
tok=json.load(urllib.request.urlopen(req,timeout=30))["token"]
while True:
    d=json.load(urllib.request.urlopen(url+f"/submissions/{tok}?fields=status,time,compile_output",timeout=30))
    if d["status"]["id"]>2: break
    time.sleep(0.15)
print(f'{time.time()-t0:.3f} {d["status"]["id"]}')
PY
}
worker() { while [ "$(date +%s)" -lt "$end" ]; do one >> "$OUT/$1"; done; }
for i in $(seq 1 "$N"); do worker "$i" & done
wait
cat "$OUT"/* | python3 -c "
import sys,statistics,collections
rows=[l.split() for l in sys.stdin if l.strip()]; xs=sorted(float(r[0]) for r in rows); st=collections.Counter(r[1] for r in rows)
print(f'JUDGE0 $LABEL: n={len(xs)} median={statistics.median(xs):.2f}s p90={xs[int(len(xs)*0.9)-1]:.2f}s max={xs[-1]:.2f}s statuses={dict(st)}')"
rm -rf "$OUT"
