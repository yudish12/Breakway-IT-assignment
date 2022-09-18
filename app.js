//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const findOrCreate = require('mongoose-findorcreate');
const port = process.env.PORT || 3000;
const dotenv = require('dotenv')
dotenv.config();

const app = express();

const connection_URL = process.env.CONNECTION_URL;

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


mongoose.connect(connection_URL, {useNewUrlParser: true,useUnifiedTopology: true}).then(()=>{
  console.log("db connected");
});
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema ({
  email: String,
  password: String,
  googleId: String,
});

const ItemSchema = new mongoose.Schema({
  name:String,
  price:Number,
  category:String,
  creator:mongoose.Schema.Types.ObjectId
})

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const Item = new mongoose.model('Item',ItemSchema);
const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});



app.get("/", function(req, res){
  res.render("home");
});

app.get("/login", function(req, res){
  res.render("login");
});

app.get("/register", function(req, res){
  res.render("register");
});

app.get("/items",(req,res)=>{
  if(!req.isAuthenticated()){
    res.redirect('/login');
  }
  
  else{
    Item.find({creator:req.user._id},(err,ItemsFound)=>{
      if(err){
        res.json({error:err})
      }else{
        if(ItemsFound){
          res.render("items",{Items:ItemsFound})
        }
      }
    })
  }
})

app.get("/items/:category/:price",(req,res)=>{
  if(!req.isAuthenticated()){
    res.redirect('/login');
  }
  
  else{
    const {price,category}= req.params;
    if(category!="undefined"){
      if(price!="undefined"){
        Item.find({creator:req.user._id,price: { $lte: price},category:category},(err,ItemsFound)=>{
          if(err){
            res.json({error:err})
          }else{
            console.log("x",category)
            if(ItemsFound){
              console.log(ItemsFound)
              res.json({ItemsFound})
            }
          }
        })
      }else{
        Item.find({creator:req.user._id,category:category},(err,ItemsFound)=>{
          if(err){
            res.json({error:err})
          }else{
            console.log("x",category)
            if(ItemsFound){
              console.log(ItemsFound)
              res.json({ItemsFound})
            }
          }
        })
      }
    }
    else{
      if(price!="undefined"){
        Item.find({creator:req.user._id,price: { $lte: price}},(err,ItemsFound)=>{
          if(err){
            res.json({error:err})
          }else{
            console.log("x",category)
            if(ItemsFound){
              console.log(ItemsFound)
              res.json({ItemsFound})
            }
          }
        })
      }else{
        Item.find({creator:req.user._id},(err,ItemsFound)=>{
          if(err){
            res.json({error:err})
          }else{
            console.log("x",category)
            if(ItemsFound){
              console.log(ItemsFound)
              res.json({ItemsFound})
            }
          }
        })
      }
    }
  }
})

app.get('/submit',function(req,res){
  if(req.isAuthenticated()){
    res.render("submit")
  }else{
    res.redirect("/login")
  }
});

app.post("/submit",(req,res)=>{
  console.log(req.body);
  const name = req.body.name;
  const price = req.body.price;
  const item = new Item({name:req.body.name,price:req.body.price,category:req.body.category,creator:req.user.id});
  item.save()
  res.redirect('/items')
})

app.get("/logout", function(req, res){
  req.logout();
  res.redirect("/");
});

app.post("/register", function(req, res){

  User.register({username: req.body.username}, req.body.password, function(err, user){
    if (err) {
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/items");
      });
    }
  });

});

app.post("/login", function(req, res){

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err){
    if (err) {
      res.json({error:err});
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/items");
      });
    }
  });

});

app.delete('/delete/:id',(req,res)=>{
  if(!req.isAuthenticated()){
    res.redirect('/login');
  }
  const {id} = req.params
  Item.findByIdAndDelete(id).then(()=>{
      res.json({message:"Deleted Successfully"})
  }).catch((e)=>{
    console.log(e)
  })
})




app.listen(port, function() {
  console.log("Server started");
});
