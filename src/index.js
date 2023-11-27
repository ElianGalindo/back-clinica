import express from 'express'
import bcrypt from 'bcrypt'
import cors from 'cors'
import { initializeApp } from 'firebase/app'
import { collection, deleteDoc, doc, getDoc, getDocs, getFirestore, setDoc, updateDoc, query, where } from 'firebase/firestore'

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
    const { nombre, emailD, password } = req.body
    console.log('Datos recibidos en la solicitud:', req.body);

    if(!nombre || !emailD || !password) {
        res.json({
            'alert':'faltan datos'
        })
    }

    const usuarios = collection(db, 'usuarios')
    getDoc(doc(usuarios, emailD))
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
                        email: data.emailD,
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
    let {nombre, emailD, password} = req.body
    
    if(!nombre.length){
        res.json({
            'alerta': 'Falta el usuario'
        })
    }else if(!emailD.length){
        res.json({
            'alerta': 'Falta el password'
        })
    }else if(!password.length){
        res.json({
            'alerta': 'Falta el password'
        })
    }


    const usuarios = collection(db, 'usuarios')

    getDoc(doc(usuarios, emailD)).then(user => {
        if (user.exists()){
            res.json({
                'alert': 'El usuario ya existe'
            })
        }else{
            //encriptar contrasenia
            bcrypt.genSalt(10, (err, salt) => {
                bcrypt.hash(password, salt, (err, hash) => {
                    const data = {
                        nombre,
                        emailD,
                        password: hash
                    }
                    setDoc(doc(usuarios, emailD), data).then(data => {
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
app.post('/new-cita', async (req, res) => {
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

    // Consulta si ya existe un paciente con el mismo correo electrónico
    const pacientes = collection(db, 'pacientes');
    const pacienteQuery = query(pacientes, where('email', '==', email));
    const pacientesObtenidos = await getDocs(pacienteQuery);
    if (pacientesObtenidos.size === 0) {
        // No existe un paciente con el mismo correo, mostrar alerta
        return res.json({ 'alerta': 'No existe un paciente registrado con ese correo' });
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

//Traer citas
app.get('/get-citas', async (req, res) => {
    try{
       const citas = [];
       const data = await collection(db, 'citas')
       const docs = await getDocs(data)
       const today = new Date()
       docs.forEach((doc) => {
        const cita = doc.data()
        if (new Date(cita.date) > today) {
            // La cita está en el futuro, por lo tanto, está pendiente
            cita.status = 'upcoming'
          } else {
            // La cita ya pasó, por lo tanto, está cancelada
            cita.status = 'cancelada'
          }
    
        citas.push(cita)
       })
        res.json({
            'alert': 'success',
            citas
        })
    }catch (error) {
        res.json({
            'alert': 'error getting data',
            error
        })
    }
})

//Registrar paciente
app.post('/new-paciente', (req, res) => {
    let { nombre, apellido, email, telefono, nacimiento, edad, genero, direccion, tratamiento, sangre, documento} = req.body
    if(!nombre.length){
        res.json({
            'alerta': 'Falta el nombre'
        })
    }else if(!apellido.length){
        res.json({
            'alerta': 'Falta el email'
        })
    }else if(!email.length){
        res.json({
            'alerta': 'Falta el email'
        })
    }else if(!telefono.length){
        res.json({
            'alerta': 'Falta el telefono'
        })
    }else if(!nacimiento.length){
        res.json({
            'alerta': 'Falta el email'
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
    }else if(!direccion.length){
        res.json({
            'alerta': 'Falta la fecha'
        })
    }else if(!tratamiento.length){
        res.json({
            'alerta': 'Falta la hora'
        })
    }else if(!sangre.length){
        res.json({
            'alerta': 'Falta el email'
        })
    }

    const pacientes = collection(db, 'pacientes')
    getDoc(doc(pacientes, email)).then(paciente => {
        if (paciente.exists()){
            
            res.json({
                'alert': 'El paciente ya existe '
            })

        }else{
            const data = {
                nombre,
                apellido,
                email,
                telefono,
                nacimiento, 
                edad,
                genero,
                direccion,
                tratamiento,
                sangre,
                documento
                
            }
            setDoc(doc(pacientes, email), data).then(data => {
                res.json({
                    'alert': 'success',
                    'message': 'Paciente registrado exitosamente',
                    data
                })
            })
        }
    }).catch(error => {
        console.error(error)
        res.json({
            'alert': 'Error de conexion'
        })
    })
})


//Traer pacientes
app.get('/get-pacientes', async (req, res) => {
    try{
       const pacientes = [];
       const data = await collection(db, 'pacientes')
       const docs = await getDocs(data)
       docs.forEach((doc) => {
        pacientes.push(doc.data())
       })
        res.json({
            'alert': 'success',
             pacientes
        })
    }catch (error) {
        console.error(error)
        res.json({
            'alert': 'error getting data',
            error
        })
    }
})

//Conectar servidor
app.listen(5020, () => {
    console.log('Servidor trabajando: 5020')
})
