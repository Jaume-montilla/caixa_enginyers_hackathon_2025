import mariadb from 'mariadb';
import http from 'http';

const pool = mariadb.createPool({
  host: 'localhost',
  user: 'caixa',
  password: 'caixa',
  database: 'caixa_enginyers',
  connectionLimit: 5
});

async function testConnection() {
  let conn;
  try {
    conn = await pool.getConnection();
    console.log("Connected to MariaDB!");

    const rows = await conn.query("SELECT * from municipio");
    return(rows);
  } catch (err) {
    console.error("Connection error:", err);
  } finally {
    if (conn) conn.release();
  }
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/municipio') {
    try {
      const municipioData = await testConnection();
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(municipioData));  
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error fetching data from the database');
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

const port = 3000;
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

