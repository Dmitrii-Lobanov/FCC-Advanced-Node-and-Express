"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const passport = require("passport");
const localStrategy = require("passport-local");
const mongo = require("mongodb").MongoClient;
const objectID = require("mongodb").ObjectID;
const fccTesting = require("./freeCodeCamp/fcctesting.js");

const app = express();

fccTesting(app); //For FCC testing purposes
app.use("/public", express.static(process.cwd() + "/public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
	session({
		secret: process.env.SESSION_SECRET,
		resave: true,
		saveUninitialized: true
	})
);
app.use(passport.initialize());
app.use(passport.session());

mongo.connect(
	"mongodb+srv://dm:qwer@cluster0-5ox1o.mongodb.net/test?retryWrites=true&w=majority",
	{ useNewUrlParser: true },
	(error, db) => {
		if (error) {
			console.log("Database error: " + error);
		} else {
			console.log("Successful database connection");

			passport.use(
				new localStrategy((username, password, done) => {
					db.db()
						.collection("users")
						.findOne({ username: username }, (error, user) => {
							console.log("User " + username + " attempted to log in.");
							if (error) return done(error);
							if (!user) return done(null, false);
							if (password !== user.password) return done(null, false);
							return done(null, user);
						});
				})
			);

			passport.serializeUser((user, done) => {
				done(null, user._id);
			});

			passport.deserializeUser((id, done) => {
				db.db()
					.collection("users")
					.findOne({ _id: new objectID(id) }, (error, doc) => {
						done(null, doc);
					});
			});

			app.set("view engine", "pug");
			app.set("views", "./views/pug");

			app.route("/").get((req, res) => {
				res.render(process.cwd() + "/views/pug/index", {
					showLogin: true,
					title: "Home page ",
					message: "Please login"
				});
			});

			app.get("/profile", (req, res) => {
				res.render("profile");
			});

			app.post(
				"/login",
				passport.authenticate("local", { failureRedirect: "/" }, (req, res) => {
					res.redirect("/profile");
				})
			);

			app.listen(process.env.PORT || 3000, () => {
				console.log("Listening on port " + process.env.PORT);
			});
		}
	}
);
