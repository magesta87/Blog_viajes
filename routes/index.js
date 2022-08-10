var express = require("express");
var router = express.Router();
const mysql = require("mysql");
const flash = require("express-flash");
const session = require("express-session");
const fileupload = require("express-fileupload"); //para subir imagenes
var path = require("path"); //Para trabajar con extencions JPG, PNG
const { Router, response } = require("express");
const { request } = require("http");
const { join } = require("path");

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
  user: "cliente",
  database: "blog_viajes",
});

// Solicitudes GET /api/v1/publicaciones //

router.get("/api/v1/publicaciones", (req, res) => {
  pool.getConnection((err, connection) => {
    const query = `SELECT * FROM publicaciones`;
    connection.query(query, (erros, filas, campos) => {
      if (filas.length > 0) {
        res.status(200).json(filas);
      } else {
        res.status(500).json({ msj: "No hay conexion con el servidor" });
      }
    });
    connection.release();
  });
});

// Solicitudes GET tomando Query /api/v1/publicaciones?busqueda=<palabra> //

router.get("/api/v1/publicaciones", (req, res) => {
  pool.getConnection((err, connection) => {
    const palabra = req.query.busqueda;
    const query = `SELECT * FROM publicaciones WHERE 
    titulo LIKE '%${palabra}%' OR 
    resumen LIKE '%${palabra}%' OR
    contenido LIKE '%${palabra}%'`;
    connection.query(query, (error, filas, campos) => {
      if (filas.length > 0) {
        res.status(200).json(filas);
      } else {
        res.status(404).json({ msj: "No hay coincidencias" });
      }
    });
    connection.release();
  });
});

// GET /api/v1/publicaciones/<id> //

router.get("/api/v1/publicaciones/:id", (req, res) => {
  pool.getConnection((err, connection) => {
    const id = req.params.id;
    const query = `SELECT * FROM publicaciones WHERE 
    id = ${id} `;
    connection.query(query, (error, filas, campos) => {
      if (filas.length == 0) {
        res.status(404).send("no se encuentra ese ID o esta vacio");
      } else {
        res.status(200).json(filas);
      }
    });
    connection.release();
  });
});

// GET /api/v1/autores //

router.get("/api/v1/autores", (req, res) => {
  pool.getConnection((err, connection) => {
    const query = `SELECT * FROM autores`;
    connection.query(query, (error, filas, campos) => {
      if (filas.length == 0) {
        res.status(500).send("no hay acceso a la base de datos");
      } else {
        res.status(200).json(filas);
      }
    });
    connection.release();
  });
});

// GET /api/v1/autores/<id> //

router.get("/api/v1/autores/:id", (req, res) => {
  pool.getConnection((err, connection) => {
    const id = req.params.id;
    const query = `SELECT * FROM autores WHERE id = ${id}`;
    connection.query(query, (error, filas, campos) => {
      if (filas.length == 0) {
        res.status(404).send("no se encuentra el id o esta vacio");
      } else {
        res.status(200).json(filas);
      }
    });
    connection.release();
  });
});
// POST /api/v1/autores //

router.post("/api/v1/autores", (req, res) => {
  pool.getConnection((err, connection) => {
    const email = req.query.email;
    const contraseña = req.query.contraseña;
    const pseudonimo = req.query.pseudonimo;
    const consultaEmail = `SELECT email FROM autores WHERE email='${email}'`;
    connection.query(consultaEmail, (error, filas, campos) => {
      if (filas.length > 0) {
        res.status(409).json({ msj: "El email ya existe" });
      } else {
        const consultaPeudonimo = `SELECT * FROM autores WHERE pseudonimo = '${pseudonimo}'`;
        connection.query(consultaPeudonimo, (error, filas, campos) => {
          if (filas.length > 0) {
            res
              .status(409)
              .json({ msj: "El pseudonimo ya existe", error: error });
          } else {
            const nuevoAutor = `INSERT INTO autores(email, contraseña, pseudonimo) VALUES('${email}', ${contraseña}, '${pseudonimo}')`;
            connection.query(nuevoAutor, (error, filas, campos) => {
              res.status(201).json({
                msj: "Nuevo autor registrado",
                email: email,
                contraseña: contraseña,
                pseudonimo: pseudonimo,
              });
            });
          }
        });
      }
    });
  });
});

// POST /api/v1/publicaciones?email=<email>&contraseña=<contraseña> //

router.post("/api/v1/publicaciones", (req, res) => {
  pool.getConnection((err, connection) => {
    const email = req.query.email;
    const contraseña = req.query.contraseña;
    const titulo = req.query.titulo;
    const resumen = req.query.resumen;
    const contenido = req.query.contenido;
    const consultaEmail = `SELECT email, id FROM autores WHERE email='${email}'`;
    connection.query(consultaEmail, (error, filas, campos) => {
      if (Object.keys(filas).length > 0) {
        const autor_id = filas[0].id;
        const consultaContraseña = `SELECT contraseña FROM autores WHERE email='${email}'`;
        connection.query(consultaContraseña, (error, filas, campos) => {
          if (filas[0].contraseña == contraseña) {
            const nuevaPublicacion = `INSERT INTO publicaciones(titulo, resumen, contenido, autor_id) VALUES('${titulo}', '${resumen}', '${contenido}', ${autor_id})`;
            connection.query(nuevaPublicacion, (error, filas, campos) => {
              res.status(201).json({
                msj: "Publicacion creada",
                autor_id: autor_id,
                titulo: titulo,
                resumen: resumen,
                contenido: contenido,
              });
            });
          } else {
            res.status(409).json({ msj: "La contraseña no es correcta", contraseña: contraseña, respuesta: filas[0].contraseña});
          }
        });
      } else {
        res.status(409).json({ msj: "El email no existe" });
      }
    });
  });
});

// DELETE /api/v1/publicaciones/:id?email=<email>&contraseña=<contraseña> //

router.delete("/api/v1/publicaciones/:id", (req, res) => {
  pool.getConnection((err, connection) => {
    const email = req.query.email;
    const id = req.params.id
    const contraseña = req.query.contraseña;
    const consultaEmail = `SELECT email, id FROM autores WHERE email='${email}'`;
    connection.query(consultaEmail, (error, filas, campos) => {
      if (Object.keys(filas).length > 0) {
        const autor_id = filas[0].id;
        const consultaContraseña = `SELECT contraseña FROM autores WHERE email='${email}'`;
        connection.query(consultaContraseña, (error, filas, campos) => {
          if (filas[0].contraseña == contraseña) {
            const consultaPublicacion = `SELECT * FROM publicaciones WHERE autor_id='${autor_id}' AND id=${id}`;
            connection.query(consultaPublicacion, (error, filas, campos)=>{
              if(Object.keys(filas).length > 0){
                const borrarPublicacion = `DELETE FROM publicaciones WHERE id = ${id} `;
                connection.query(borrarPublicacion, (error, filas, campos) => {
                  res.status(201).json({
                    msj: "Publicacion borrada",
                    publicacion_id: id,
                  });
                });
              }else{
                res.status(409).json({ msj: "El id de la publicacion no pertenece al autor"});
              }
            })
            
            
          } else {
            res.status(409).json({ msj: "La contraseña no es correcta"});
          }
        });
      } else {
        res.status(409).json({ msj: "El email no existe" });
      }
    });
  });
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
