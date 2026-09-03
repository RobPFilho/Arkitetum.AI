"""Servidor estático local sem cache — evita o clássico "editei o arquivo mas o
navegador ainda mostra a versão antiga" durante o desenvolvimento do site.
Uso: python serve.py [porta]  (padrão: 8080)
"""
import os
import sys
from http.server import SimpleHTTPRequestHandler
from socketserver import ThreadingMixIn
from http.server import HTTPServer

NOT_FOUND_PAGE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '404.html')


class NoCacheHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        # Remove os cabeçalhos condicionais para nunca responder 304 (que faria o
        # navegador continuar usando o corpo antigo já em cache).
        for h in ('If-Modified-Since', 'If-None-Match'):
            if h in self.headers:
                del self.headers[h]
        super().do_GET()

    def send_error(self, code, message=None, explain=None):
        # Página 404 com a identidade do site, em vez do erro cru do Python.
        if code == 404 and os.path.exists(NOT_FOUND_PAGE):
            with open(NOT_FOUND_PAGE, 'rb') as f:
                body = f.read()
            self.send_response(404)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        super().send_error(code, message, explain)

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
