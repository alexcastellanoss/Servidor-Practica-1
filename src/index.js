import app from './app.js'
import dbConnect from './config/index.js'

const PORT = process.env.PORT || 3000

dbConnect();

app.listen(PORT, () => {
    console.log('Iniciando servidor en el puerto 3000')
})