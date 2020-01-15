require("dotenv").config();

var express = require("express"),
  app = express(),
  bodyParser = require("body-parser"),
  mongoose = require("mongoose"),
  passport = require("passport"),
  methodOverride = require("method-override"),
  localStrategy = require("passport-local"),
  User = require("./models/user"),
  Campground = require("./models/campground"),
  Comment = require("./models/comment"),
  flash = require("connect-flash"),
  seedDB = require("./seeds"),
  favicon = require("serve-favicon"),
  path = require("path");

app.use(favicon(path.join(__dirname, "public", "images", "favicon.ico")));

var commentRoutes = require("./routes/comments"),
  campgroundRoutes = require("./routes/campgrounds"),
  indexRoutes = require("./routes/index");

//connect to db
mongoose.connect(
  "mongodb+srv://rcurrie:budbud403@cluster0-swpxe.mongodb.net/test?retryWrites=true&w=majority",
  { useNewUrlParser: true }
);

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
//Serve the public directory
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());
app.locals.moment = require("moment");

//seed the database
// seedDB();

//Passport configuration
app.use(
  require("express-session")({
    secret: "Bella is a wiener",
    resave: false,
    saveUninitialized: false
  })
);

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next) {
  res.locals.currentUser = req.user;
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");
  next();
});

//Linking to the route files
app.use(indexRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);
app.use("/campgrounds", campgroundRoutes);

//Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Our app is running on port ${PORT}`);
});
