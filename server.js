const express = require('express');
     const mongoose = require('mongoose');
     const jwt = require('jsonwebtoken');
     const cors = require('cors');
     require('dotenv').config();

     const app = express();
     app.use(cors({ origin: 'https://cashbox-frontend.onrender.com' }));
     app.use(express.json());

     // Тестовый маршрут
     app.get('/', (req, res) => {
       res.json({ message: 'Бэкенд кассы зоомагазина работает!' });
     });

     // Подключение к MongoDB Atlas
     mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
       .then(() => console.log('Connected to MongoDB Atlas'))
       .catch(err => console.error('MongoDB connection error:', err));

     // Схемы
     const userSchema = new mongoose.Schema({
       name: String,
       email: String,
       password: String,
       role: { type: String, enum: ['cashier', 'manager', 'admin'] }
     });
     const productSchema = new mongoose.Schema({
       name: String,
       price: Number,
       category: String,
       stock: Number
     });
     const orderSchema = new mongoose.Schema({
       products: [{ productId: mongoose.Schema.Types.ObjectId, quantity: Number }],
       total: Number,
       cashierId: mongoose.Schema.Types.ObjectId,
       date: { type: Date, default: Date.now },
       status: { type: String, enum: ['pending', 'completed'], default: 'pending' }
     });

     const User = mongoose.model('User', userSchema);
     const Product = mongoose.model('Product', productSchema);
     const Order = mongoose.model('Order', orderSchema);

     // Middleware для проверки токена
     const authMiddleware = (roles) => async (req, res, next) => {
       const token = req.headers.authorization?.split(' ')[1];
       if (!token) return res.status(401).json({ error: 'Токен отсутствует' });

       try {
         const decoded = jwt.verify(token, process.env.JWT_SECRET);
         if (!roles.includes(decoded.role)) return res.status(403).json({ error: 'Доступ запрещён' });
         req.user = decoded;
         next();
       } catch (err) {
         res.status(401).json({ error: 'Недействительный токен' });
       }
     };

     // Маршруты
     app.post('/api/login', async (req, res) => {
       const { email, password } = req.body;
       const user = await User.findOne({ email, password });
       if (!user) return res.status(401).json({ error: 'Неверные данные' });

       const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
       res.json({ user: { name: user.name, role: user.role }, token });
     });

     app.get('/api/verify', authMiddleware(['cashier', 'manager', 'admin']), async (req, res) => {
       const user = await User.findById(req.user.id);
       res.json({ user: { name: user.name, role: user.role } });
     });

     app.get('/api/products', authMiddleware(['admin', 'manager', 'cashier']), async (req, res) => {
       const products = await Product.find();
       res.json(products);
     });

     app.post('/api/products', authMiddleware(['admin']), async (req, res) => {
       const product = new Product(req.body);
       await product.save();
       res.json(product);
     });

     app.post('/api/orders', authMiddleware(['cashier']), async (req, res) => {
       const order = new Order({ ...req.body, cashierId: req.user.id });
       await order.save();
       res.json(order);
     });

     const PORT = process.env.PORT || 3000;
     app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));