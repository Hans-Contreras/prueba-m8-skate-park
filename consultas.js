const { Pool } = require('pg');
const pool = new Pool({

// Conexión DB    
    user: 'postgres',
    host: 'localhost',
    password: 'postgresql',
    database: 'skatepark',
    port: 5432,
    //max: 20,
    //min: 5,
    //iddleTimeoutMillis: 15000,
    //connectionTimeoutMillis: 2000
});

// Funciones que comandan la DB
// Mostrar usuarios
const getUsuarios = async () => {
    const consulta = {
        text: 'SELECT id, foto, nombre, anos_experiencia, especialidad, estado FROM skater ORDER BY id',
        values: []
    }
    try {
        const result = await pool.query(consulta);
        return result.rows;
    } catch (error) {
        return error;
    }
};

//Insertar usuarios
const insertUsuario = async (email, nombre, password, experiencia, especialidad, foto) => {
    const consulta = {
        text: 'INSERT INTO skater (email, nombre, password, anos_experiencia, especialidad, foto, estado) VALUES ($1, $2, $3, $4, $5, $6, false) RETURNING *',
        values: [email, nombre, password, experiencia, especialidad, foto]
    }
    try {
        const result = await pool.query(consulta);
        return result.rows[0];
    } catch (error) {
        console.log(error)
    }
};

//Mofifica datos de usuarios
const updateUsuario = async (email, nombre, password, experiencia, especialidad) => {
    const consulta = {
        text: 'UPDATE skater SET nombre = $2, password = $3, anos_experiencia = $4, especialidad = $5 WHERE email = $1',
        values: [email, nombre, password, experiencia, especialidad]
    }
    try {
        const result = await pool.query(consulta);
        return result.rowCount;
    } catch (error) {
        console.log(error)
    }
};

//Modifica estado de usuarios
const updateStatusUsuario = async (id, estado) => {
    const consulta = {
        text: "UPDATE skater SET estado=$2 WHERE id=$1 RETURNING *",
        values: [id, estado]
    }
    try {
        const result = await pool.query(consulta);
        return result.rows[0];
    } catch (error) {
        console.log(error)
    }
};

//Elimina usuarios
const deleteUsuario = async (id) => {
    const consulta = {
        text: 'DELETE FROM skater WHERE id = $1',
        values: [id]
    }
    try {
        const result = await pool.query(consulta);
        return result.rowCount;
    } catch (e) {
        return e;
    }
}

//Consulta de usarios
const verUsuario = async (email, password) => {
    const consulta = {
        text: 'SELECT id, email, nombre, password, anos_experiencia, especialidad, foto, estado FROM skater WHERE email=$1 AND password=$2',
        values: [email, password]
    }
    try {
        const result = await pool.query(consulta);
        return result.rows[0];
    } catch (error) {
        console.log(error)
    }
};


module.exports = { getUsuarios, insertUsuario, updateUsuario, updateStatusUsuario, deleteUsuario, verUsuario };