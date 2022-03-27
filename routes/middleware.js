var express = require("express");
var router = express.Router();
const mysql = require("mysql");
const flash = require("express-flash");
const session = require("express-session");

router.use(
  session({
    secret: "token-muy-secreto",
    resave: true,
    saveUninitialized: true,
  })
);
router.use(flash());

/* Conexion base de datos */
const pool = mysql.createPool({
  connectionLimit: 20,
  host: "localhost",
  user: "client",
  database: "blog_viajes",
});

router.use("/admin/", (req, res, next) => {
  if (!req.session.usuario) {
    req.flash("mensaje", "Debe iniciar sesión");
    res.redirect("/index");
  } else {
    next();
  }
});

module.exports = router;
