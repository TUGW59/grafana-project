"""Yerel WebSocket RFC6455 smoke: harita adaylarının tamamı ve resume."""
import base64, hashlib, json, os, socket, struct, sys
from urllib.parse import urlencode

snapshot = json.load(open(sys.argv[1], encoding='utf-8'))
ids = [o['id'] for o in sorted(snapshot['observations'], key=lambda o: (o['observedAt'] or '', o['id']))]
assert ids and len(ids) <= 200

def connect(selected, offset=0, origin='http://127.0.0.1:3400', status=101):
    sock = socket.create_connection(('127.0.0.1', 18183), timeout=8)
    try:
        key = base64.b64encode(os.urandom(16)).decode()
        query = urlencode([('id', i) for i in selected] + [('offset', offset)])
        sock.sendall((f'GET /v1/replay?{query} HTTP/1.1\r\nHost: 127.0.0.1:18183\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: {key}\r\nSec-WebSocket-Version: 13\r\nOrigin: {origin}\r\n\r\n').encode())
        f = sock.makefile('rb')
        line = f.readline().decode(); assert int(line.split()[1]) == status, line
        headers = {}
        while True:
            line = f.readline().decode()
            if line in ('\r\n', ''): break
            k, v = line.split(':', 1); headers[k.lower()] = v.strip()
        if status == 101:
            expected = base64.b64encode(hashlib.sha1((key+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').encode()).digest()).decode()
            assert headers.get('sec-websocket-accept') == expected
        return sock, f
    except BaseException:
        sock.close(); raise

def read_exact(f, n):
    data = f.read(n); assert len(data) == n; return data

def verify(selected, expected, offset=0):
    sock, f = connect(selected, offset)
    try:
        for index, wanted in enumerate(expected[offset:], offset + 1):
            a, b = read_exact(f, 2); assert a == 0x81 and not b & 0x80
            n = b & 127
            if n == 126: n = struct.unpack('!H', read_exact(f, 2))[0]
            elif n == 127: n = struct.unpack('!Q', read_exact(f, 8))[0]
            assert n < 4096
            event = json.loads(read_exact(f, n))
            assert event == {'type':'observation','id':wanted,'sequence':index,'total':len(expected)}
        a,b = read_exact(f,2); assert a == 0x81 and b < 126
        assert json.loads(read_exact(f,b)) == {'type':'complete','total':len(expected)}
    finally: f.close(); sock.close()

verify(list(reversed(ids)), ids)
print(f'[OK] WebSocket historical replay: {len(ids)} unique ordered events + complete')
verify(ids[:2], ids[:2], 1)
print('[OK] Filtered selection and resume offset')
for selected, origin, status in [(ids[:1], 'http://localhost:3300', 403), (['unknown-test-id'], 'http://localhost:3400', 400)]:
    sock, f = connect(selected, origin=origin, status=status); f.close(); sock.close()
print('[OK] Invalid origin and unknown ID rejected')
