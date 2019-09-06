var express = require('express');
var router = express.Router();
var Campground = require('../models/campground');
var Comment = require('../models/comment');
var middleware = require('../middleware');
var NodeGeocoder = require('node-geocoder');
 
var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
 
var geocoder = NodeGeocoder(options);

//INDEX
router.get("/", function (req, res) {
	var perPage = 8;
    var pageQuery = parseInt(req.query.page);
    var pageNumber = pageQuery ? pageQuery : 1;
	if(req.query.search){
		const regex = new RegExp(escapeRegex(req.query.search), 'gi');
		Campground.find({name: regex}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function (err, allCampgrounds) {
			Campground.count().exec(function (err, count) {
				if (err || !allCampgrounds.length) {
					req.flash('error', 'No campgrounds matched your search.');
					res.redirect('back');
				} else {
					res.render("campgrounds/index", {
						campgrounds: allCampgrounds,
						current: pageNumber,
						pages: Math.ceil(count / perPage)
					});
				}
			});
		});
	}else{
		Campground.find({}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function (err, allCampgrounds) {
			Campground.count().exec(function (err, count) {
				if (err) {
					console.log(err);
				} else {
					res.render("campgrounds/index", {
						campgrounds: allCampgrounds,
						current: pageNumber,
						pages: Math.ceil(count / perPage)
					});
				}
			});
		});
	}
});

//CREATE
router.post("/", middleware.isLoggedIn, function(req, res){
	//get data from form and add to campgrounds array
	var name = req.body.name;
	var price = req.body.price;
	var image = req.body.image;
	var description = req.body.description;
	var author = {
		id: req.user._id,
		username: req.user.username
	}
	geocoder.geocode(req.body.location, function (err, data) {
    	if (err || !data.length) {
    		req.flash('error', 'Invalid address');
    		return res.redirect('back');
    	}
		var lat = data[0].latitude;
		var lng = data[0].longitude;
		var location = data[0].formattedAddress;
		var newCampground = {name: name, image: image, description: description, author:author, price:price, location: location, lat: lat, lng: lng};
		//create new campground and save to db
		Campground.create(newCampground, function(err, newlyCreated){
			if(err){
				console.log(err);
			}else{
				//redirect back to campgrounds
				req.flash("success", "Campground successfully created.");
				res.redirect("/campgrounds");
			}
		});
	});
});

//NEW
router.get('/new', middleware.isLoggedIn, function(req, res){
	res.render('campgrounds/new')
});

//SHOW
router.get('/:id', function(req, res){
	//find campground with provided id
	Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
		if(err){
 			console.log(err);
 		}else{
			//render show template with that id
			res.render('campgrounds/show', {campground: foundCampground});
		}
	});
});

//EDIT
router.get('/:id/edit', middleware.checkCampgroundOwnership, function(req, res){
	Campground.findById(req.params.id, function(err, foundCampground){
		res.render('campgrounds/edit', {campground: foundCampground});
	});
});

//UPDATE
router.put("/:id", middleware.checkCampgroundOwnership, function(req, res){
    Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, campground){
        if(err){
        	req.flash("error", err.message);
        	res.redirect("back");
    	} else {
        	req.flash("success","Successfully Updated!");
        	res.redirect("/campgrounds/" + campground._id);
    	}
	});
});

//DESTROY
router.delete('/:id', middleware.checkCampgroundOwnership, function(req, res){
	Campground.findByIdAndRemove(req.params.id, function(err, campgroundRemoved){
		if(err){
			res.redirect('/campgrounds');
		}
		Comment.deleteMany( {_id: { $in: campgroundRemoved.comments } }, function(err){
			if(err){
				console.log(err);
			}
			req.flash("success", "Campground deleted.");
			res.redirect('/campgrounds');
		});
	});
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};


module.exports = router;