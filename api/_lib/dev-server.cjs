// Middleware de desenvolvimento que reproduz as Vercel Functions localmente.
// Em vez de reimplementar a logica, adapta o req/res cru do Node para o formato
// estilo Vercel e despacha para os MESMOS handlers usados em producao — garantindo
// paridade total entre dev/E2E e producao.

const { parse: parseUrl } = require('node:url');
const { hasFirebaseConfig } = require('./firebase-rest.cjs');

const handlers = {
  '/api/health': require('../health.js'),
  '/api/runtime-config': require('../runtime-config.js'),
  '/api/auth/challenge': require('../auth/challenge.js'),
  '/api/auth/status': require('../auth/status.js'),
  '/api/auth/initial-setup': require('../auth/initial-setup.js'),
  '/api/auth': require('../auth.js'),
  '/api/pedidos': require('../pedidos.js'),
  '/api/comprovante': require('../comprovante.js'),
  '/api/meus-pedidos': require('../meus-pedidos.js'),
  '/api/config': require('../config.js'),
  '/api/admin': require('../admin.js'),
};

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    req.on('end', () => {
      if (chunks.length === 0) return resolve(null);
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        resolve(null);
      }
    });
    req.on('error', () => resolve(null));
  });
}

function makeRes(nodeRes) {
  return {
    statusCode: 200,
    setHeader: (key, value) => nodeRes.setHeader(key, value),
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      nodeRes.statusCode = this.statusCode;
      nodeRes.setHeader('Content-Type', 'application/json; charset=utf-8');
      nodeRes.end(JSON.stringify(payload));
      return this;
    },
    end(data) {
      nodeRes.statusCode = this.statusCode;
      nodeRes.end(data);
      return this;
    },
  };
}

function createDevApiMiddleware() {
  if (hasFirebaseConfig()) {
    console.log('[ejc-cam-dev-api] Firebase remoto ativo — escritas vao para camisetas/ no banco real.');
    if (!process.env.FIREBASE_DATABASE_SECRET) {
      console.warn('[ejc-cam-dev-api] FIREBASE_DATABASE_SECRET ausente — escritas podem falhar nas rules.');
    }
  } else {
    console.warn(
      '[ejc-cam-dev-api] Modo memoria local — preencha FIREBASE_* no .env para usar o banco real.',
    );
  }

  return async function devApiMiddleware(req, res, next) {
    const url = parseUrl(req.url || '', true);
    const pathname = url.pathname || '';
    if (!pathname.startsWith('/api/')) return next();

    const handler = handlers[pathname];
    if (!handler) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'not_found' }));
      return;
    }

    try {
      const body = req.method === 'GET' || req.method === 'HEAD' ? null : await readBody(req);
      const adaptedReq = {
        method: req.method,
        headers: req.headers,
        query: url.query || {},
        body,
      };
      await handler(adaptedReq, makeRes(res));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'internal_error';
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'internal_error', detail: message }));
    }
  };
}

module.exports = { createDevApiMiddleware, hasFirebaseConfig };
