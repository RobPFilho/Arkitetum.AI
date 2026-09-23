"""Servidor estático local sem cache — evita o clássico "editei o arquivo mas o
navegador ainda mostra a versão antiga" durante o desenvolvimento do site.
Uso: python serve.py [porta]  (padrão: 8080)
"""
import sys
from http.server import SimpleHTTPRequestHandler
from socketserver import ThreadingMixIn
from http.server import HTTPServer


class NoCacheHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        # Remove os cabeçalhos condicionais para nunca responder 304 (que faria o
        # navegador continuar usando o corpo antigo já em cache).
        for h in ('If-Modified-Since', 'If-None-Match'):
            if h in self.headers:
                del self.headers[h]
        super().do_GET()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()


class ThreadingHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    server = ThreadingHTTPServer(('', port), NoCacheHandler)
    print(f'Servindo em http://localhost:{port} (sem cache)')
    server.serve_forever()
