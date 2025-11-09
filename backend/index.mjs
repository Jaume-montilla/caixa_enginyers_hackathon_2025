import mariadb from "mariadb";
import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

// Habilitar CORS y leer body
app.use(cors());
app.use(express.json()); 

// Crear credenciales de conexión a mariadb
const pool = mariadb.createPool({
	host: "db",
	user: "caixa",
	password: "caixa",
	database: "caixa_enginyers",
	connectionLimit: 5,
	allowPublicKeyRetrieval: true,
	ssl: false,
});

// Función para obtener datos de la tabla municipio
async function getMunicipio() {
  let conn;
  try {
    conn = await pool.getConnection();
    console.log("Conectado a MariaDB!");

    const rows = await conn.query("SELECT * FROM municipio");

    const minMaxValues = {};
    const allData = [...rows];

    if (rows.length > 0) {
      const columns = Object.keys(rows[0]);

      columns.forEach((col) => {
        const columnValues = rows.map((row) => row[col]);

        const numericValues = columnValues.filter((value) => !isNaN(value));

        if (numericValues.length > 0) {
          const min = Math.min(...numericValues);
          const max = Math.max(...numericValues);
          minMaxValues[col] = { min, max };
        }
      });
    }

    return [minMaxValues, allData];
  } catch (err) {
    console.error("Error de conexión:", err);
    return [[], []]; 
  } finally {
    if (conn) conn.release();
  }
}


// Endpoint para obtener datos de la tabla municipio
app.get("/municipio", async (req, res) => {
  try {
    const [minMaxValues, municipioData] = await getMunicipio();

    res.json({
      minMaxValues,
      municipioData
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).send("Error al obtener datos de la base de datos");
  }
});


// Ruta PUT para manejar la solicitud al chatbot
app.put("/chat", async (req, res) => {
	try {
		const prompt = req.body?.messages?.[0]?.content; // Obtener el prompt desde el cuerpo de la solicitud

		if (!prompt) {
			return res.status(400).send("No se proporcionó un mensaje en el cuerpo de la solicitud.");
		}
		const chatResponse = await createChatbot(prompt);
		res.json({ response: chatResponse });
	} catch (err) {
		console.error("Error:", err);
		res.status(500).send("Error al procesar la solicitud");
	}
});

const API_KEY = "zpka_ad9538b8b6384eac8b5ecfce5efe559b_7b8e688a";
const API_URL = "https://api.publicai.co/v1/chat/completions";

// Función para interactuar con el API del chatbot
async function createChatbot(prompt) {
	try {
		const response = await fetch(API_URL, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${API_KEY}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				model: "BSC-LT/salamandra-7b-instruct-tools-16k",
				messages: [
					{ role: "user", content: prompt },
				],
				max_tokens: 500,
			}),
		});

		if (response.ok) {
			const data = await response.json();
			console.log("Respuesta correcta:", data.choices[0].message.content);
			return data.choices[0].message.content; 
		} else {
			const message = await response.text();
			console.error("Error en la solicitud:", response.statusText, message);
			throw new Error("Error al interactuar con el API del chatbot.");
		}
	} catch (error) {
		console.error("Error al intentar crear el chatbot:", error);
		throw error; 
	}
}

// Iniciar el servidor en el puerto 3001
const port = 3001;
app.listen(port, () => {
	console.log(`Servidor corriendo en http://localhost:${port}`);
});

