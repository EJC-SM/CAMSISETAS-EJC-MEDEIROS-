const { dbGet, dbSet } = require('./firebase-rest.cjs');

// O armazenamento (memoria vs Firebase) e decidido em firebase-rest.cjs.

async function getAuthState() {
  return (await dbGet('auth')) || {};
}

async function saveAuthState(auth) {
  await dbSet('auth', auth);
}

async function getConfigState() {
  return (await dbGet('config')) || {};
}

async function saveConfigState(cfg) {
  await dbSet('config', cfg);
}

module.exports = {
  getAuthState,
  saveAuthState,
  getConfigState,
  saveConfigState,
};
