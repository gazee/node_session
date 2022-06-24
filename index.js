const express=require('express');
const app=express();
const session=require('express-session');
const mongoose =require('mongoose')
const connectDBSession =require('connect-mongodb-session')(session)
const path =require('path');
const userModel=require('./models/user');
const bcrypt =require('bcrypt');
const { redirect } = require('express/lib/response');

// view engine setup
app.set('views', 'views');
app.set('view engine', 'ejs');
//first view used to refer this
app.use(express.urlencoded({extended:true}));

const mongoUrl='mongodb://localhost:27017/sessions';
// "mongodb://localhost:27017/sessions";

mongoose.connect("mongodb://localhost/sessions", {
    useNewUrlParser:true ,
    useUnifiedTopology:true,
})
.then(()=>  console.log('mongodb is connected...'))
.catch((err) => console.log(err))
//allow session to save in side mongodb

const store =new connectDBSession({ 
    uri:mongoUrl,
    collection:'my Sessions',
});

app.use(
     session({
        secret:'key that will sign cookies',
        resave:false,
        saveUninitialized:false,
         store:store,
    })
);

//this midware used to whether 
const isAuth=(req,res,next)=>{
    if(req.session.isAuth){
        next()
    }else{
        res.redirect('/login');
    }
}

app.get('/',isAuth,(req,res)=>{
    // console.log(req.session);
    req.session.isAuth=true;
    // console.log(req.session.id);
     res.render('dashboard');
   
});

app.get('/register',(req,res)=>{
    
     res.render('register');
   
});



app.post('/register',async (req,res)=>{
    const {username,email,password} = req.body;
    
  let user=await userModel.findOne({email});

  if(user){
      return res.redirect('/register');
  }


  const hashpassword=await bcrypt.hash(password,12);
  user=new userModel({
    username,
    email,
    password:hashpassword
  })
  await user.save()
  res.redirect('/login')

});

app.get('/login',(req,res)=>{  
    res.render('login');
});

app.post('/login',async (req,res)=>{  
    const {email,password} =req.body;
  var user =await userModel.findOne({email})

  if(!user){
      return res.redirect('/login')
  }

  const isMatch=await bcrypt.compare(password, user.password);

  if(!isMatch){
      return res.redirect('/login')
  }
  
  req.session.isAuth=true;
  res.redirect('/')
});

app.get('/logout',(req,res)=>{
    req.session.destroy((err)=>{
        if(err) throw err;
        res.redirect('/login')
       
    })
})


app.listen(5000,console.log("server is connected"))