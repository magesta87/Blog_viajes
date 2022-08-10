var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const flash = require("express-flash");
const session = require("express-session");
const fileupload = require("express-fileupload"); //para subir imagenes
var path = require("path"); //Para trabajar con extencions JPG, PNG


//Routes

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var privateRouter = require("./routes/privadas");
var middleRouter = require("./routes/middleware");

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(
  session({
    secret: "token-muy-secreto",
    resave: true,
    saveUninitialized: true,
  })
);
app.use(fileupload());
app.use(flash());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "/public")));
app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use(privateRouter);
app.use(middleRouter);

//Elementos estaticos

app.use(
  "/public/images",
  express.static(path.join(__dirname, "/public/images"))
);
app.use(
  "stylesheets",
  express.static(path.join(__dirname, "/public/stylesheets/Css"))
);
app.use(
  "stylesheets",
  express.static(path.join(__dirname, "./node_modules/bootstrap/dist/css"))
);

app.use(
  "stylesheets",
  express.static(
    path.join(__dirname, "./node_modules/bootstrap-icons/font/fonts")
  )
);
app.use(
  "javascripts",
  express.static(path.join(__dirname, "./node_modules/bootstrap/dist/js"))
);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
