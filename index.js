const express=require("express");
const app=express();
const mongoose=require("mongoose"); 
const path=require("path");
const chat=require("./models/chat.js");
const methodOverride=require("method-override");
const session = require("express-session");
const bcrypt = require("bcrypt");
const User = require("./models/user.js");
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.set("views",path.join(__dirname,"views"));
app.set("view engine","ejs");
app.use(express.static(path.join(__dirname,"public")));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false
}));
main()
    .then(()=>{
         console.log("connection successful");
})
    .catch(err => console.log(err)); 

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/fakewhatsapp');
}
app.use(async (req, res, next) => {
    if (req.session.userId) {
        const user = await User.findById(req.session.userId);
        req.user = user; 
        res.locals.user = user; 
    } else {
        req.user = null;
        res.locals.user = null;
    }
    next();
});
// User registration route
app.get("/register", async (req, res) => {
    res.render("register.ejs");
});
// Handle registration form submission
app.post("/register", async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    // Check if the username already exists
    const existingUser  = await User.findOne({ username });
    if (existingUser ) {
        return res.status(400).send("Username already exists. Please choose another one.");
    }
    const newUser  = new User({ username, password: hashedPassword });
    await newUser .save();
    res.redirect("/chats"); // Redirect to the login page after successful registration
});
// Serve the login form
app.get("/login", (req, res) => {
    res.render("login.ejs"); // Render the login form
});
// Handle login form submission
app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    // Find the user by username
    const user = await User.findOne({ username });
    if (!user) {
        return res.status(400).send("Invalid username or password.");
    }
    // Check if the password is correct
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(400).send("Invalid username or password.");
    }
    // Log the user in (you can set a session or token here)
    req.session.userId = user._id; // Example of setting a session
    res.redirect("/chats"); // Redirect to the chats page after successful login
});
// Logout route
app.get("/chats/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log(err);
            return res.redirect("/chats");
        }
        res.redirect("/login");
    });
});

//INDEX ROUTE
app.get("/chats",async (req,res)=>{
    let chats=await chat.find();
    //console.log(chats);
    res.render("index.ejs",{chats});
});
//NEW ROUTE 
app.get("/chats/new",(req,res)=>{
    res.render("new.ejs");
});

//CREATE ROUTE 
app.post("/chats",async (req,res,next)=>{
    let {from,to,msg}=req.body;
    let newchat=new chat({
        from:from,
        msg:msg,
        to:to,
        created_at:new Date(),
    });
    await newchat.save().then((res)=>{
        console.log("chat was saved");
    }).catch((err)=>{
        console.log(err);
    });
    res.redirect("/chats");
});

//EDIT ROUTE 
app.get("/chats/:id/edit",async (req,res)=>{
    let {id}=req.params;
    let c=await chat.findById(id);
    res.render("edit.ejs",{c});
});

//UPDATE ROUTE 
app.put("/chats/:id",async (req,res)=>{
    let {id}=req.params;
    let {msg:newmsg}=req.body;
    let updatechat= await chat.findByIdAndUpdate(id,{msg:newmsg},{runValidators:true,new:true});
    console.log(updatechat);
    res.redirect("/chats");
});

//DELETE ROUTE 
app.delete("/chats/:id",async (req,res)=>{
    let {id}=req.params;
    let del=await chat.findByIdAndDelete(id);
    console.log(del);
    res.redirect("/chats");
});

//SHOW ROUTE
app.get("/chats/:id",async (req,res)=>{
    let {id}=req.params;
    let c=await chat.findById(id);
    res.render("show.ejs",{c});
});
// Socket.IO connection
io.on("connection", (socket) => {
    console.log("a user connected");
    // Listen for chat messages
    socket.on("chat message", async (msg) => {
        let newChat = new chat({
            msg: msg,
            created_at: new Date(),
            from: "User " // Replace with actual user info
        });
        await newChat.save();
        io.emit("chat message", newChat); // Broadcast to all clients
    });
    socket.on("disconnect", () => {
        console.log("user disconnected");
    });
});
app.get("/",(req,res)=>{
    res.send("root  is working ");
});

app.listen(8080,()=>{
    console.log("server is listening to port 8080");
});