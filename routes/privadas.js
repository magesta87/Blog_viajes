var express = require("express");
var router = express.Router();
const mysql = require("mysql");
const flash = require("express-flash");
const session = require("express-session");
const fileUpload = require("express-fileupload");
const path = require("path");

router.use(
  session({
    secret: "token-muy-secreto",
    resave: true,
    saveUninitialized: true,
  })
);
router.use(flash());
router.use(fileUpload());

/* Conexion base de datos */
const pool = mysql.createPool({
  connectionLimit: 20,
  host: "localhost",
  user: "cliente",
  database: "blog_viajes",
});

//Obtengo usuario de bsd
router.post("/admin/index", (req, res) => {
  pool.getConnection((err, connection) => {
    const user = req.body.user.toLowerCase().trim();
    const pass = req.body.pass;
    const query = `SELECT email, pseudonimo, id, contraseña, avatar FROM autores WHERE email=${connection.escape(
      user
    )} AND contraseña=${connection.escape(pass)}`;
    connection.query(query, (error, filas, campos) => {
      if (filas.length > 0) {
        req.session.usuario = filas[0];
        res.redirect("/admin/index");
      } else {
        req.flash("mensaje", "Datos inválidos");
        res.redirect("/inicio");
      }
    });
    connection.release();
  });
});

//Home Admin
router.get("/admin/index", (req, res) => {
  pool.getConnection((err, connection) => {
    const query = `SELECT * FROM publicaciones where autor_id =${connection.escape(
      req.session.usuario.id
    )}`;
    connection.query(query, (error, filas, campos) => {
      res.render("admin/admin", {
        publicaciones: filas,
        mensaje: req.flash("mensaje"),
        usuario: req.session.usuario,
      });
    });
    connection.release();
  });
});

//Get Agregar publicacion
router.get("/admin/agregar", (req, res) => {
  res.render("admin/agregar", {
    usuario: req.session.usuario,
    mensaje: req.flash("mensaje"),
  });
});

//Get editUser
router.get("/admin/editUser", (req, res) => {
  res.render("admin/editUser", {
    usuario: req.session.usuario,
    mensaje: req.flash("mensaje"),
  });
});

//POST editUser
router.post("/admin/modificar_autor", (req, res) => {
  pool.getConnection((err, connection) => {
    const email = req.body.email.toLowerCase().trim();
    const contraseña = req.body.contraseña;
    const pseudonimo = req.body.pseudonimo.trim();

    const query = `UPDATE autores SET email=${connection.escape(
      email
    )}, contraseña = ${connection.escape(
      contraseña
    )}, pseudonimo = ${connection.escape(pseudonimo)} WHERE id=${
      req.session.usuario.id
    }`;
    connection.query(query, (error, filas, campos) => {
      if (req.files && req.files.avatar) {
        const archivoAvatar = req.files.avatar;
        const nombreAvatar = `${connection.escape(
          req.session.usuario.id
        )}.${path.extname(archivoAvatar.name)}`;

        archivoAvatar.mv(`../public/avatar/${nombreAvatar}`, (error) => {
          const agregarAvatar = `UPDATE autores SET avatar=${connection.escape(
            nombreAvatar
          )} WHERE id=${connection.escape(req.session.usuario.id)}`;
          connection.query(agregarAvatar, (error, filas, campos) => {
            req.flash("mensaje", "Se agrego avatar");
            res.redirect("index");
          });
        });
      } else {
        req.flash("mensaje", "Usuario actualizado sin avatar");
        res.redirect("index");
      }
    });
    connection.release();
  });
});

//Agregar nueva publicacion a BSD
router.post("/admin/procesar_agregar", (req, res) => {
  pool.getConnection((err, connection) => {
    const date = new Date();
    const fecha = `${date.getFullYear()}-${
      date.getMonth() + 1
    }-${date.getDate()}`;
    const query = `INSERT INTO publicaciones (titulo, resumen, contenido, fecha_hora, autor_id) VALUES(${connection.escape(
      req.body.titulo
    )}, ${connection.escape(req.body.resumen)}, ${connection.escape(
      req.body.contenido
    )}, ${connection.escape(fecha)}, ${connection.escape(
      req.session.usuario.id
    )})`;

    connection.query(query, (error, filas, campos) => {
      req.flash("mensaje", "Publicacion creada");
      res.redirect("/admin/index");
    });
    connection.release();
  });
});

//GET publicacion
router.get("/admin/editar/:id", (req, res) => {
  pool.getConnection((err, connection) => {
    const query = `SELECT * FROM publicaciones WHERE id=${connection.escape(
      req.params.id
    )} AND autor_id=${connection.escape(req.session.usuario.id)}`;
    connection.query(query, (error, filas, campos) => {
      if (filas.length > 0) {
        res.render("admin/editar", {
          publicacion: filas[0],
          mensaje: req.flash("mensaje"),
          usuario: req.session.usuario,
        });
      } else {
        req.flash("mensaje", "Operacion no permitida");
        res.redirect("/admin/index");
      }
    });
    connection.release();
  });
});

//POST editar publicacion
router.post("/admin/procesar_editar", (req, res) => {
  pool.getConnection((err, connection) => {
    const query = `UPDATE publicaciones SET titulo = ${connection.escape(
      req.body.titulo
    )}, resumen = ${connection.escape(
      req.body.resumen
    )}, contenido = ${connection.escape(
      req.body.contenido
    )} WHERE id = ${connection.escape(
      req.body.id
    )} AND autor_id=${connection.escape(req.session.usuario.id)}`;
    connection.query(query, (error, filas, campos) => {
      if (filas && filas.changedRows > 0) {
        req.flash("mensaje", "Publicación editada");
      } else {
        req.flash("mensaje", "Publicación no editada");
      }
      res.redirect("/admin/index");
    });
    connection.release();
  });
});

//GET Borrar publicacion
router.get("/admin/borrar/:id", (req, res) => {
  pool.getConnection((err, connection) => {
    const query = `DELETE from publicaciones WHERE id = ${connection.escape(
      req.params.id
    )} AND autor_id = ${connection.escape(req.session.usuario.id)}`;

    connection.query(query, (error, filas, campos) => {
      if (filas && filas.affectedRows > 0) {
        req.flash("mensaje", "Publicación eliminada");
      } else {
        req.flash("mensaje", "Operación no permitida");
      }
      res.redirect("/admin/index");
    });
    connection.release();
  });
});

//Cerrar sesion
router.get("/cerrar_session", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

module.exports = router;
