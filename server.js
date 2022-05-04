//Importación de dependencias
const express = require("express");
const app = express();
const { engine } = require('express-handlebars');
const expressFileUpload = require('express-fileupload');
const jwt = require('jsonwebtoken');
const secretKey = "Shhhh"
const { getUsuarios, updateStatusUsuario, insertUsuario, updateUsuario, deleteUsuario, verUsuario } = require('./consultas');
const path = require('path')
const permitFile = ['.gif', '.png', '.jpg', '.jpeg'];
const PORT = 3000;

app.listen(PORT, () => console.log('Servidor Inicializado en puerto: ' + PORT));

//Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(__dirname + '/public'));
app.use('/css', express.static(__dirname + '/public/css'));
app.use('/bootstrap', express.static(__dirname + '/node_modules/bootstrap/dist'));
app.use('/jquery', express.static(__dirname + '/node_modules/jquery/dist'));
app.use('/axios', express.static(__dirname + '/node_modules/axios/dist'));
app.use(
    expressFileUpload({
        limits: { fileSize: 5000000 },
        abortOnLimit: true,
        responseOnLimit: "El tamaño de la imagen que intenta subir supera el limite permitido",
    })
);

app.engine('hbs',
    engine({
        defaultLayout: 'main',
        layoutsDir: __dirname + '/views/mainLayout',
        extname: '.hbs',
        helpers: {
            fixInde: function (valor) {
                return parseInt(valor) + 1;
            }
        }
    })
);

app.set('view engine', 'hbs');
app.set('views', './views/layouts');

// Creación de rutas
// Disponibiliza ruta página home
app.get('/', (req, res) => {
    res.render('index');
});

// Disponibiliza ruta para página del registro
app.get('/registro', (req, res) => {
    res.render('Registro');
});

// Disponibiliza ruta para página del inicio de sesión
app.get('/login', (req, res) => {
    res.render('Login');
});

// Disponibiliza ruta para la página de validación de usuarios
app.get('/admin', async (req, res) => {
    try {
        const usuarios = await getUsuarios();
        console.log(usuarios);
        res.render('Admin', { usuarios });
    } catch (error) {
        res.status(500).send({
            error: `Error en conseguir lista de users en admin... ${error}`,
            code: 500
        })
    }
});

// Disponibiliza ruta para mostrar array de usuarios registrados
app.get('/usuarios', async (req, res) => {
    const respuesta = await getUsuarios();
    res.status(200).send(respuesta);
});

// Disponibiliza ruta para la edición de usuarios
app.put('/usuarios', async (req, res) => {
    const { id, estado } = req.body
    try {
        const usuarios = await updateStatusUsuario(id, estado);
        res.status(200).send(JSON.stringify(usuarios));
    } catch (error) {
        res.status(500).send(`Error en edicion de usuarios...${error}`);
    }
});

// Disponibiliza ruta para la inserción de usuarios
app.post('/registrar', async (req, res) => {

    const { email, nombre, password, password2, experiencia, especialidad } = req.body;
    const { foto } = req.files;
    const { name } = foto;
    const extension = path.extname(name);

    if (password !== password2) {
        res.status(401).send('<script>alert("Las contraseñas ingresadas no coinciden."); window.location.href = "/registro"; </script>');
    } else {
        try {
            await insertUsuario(email, nombre, password, experiencia, especialidad, name)
                .then(() => {
                    if (!req.files) {
                        return res.status(400).send('No se han cargado ninguna imágen.');
                    }

                    if (!permitFile.includes(extension)) {
                        return res.status(403).send('Formato inválido.')
                    }
                    foto.mv(`${__dirname}/public/uploads/${name}`, (err) => {
                        if (err) {
                            return res.status(500).send(err);
                        }
                    });
                    res.status(200).send('<script>alert("Se ha registrado con éxito."); window.location.href = "/"; </script>');
                });

        } catch (error) {
            res.status(500).send({
                error: `Algo salió mal... ${error}`,
                code: 500
            })
        }
    }
});

// Disponibiliza ruta para la autenticar el inicio de sesión
app.post('/autenticar', async (req, res) => {
    const { email, password } = req.body;
    const user = await verUsuario(email, password)
    if (email === '' || password === '') {
        res.status(401).send('<script>alert("Debe llenar ambos campos."); window.location.href = "/login"; </script>');
    } else {

        if (user) {
            if (user.estado === true) {
                const token = jwt.sign(
                    {
                        exp: Math.floor(Date.now() / 1000) + 180,
                        data: user,
                    },
                    secretKey
                );
                res.redirect(`/Datos?token=${token}`);
            } else {
                res.status(401).send(`<script>alert("Usuario en estado revisión."); window.location.href = "/login"; localStorage.setItem('token', JSON.stringify("${token}"))</script>`)
            }
        } else {
            res.status(404).send('<script>alert("Usuario no existe o la contraseña está incorrecta."); window.location.href = "/login"; </script>');
        }
    }
});

// Disponibiliza ruta para la inserción de datos de usuarios
app.get('/datos', (req, res) => {
    let { token } = req.query;
    jwt.verify(token, secretKey, (err, skater) => {
        const { data } = skater;
        if (err) {
            res.status(401).json({
                error: "401 Unauthorized",
                message: err.message,
            });
        } else {
            console.log('Datos Skater', skater);
            res.render('Datos', data);
        }
    });
});

// Disponibiliza ruta para la renderización de datos de usuarios
app.get('/datos_usuario', async (req, res) => {
    const respuesta = await getUsuarios();
    res.send(respuesta);
});

// Disponibiliza ruta para la actualización de datos de usuarios
app.post('/actualizar', async (req, res) => {
    let { email, nombre, password, password2, experiencia, especialidad } = req.body;
    if (password !== password2) {
        res.status(401).send('<script>alert("Las contraseñas no coinciden."); window.location.href = "/Login"; </script>');
    } else {
        try {
            await updateUsuario(email, nombre, password, experiencia, especialidad);
            res.send('<script>alert("Datos actualizados con éxito."); window.location.href = "/"; </script>');
        } catch (error) {
            res.status(500).send(`Error al actualizar los datos... ${error}`)
        }
    }
});

// Disponibiliza ruta para eliminar usuarios
app.post('/eliminar', async (req, res) => {
    try {
        const { id } = req.query;
        await deleteUsuario(id);
        res.send('<script>alert("Cuenta eliminada con éxito."); window.location.href = "/"; </script>');
    } catch (error) {
        res.status(500).send(`Error al eliminar usuario... ${error}`)
    }
});

