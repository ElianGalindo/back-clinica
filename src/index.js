import express from 'express'
import bcrypt from 'bcrypt'
import cors from 'cors'
import { initializeApp } from 'firebase/app'
import { collection, deleteDoc, doc, getDoc, getDocs, getFirestore, setDoc, updateDoc } from 'firebase/firestore'

const firebaseConfig = {
    apiKey: "AIzaSyB9KxfukWbezFagY0OKypgPmIXxJgGEPUU",
    authDomain: "clinica-eb-978a5.firebaseapp.com",
    projectId: "clinica-eb-978a5",
    storageBucket: "clinica-eb-978a5.appspot.com",
    messagingSenderId: "139481584728",
    appId: "1:139481584728:web:8389d7e471fe580b4ae62d"
}

const firebase = initializeApp(firebaseConfig)
const db = getFirestore(firebase)

//Inicializar el servidor
const app = express()

const corsOptions = {
    origin: '*',
    optionsSuccessStatus: 200

}

app.use(cors(corsOptions))
app.use(express.json())

//Ruta para login
app.post('/login', (req, res) => {
    const { email, password } = req.body
    console.log('Datos recibidos en la solicitud:', req.body);

    if(!email || !password) {
        res.json({
            'alert':'faltan datos'
        })
    }

    const usuarios = collection(db, 'usuarios')
    getDoc(doc(usuarios, email))
    .then((usuario) => {
        if(!usuario.exists()) {
            res.json({ 'alert':'Correo no registrado' })
        }else {
            bcrypt.compare(password, usuario.data().password, (error, result) => {
                if(result){
                    //Para regresar datos
                    let data = usuario.data()
                    res.json({ 
                        'alert':'success',
                        email: data.email,
                    })
                } else{
                    res.json({ 'alert':'Contrasena Incorrecta'})
                }
            })
        }
    })
})

//Registra usuario
app.post('/new-user', (req, res) => {
    let {email, password} = req.body
    
    if(!email.length){
        res.json({
            'alerta': 'Falta el usuario'
        })
    }else if(!password.length){
        res.json({
            'alerta': 'Falta el password'
        })
    }

    const usuarios = collection(db, 'usuarios')

    getDoc(doc(usuarios, email)).then(user => {
        if (user.exists()){
            res.json({
                'alert': 'El usuario ya existe'
            })
        }else{
            //encriptar contrasenia
            bcrypt.genSalt(10, (err, salt) => {
                bcrypt.hash(password, salt, (err, hash) => {
                    const data = {
                        email,
                        password: hash
                    }
                    setDoc(doc(usuarios, email), data).then(data => {
                        res.json({
                            'alert': 'success',
                            data
                        })
                    })
                })
            })
        }
    }).catch(error => {
        res.json({
            'alert': 'Error de conexion'
        })
    })
})

//Registrar cita
app.post('/new-cita', (req, res) => {
    let { nombre, email, telefono, edad, genero, date, time} = req.body
    if(!nombre.length){
        res.json({
            'alerta': 'Falta el nombre'
        })
    }else if(!email.length){
        res.json({
            'alerta': 'Falta el email'
        })
    }else if(!telefono.length){
        res.json({
            'alerta': 'Falta el telefono'
        })
    }else if(!edad.length){
        res.json({
            'alerta': 'Falta la edad'
        })
    }
    else if(!genero.length){
        res.json({
            'alerta': 'Falta el genero'
        })
    }else if(!date.length){
        res.json({
            'alerta': 'Falta la fecha'
        })
    }else if(!time.length){
        res.json({
            'alerta': 'Falta la hora'
        })
    }

    const citas = collection(db, 'citas')
    const formattedDate = date.replace(/-/g, '');  // Elimina las barras inclinadas de la fecha
    const formattedTime = time.replace(':', '').replace(':', '');
    getDoc(doc(citas, `${formattedDate}-${formattedTime}`)).then(cita => {
        if (cita.exists()){
            
            res.json({
                'alert': 'Ya existe una cita el mismo dia y hora'
            })

        }else{
            const data = {
                nombre,
                email,
                telefono, 
                edad,
                genero,
                date,
                time
            }
            setDoc(doc(citas, `${formattedDate}-${formattedTime}`), data).then(data => {
                res.json({
                    'alert': 'success',
                    'message': 'Cita registrada exitosamente',
                    data
                })
            })
        }
    }).catch(error => {
        res.json({
            'alert': 'Error de conexion'
        })
    })
})

//Conectar servidor
app.listen(5020, () => {
    console.log('Servidor trabajando: 5020')
})
