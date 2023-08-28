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
 *             RUTAS DE LA APLICACION
 *--------------------------------------------------
 */
/*-------[RUTA DE RENDERIZACION DEL INDEX]-----------*/
app.get("/", (req, res) => {
    res.render("index")
})
/*--------[RUTA DE VALIDACION DE SESION ]------------*/
/*---------------[RUTA DE CLIENTES]------------------*/
app.get("/clientes", (req, res, next) => {
    if (req.session.loggedin) {
		// Usuario Loggeado Hace el query y
		//despliega datos en la pagina de administracion de clientes
        db.query('SELECT * FROM clientes ORDER BY id_cliente DESC' ,  function(error, rows){
            if(error){
                console.log(error)
            }
            return res.render('clindex',{ message: 'Bienvenido, '+ req.session.username + '!', clientes: rows })    
        })
        
	} else {
		// Usuario No Loggeado
		//Se devuelve el mensaje mostrado por la pagina de error
        return res.render('error',{message: 'Por Favor Inicie Sesion para visitar esta pagina!' })
	}    
})
/*-----------------[RUTA DE PEDIDOS]-----------------*/
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
/*--------[RUTA DE RENDERIZACION DEL REGISTER]-------*/
app.get("/register", (req, res) => {
    res.render("register")
})
/*-----------[RUTA DE RENDERIZACION DEL LOGIN]--------*/
app.get("/login", (req, res) => {
    res.render("login")
})
/*------------------[RUTA DEL LOGOUT]-----------------*/
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
 *  RUTA DE VALIDACION DE USUARIOS Y SESION DEL LOGIN
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
/*--------[RUTA DE RENDERIZACION FORMULARIO NUEVO CLIENTE]-------*/
app.get("/newcli", (req, res) => {
    res.render("newcli")
})
/*====================================================
 * RUTA DE REGISTRO DE USUARIOS
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
/*====================================================
 * RUTA DE REGISTRO DE CLIENTES
 *==================================================== 
 */
 app.post("/cliente/new", (req, res) => {
    if (req.session.loggedin) {
        const { cliente_nombre, cliente_apellido, cliente_direccion, cliente_correo, cliente_telefono} = req.body
        db.query('SELECT correo FROM clientes WHERE correo = ?', [cliente_correo], async (error, result) => {
            if(error){
                console.log(error)
            }
            if( result.length > 0 ) {
                return res.render('newcli', { message: 'Este e-mail ya fué Registrado' })
            } else {                    
                db.query('INSERT INTO clientes SET?', {nombre: cliente_nombre, apellido:cliente_apellido, direccion:cliente_direccion, correo:cliente_correo, telefono:cliente_telefono}, (err, result) => {
                    if(error) {
                        console.log(error)
                    } else {
                        return res.render('newcli', {message: 'Cliente Registrado!'})
                    }
                })        
            }
        })                         
    } else {
        return res.render('error',{
            message: 'Por Favor Inicie Sesion para visitar esta pagina!'
        })
    }  
 })
/*====================================================
 * RUTA DE SELECCION DE CLIENTES PARA EDICION
 *==================================================== 
 */
 app.get('/edicli/:id', function(req, res, next) {
    let id = req.params.id;
    db.query(`SELECT * FROM clientes WHERE id_cliente =${id}`, function(err, rows, fields) {
        if(err) throw err
        // Usuario No encontrado
        if (rows.length <= 0) {
            //req.flash('error', 'User not found with id = ' + id)
            res.redirect('/cliente')
        }
        // Usuario Encontrado
        else {
            // Muestra los datos en la pagina            
            res.render('edicli', {clientes:rows[0]})
        }
    })
})
/*-----------------------------------------------
 *  ACTUALIZACION DE CLIENTES SELECCIONADOS
 *-----------------------------------------------
 */
 app.post("/clientes/actualiza/:id", function(req, res, next) {
    var id = req.params.id;
    const { cliente_nombre, cliente_apellido, cliente_direccion, cliente_correo, cliente_telefono} = req.body

    var sql = `UPDATE clientes SET nombre="${cliente_nombre}", apellido="${cliente_apellido}", direccion="${cliente_direccion}", correo="${cliente_correo}", telefono="${cliente_telefono}" WHERE id_cliente=${id}`;
  
    db.query(sql, function(err, result) {
      if (err) throw err;
      console.log('Registro Actualizado!');
      res.redirect('/clientes');
    });
  });
/*-----------------------------------------------
 *  ELIMINACION DE CLIENTES SELECCIONADOS
 *-----------------------------------------------
 */
 app.get('/clientes/elimina/:id', function(req, res){
    var id = req.params.id;
    console.log(id);
    var sql = `DELETE FROM clientes WHERE id_cliente=${id}`;
  
    db.query(sql, function(err, result) {
      if (err) throw err;
      console.log('Registro Eliminado');
      res.redirect('/clientes');
    });
  });
/*------------------------------------------------------
 *   CONFIGURACION DEL PUERTO DE ESCUCHA
 *------------------------------------------------------
 */
app.listen(5000, ()=> {
    console.log("Servidor Iniciado en el Puerto [5000]")
})
