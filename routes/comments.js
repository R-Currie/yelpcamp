var express = require('express');
var router = express.Router({mergeParams: true});
var Campground = require('../models/campground');
var Comment = require('../models/comment');
var middleware = require('../middleware');

//comments new
router.get("/new", middleware.isLoggedIn, function(req, res){
	Campground.findById(req.params.id, function(err, foundCampground){
		if(err){
			req.flash("error", "Campground does not exist.");
			res.redirect('back');
		}else{
			res.render('comments/new', {campground: foundCampground});
		}
	});
});

//comments create
router.post('/', middleware.isLoggedIn, function(req, res){
	//lookup campground with id
	Campground.findById(req.params.id, function(err, foundCampground){
		if(err){
			console.log(err)
		}else{
			//create new comment
			Comment.create(req.body.comment, function(err, comment){
				if(err){
					console.log(err);
				}else{
					//add username and id to comment
					comment.author.id = req.user._id;
					comment.author.username = req.user.username;
					comment.save();
					//connect new comment to campground
					foundCampground.comments.push(comment);
					foundCampground.save();
					//redirect to show page
					req.flash("success", "Comment created.");
					res.redirect('/campgrounds/' + foundCampground._id);
				}
			});
		}
	});
});

//comments edit
router.get('/:comment_id/edit', middleware.checkCommentOwnership, function(req, res){
	Comment.findById(req.params.comment_id, function(err, foundComment){
		if(err){
			res.redirect('back');
		}else{
				res.render("comments/edit", {campground_id: req.params.id, comment: foundComment});
		}
	})
});

//comments update
router.put('/:comment_id', middleware.checkCommentOwnership, function(req, res){
	Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment){
		if(err){
			res.redirect('back');
		}else{
			res.redirect('/campgrounds/' + req.params.id);
		}
	});
});

//comments destroy
router.delete('/:comment_id', middleware.checkCommentOwnership, function(req, res){
	Comment.findByIdAndRemove(req.params.comment_id, function(err){
		if(err){
			res.redirect('back');
		}else{
			req.flash("success", "Comment deleted.");
			res.redirect('/campgrounds/' + req.params.id);
		}
	});
});


module.exports = router;