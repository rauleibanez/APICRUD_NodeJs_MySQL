/********************************************
 * PAGINA WEB DE REGISTRO DE CLIENTES PARA
 * UNA PANADERIA
 * 
 *  Requerimientos:
 *  npm i express mysql dotenv hbs bcryptjs
 *  npm install express-session --save
 *  para iniciar:  npm start
 * 
 *  + Express.js: Para crear APIS, rutas y
 *    configuracion del Backend.
 *  + Espress-Session: Para crear las auto-
 *    rizaciones de las sesiones de usuarios. 
 *  + MySQL: Para connectarse al servidor de 
 *    Base de datos MySQL.
 *  + dotenv: Para Iniciar Variables de Entorno
 *  + hbs: Para renderizar HTML en el servidor
 *  + Bcryptjs: Para codificar las contraseñas
 *
 * FECHA DE CREACION: 26/08/2023 
 ********************************************
 */
const express = require('express');
const session = require('express-session');
const mysql = require("mysql")
const dotenv = require('dotenv')
const path = require("path")
const bcrypt = require("bcryptjs");
const async = require('hbs/lib/async');

const app = express();
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));

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
/*--------------------------------------------------
 *  RUTAS DE LAS APIS
 *--------------------------------------------------
 */
/*-------[API DE RENDERIZACION DEL INDEX]-----------*/
app.get("/", (req, res) => {
    res.render("index")
})
/*--------[API DE VALIDACION DE SESION ]------------*/
/*---------------[API DE CLIENTES]------------------*/
app.get("/clientes", (req, res) => {
    if (req.session.loggedin) {
		// Usuario Loggeado
		//res.send('Bienvenido, ' + req.session.username + '!');
        //res.render("clindex");
        return res.render('clindex',{
            message: 'Bienvenido, '+ req.session.username + '!'
        })
	} else {
		// Usuario No Loggeado
		//res.send('Por Favor Inicie Sesion para visitar esta pagina!');
        return res.render('error',{
            message: 'Por Favor Inicie Sesion para visitar esta pagina!'
        })
	}    
})
/*-----------------[API DE PEDIDOS]-----------------*/
app.get("/pedidos", (req, res) => {
    if (req.session.loggedin) {
		// Usuario Loggeado
		//res.send('Bienvenido, ' + req.session.username + '!');
        //res.render("clindex");
        return res.render('pedindex',{
            message: 'Bienvenido, '+ req.session.username + '!'
        })
	} else {
		// Usuario No Loggeado
		//res.send('Por Favor Inicie Sesion para visitar esta pagina!');
        return res.render('error',{
            message: 'Por Favor Inicie Sesion para visitar esta pagina!'
        })
	}    
})
/*--------[API DE RENDERIZACION DEL REGISTER]-------*/
app.get("/register", (req, res) => {
    res.render("register")
})
/*-----------[API DE RENDERIZACION DEL LOGIN]--------*/
app.get("/login", (req, res) => {
    res.render("login")
})
/*------------------[API DEL LOGOUT]-----------------*/
app.get("/logout", (req, res) => {
    if (req.session.loggedin) {
        req.session.destroy(err => {
            if (err) {
              res.status(400).send('Unable to log out')
            } else {
              //res.send('Logout successful')
              res.redirect('/');
            }
          });
    }
})
/*====================================================
 *  API DE VALIDACION DE USUARIOS Y SESION DEL LOGIN
 *====================================================
 */
app.post("/auth/login", (req, res)=>{
    const { name, email, password, password_confirm } = req.body
    db.query('SELECT * FROM users WHERE name = ?', [name], async(error, result)=>{
        if (error){
            console.log(error)
        }
        if (result.length > 0){
             const comparison = await bcrypt.compare(password, result[0].password)
			 if  (comparison){
				req.session.loggedin = true;
				req.session.username = name;                
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
/*====================================================
 * API DE REGISTRO DE USUARIOS
 *==================================================== 
 */
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
/*------------------------------------------------------
 *   CONFIGURACION DEL PUERTO DE ESCUCHA
 *------------------------------------------------------
 */
app.listen(5000, ()=> {
    console.log("Servidor Iniciado en el Puerto [5000]")
})
