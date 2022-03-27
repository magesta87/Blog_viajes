var express = require("express");
var router = express.Router();
const mysql = require("mysql");
const flash = require("express-flash");
const session = require("express-session");
const fileupload = require("express-fileupload"); //para subir imagenes
var path = require("path"); //Para trabajar con extencions JPG, PNG

router.use(
  session({
    secret: "token-muy-secreto",
    resave: true,
    saveUninitialized: true,
  })
);
router.use(flash());
router.use(fileupload());
/* Conexion base de datos */
const pool = mysql.createPool({
  connectionLimit: 20,
  host: "localhost",
  user: "client",
  database: "blog_viajes",
});

/* GET home page y Funcion busqueda */
router.get("/", function (req, res, next) {
  pool.getConnection((err, connection) => {
    let modificarlConsulta = "";
    let query;
    let modificadorPagina = "";
    let pagina = 0;
    const busqueda = req.query.buscar ? req.query.buscar : ""; //Si se busca se almacena el dato
    if (busqueda != "") {
      modificarlConsulta = `
      WHERE titulo LIKE '%${busqueda}%' OR
      resumen LIKE '%${busqueda}%' OR
      contenido LIKE '%${busqueda}%'
      `;
      modificadorPagina = "";
    } else {
      pagina = req.query.pagina ? parseInt(req.query.pagina) : 0;
      if (pagina < 0) {
        pagina = 0;
      }
      modificadorPagina = `LIMIT 5 OFFSET ${pagina * 5}`;
    }

    query = `SELECT * from publicaciones inner join autores
    on publicaciones.autor_id = autores.id ${modificarlConsulta} ORDER BY fecha_hora DESC ${modificadorPagina}`;

    connection.query(query, (error, filas, campos) => {
      res.render("index", {
        publicaciones: filas,
        busqueda: busqueda,
        pagina: pagina,
      });
    });
    connection.release();
  });
});

// Link de publicaciones

router.get("/publicacion/:id", (req, res) => {
  pool.getConnection((err, connection) => {
    const query = `SELECT * FROM publicaciones inner join autores on autor_id = autores.id 
    where publicaciones.id =${connection.escape(req.params.id)}`;
    connection.query(query, (error, filas, campos) => {
      if (filas.length > 0) {
        res.render("publicacion", { publicacion: filas[0] });
      } else {
        req.flash("mensaje", "Error publicacion no encontrada");
        res.redirect("/");
      }
    });
  });
});

//Get registro
router.get("/registro", (req, res) => {
  res.render("registro", { mensaje: req.flash("mensaje") });
});
//Get inicio
router.get("/inicio", (req, res) => {
  res.render("inicio", { mensaje: req.flash("mensaje") });
});
//Get publicacion
router.get("/publicacion", (req, res) => {
  res.render("publicacion", { mensaje: req.flash("mensaje") });
});
//Get autores
router.get("/autores", (req, res) => {
  res.render("autores");
});
//POST nuevo autor
router.post("/nuevo_autor", (req, res) => {
  pool.getConnection((err, connection) => {
    const email = req.body.email.toLowerCase().trim();
    const contraseña = req.body.contraseña;
    const pseudonimo = req.body.pseudonimo.trim();

    const queryEmail = `SELECT * FROM autores WHERE email=${connection.escape(
      email
    )}`;
    connection.query(queryEmail, (error, filas, campos) => {
      if (filas.length > 0) {
        req.flash("mensaje", "Email duplicado");
        res.redirect("/registro");
      } else {
        const queryPseudonimo = `SELECT * FROM autores WHERE pseudonimo =${connection.escape(
          pseudonimo
        )}`;
        connection.query(queryPseudonimo, (error, filas, campos) => {
          if (filas.length > 0) {
            req.flash("mensaje", "El pseudonimo ya existe");
            res.redirect("/registro");
          } else {
            const queryRegistro = `INSERT INTO autores(email, contraseña, pseudonimo) VALUES(${connection.escape(
              email
            )}, ${connection.escape(contraseña)}, ${connection.escape(
              pseudonimo
            )})`;
            connection.query(queryRegistro, (error, filas, campos) => {
              if (req.files && req.files.avatar) {
                const archivoAvatar = req.files.avatar;
                const id = filas.insertId;
                const nombreAvatar = `${id}.${path.extname(
                  archivoAvatar.name
                )}`;

                archivoAvatar.mv(
                  `../public/avatar/${nombreAvatar}`,
                  (error) => {
                    const agregarAvatar = `UPDATE autores SET avatar=${connection.escape(
                      nombreAvatar
                    )} WHERE id=${connection.escape(id)}`;
                    connection.query(agregarAvatar, (error, filas, campos) => {
                      req.flash("mensaje", "Se agrego avatar");
                      res.redirect("/registro");
                    });
                  }
                );
              } else {
                req.flash("mensaje", "Usuario registrado");
                res.redirect("/registro");
              }
            });
          }
        });
      }
    });
    connection.release();
  });
});

module.exports = router;
