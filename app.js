const express = require('express');
const mysql = require("mysql")
const dotenv = require('dotenv')
const path = require("path")
const bcrypt = require("bcryptjs");
const async = require('hbs/lib/async');


const app = express();

dotenv.config({ path: './.env'})

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
})

const publicDir = path.join(__dirname, './public')
app.use(express.static(publicDir))
app.use(express.urlencoded({extended: 'false'}))
app.use(express.json())
app.set('view engine', 'hbs')

db.connect((error) => {
    if(error) {
        console.log(error)
    } else {
        console.log("Conectado a MySQL!")
    }
})

app.get("/", (req, res) => {
    res.render("index")
})

app.get("/register", (req, res) => {
    res.render("register")
})

app.get("/login", (req, res) => {
    res.render("login")
})

app.post("/auth/login", (req, res)=>{
    const { name, email, password, password_confirm } = req.body
    db.query('SELECT * FROM users WHERE name = ?', [name], async(error, result)=>{
        if (error){
            console.log(error)
        }
        if (result.length > 0){
             const comparison = await bcrypt.compare(password, result[0].password)
			 if  (comparison){
                res.redirect('/');
			 } else {
				 return res.render('login',{
                        message: 'La Contraseña es Incorrecta!'
                    })
			 }
             
        } else {
            return res.render('login',{
                message: 'El Usuario No esta Resgistrado!'
            })
        }
    })

})


app.post("/auth/register", (req, res) => {    
    const { name, email, password, password_confirm } = req.body

    db.query('SELECT email FROM users WHERE email = ?', [email], async (error, result) => {
        if(error){
            console.log(error)
        }

        if( result.length > 0 ) {
            return res.render('register', {
                message: 'Este e-mail ya fué Registrado'
            })
        } else if(password !== password_confirm) {
            return res.render('register', {
                message: 'Los Passwords No Concuerdan!'
            })
        }

        let hashedPassword = await bcrypt.hash(password, 8)

        console.log(hashedPassword)
       
        db.query('INSERT INTO users SET?', {name: name, email: email, password: hashedPassword}, (err, result) => {
            if(error) {
                console.log(error)
            } else {
                return res.render('register', {
                    message: 'Usuario Registrado!'
                })
            }
        })        
    })
})

app.listen(5000, ()=> {
    console.log("Servidor Iniciado en el Puerto [5000]")
})
