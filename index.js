import express from 'express'
import dotenv from "dotenv"
import bodyParser from 'body-parser'
import cors from "cors"
import cookieParser from 'cookie-parser'
import connectDB from './configs/db.js'
import { v2 as cloudinary } from 'cloudinary';
import http from 'http';  // Import http untuk membuat server
import { Server } from 'socket.io'; 
import { initSocket } from './service/socket.js' // Import Server dari socket.io
// router
import umkmRouter from './router/user/umkm-router.js'
import authRouter from './router/auth/auth-router.js'
import productRouter from './router/product/product-router.js'
import orderRouter from './router/tabel orders/order-tabel-router.js'
import numberRouter from './router/tabel orders/number-router.js'
import orderCashierRouter from './router/orders cashier/order-cashier-router.js'


const app = express()
const server = http.createServer(app)

export const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "https://client-noteku.vercel.app", "https://catatansaya.vercel.app"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
    transports: ["websocket", "polling"],
  },
});
const port = process.env.PORT || 4000;
dotenv.config()
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
});


initSocket(server)

connectDB();



// Middleware
app.use(express.json())
app.use(cookieParser())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(
  cors({
    origin: ["http://localhost:3000", "https://client-kelolasaji.vercel.app",],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
  })
);

// test aja

// Router
 app.use("/product", productRouter)
 app.use("/umkm", umkmRouter)
 app.use("/auth", authRouter)
app.use("/order", orderRouter )
app.use("/number", numberRouter)
app.use("/cashier", orderCashierRouter)
// Router
// io.on('connection', (socket) => {
//   console.log('A user connected');

//   // Emit event saat order baru dibuat
//   socket.on('disconnect', () => {
//     console.log('A user disconnected');
//   });
// });
server.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})