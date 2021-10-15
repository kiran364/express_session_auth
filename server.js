const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require('bcryptjs');
const session = require('express-session');
const MongoDBSession = require('connect-mongodb-session')(session);

const UserModel = require('./models/userModel');
// App Config...
const app = express();                 
dotenv.config();                       
const Port = process.env.Port;

// DB Config
mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then (() => console.log("MongoDB Connected"))
.catch ((err) => console.log(err));

const store = new MongoDBSession({
    url: process.env.MONGO_URL,
    collection: "mySession",
})

// Middleware
app.use(express.json());
// session will exoires on 1 minute
app.use(session({
    secret: 'key that will sign cookie',
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie:{
        expires:60000
    }
}))

const isAuth = (req, res, next) => {
    if(req.session.isAuth){
        next()
    }else{
        res.redirect('/login')
    }
}

app.set('view engine', 'ejs');
app.use(express.urlencoded({extended:true}));

// default home page
app.get('/', (req, res) => {
    res.render('landingPage');
})

// render dashbord when user sucsessfuly login
app.get('/dashbord', isAuth, (req, res) => {
    res.render('dashbord');
})

//for rendering login page when user click on login button 
app.get('/login', (req, res) => {
    res.render('login');
})

// for login user and create a session 
app.post('/login', async (req, res) => {
    const {email, password} = req.body;

    const user = await UserModel.findOne({email});
    if(!user){
        res.redirect('/login');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch){
        res.redirect('/login');
    }

    req.session.isAuth = true;
    res.redirect("/dashbord");
})

//for rendering register page when user click on register button 
app.get('/register', (req, res) => {
    res.render('register');
})

// for creating user
app.post('/register', async (req, res)=> {
    const {username, email, password} = req.body;
    
    let user = await UserModel.findOne({email});
    if(user){
        res.render('register');
    }

    const hashPassword = await bcrypt.hash(password, 12);
    user = new UserModel({
        username,
        email,
        password: hashPassword
    })

    await user.save();
    res.redirect('/login');
})

//for logout and clossing session
app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if(err) throw err;
        res.redirect('/')
    })
})

//Port for listening
app.listen(Port, () => {
    console.log(`Server Running On Port -- ${Port}`);
})