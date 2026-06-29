const oracledb = require('oracledb');
const path = require('path'); // Илүү дутуу зам заахад хэрэгтэй тул заавал нэмээрэй
require('dotenv').config();

// 1. ЗӨВХӨН ЭНЭ ХЭСГИЙГ ФАЙЛЫНХАА ЭХЭНД ШИНЭЭР НЭМЖ ӨГНӨ
try {
  // .dmg-ээс хуулж тавьсан хавтасны нэр чинь 'instantclient_23_26' мөн эсэхийг шалгаарай
  oracledb.initOracleClient({ libDir: path.join(__dirname, 'instantclient_23_26') }); 
  console.log('ℹ️ Oracle Client initialized in Thick mode');
} catch (err) {
  console.error('❌ Oracle Client initialization failed:', err.message);
}

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.autoCommit = true;

const dbConfig = {
  user: process.env.DB_USER || 'axis_social',
  password: process.env.DB_PASSWORD || 'axis_social',
  connectString: process.env.DB_HOST 
    ? `${process.env.DB_HOST}:${process.env.DB_PORT || 1521}/${process.env.DB_SERVICE || 'ORCL'}`
    : '192.168.5.132:1521/ORCL'
};

let pool;

async function initPool() {
  try {
    const net = require('net');
    if (net.setDefaultAutoSelectFamily) {
      net.setDefaultAutoSelectFamily(false);
    }

    pool = await oracledb.createPool({
      ...dbConfig,
      poolMin: 2,
      poolMax: 10,
      poolIncrement: 1
    });
    console.log('✅ Oracle DB pool created');
  } catch (err) {
    console.error('❌ Oracle DB pool error:', err.message);
    throw err;
  }
}

async function getConnection() {
  if (!pool) await initPool();
  return await pool.getConnection();
}

async function executeQuery(sql, binds = [], opts = {}) {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(sql, binds, { outFormat: oracledb.OUT_FORMAT_OBJECT, ...opts });
    return result;
  } finally {
    if (conn) await conn.close();
  }
}

module.exports = { initPool, getConnection, executeQuery };