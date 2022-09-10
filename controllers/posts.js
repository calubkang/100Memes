const cloudinary = require("../middleware/cloudinary");
const Comment = require("../models/Comment");
const Post = require("../models/Post");
const User = require("../models/User")

module.exports = {
  getProfile: async (req, res) => {
    try {
      const posts = await Post.find({ user: req.user.id });
      res.render("profile.ejs", { posts: posts, user: req.user });
    } catch (err) {
      console.log(err);
    }
  },
  getOtherProfile: async (req, res) => {
    try {
      const otherUser = await User.findById( req.params.id )
      const posts = await Post.find({ user: req.params.id });
      console.log(otherUser)
      res.render("otherProfile.ejs", { posts: posts, user: otherUser });
    } catch (err) {
      console.log(err);
    }
  },
  getFeed: async (req, res) => {
    try {
      const posts = await Post.find().sort({ createdAt: "desc" }).lean();
      res.render("feed.ejs", { posts: posts, user: req.user });
    } catch (err) {
      console.log(err);
    }
  },
  getPost: async (req, res) => {
    try {
  
      const post = await Post.findById(req.params.id);
      const comments = await Comment.find({ post: req.params.id })
      const postOwner = await User.findById({_id: post.user})
      console.log(post.user)
      res.render("post.ejs", { post: post, user: req.user, comments: comments, postOwner: postOwner });
    } catch (err) {
      console.log(err);
    }
  },
  createPost: async (req, res) => {
    try {
      // Upload image to cloudinary
      const result = await cloudinary.uploader.upload(req.file.path);

      await Post.create({
        title: req.body.title,
        image: result.secure_url,
        cloudinaryId: result.public_id,
        likes: 0,
        user: req.user.id,
      });
      console.log("Post has been added!");
      res.redirect("/profile");
    } catch (err) {
      console.log(err);
    }
  },
  createComment: async (req, res) => {
    try {
      
      console.log(req.user)
      await Comment.create({
        content: req.body.comment,
        post: req.params.id,
        user: req.user.userName
      });
      console.log("comment has been added!");
      res.redirect(`/post/${req.params.id}`);
    } catch (err) {
      console.log(err);
    }
  },
  likePost: async (req, res) => {
    try {
      if (!req.user.likedPosts.includes(req.params.id)){
        await Post.findOneAndUpdate(
          { _id: req.params.id },
          {
            $inc: { likes: 1 },
          }
        )
        await User.findOneAndUpdate(
          { _id: req.user.id },
          {
            $push: {likedPosts: req.params.id}
          }
        )
      } else {
        await Post.findOneAndUpdate(
          { _id: req.params.id },
          {
            $inc: { likes: -1 },
          }
        )
        await User.findOneAndUpdate(
          { _id: req.user.id },
          {
            $pull: {likedPosts: req.params.id}
          }
        )
      }
      console.log("Likes +1");
      res.redirect(`/post/${req.params.id}`);
    } catch (err) {
      console.log(err);
    }
  },
  likePostFromFeed: async (req, res) => {
    try {
      if (!req.user.likedPosts.includes(req.params.id)) {
        await Post.findOneAndUpdate(
          { _id: req.params.id },
          {
            $inc: { likes: 1 },
          }
        )
        await User.findOneAndUpdate(
          { _id: req.user.id },
          {
            $push: { likedPosts: req.params.id }
          }
        )
      } else {
        await Post.findOneAndUpdate(
          { _id: req.params.id },
          {
            $inc: { likes: -1 },
          }
        )
        await User.findOneAndUpdate(
          { _id: req.user.id },
          {
            $pull: { likedPosts: req.params.id }
          }
        )
      }
      console.log("Likes +1");
      res.redirect(`/feed#${req.params.id}`);
    } catch (err) {
      console.log(err)
      return false;
    }
  },
  deletePost: async (req, res) => {
    try {
      // Find post by id
      let post = await Post.findById({ _id: req.params.id });
      // Delete image from cloudinary
      await cloudinary.uploader.destroy(post.cloudinaryId);
      // Delete post from db
      await Post.remove({ _id: req.params.id });
      console.log("Deleted Post");
      res.redirect("/profile");
    } catch (err) {
      res.redirect("/profile");
    }
  },
};
