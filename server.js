require('dotenv').config();
const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');
const fs = require('fs');
const clientSessions = require('client-sessions');
const mongoose = require('mongoose');
const orderRoutes = require('./order');
const Gallery = require('./models/Gallery');

const app = express();
const PORT = 3000;

// MongoDB connection
mongoose.connect(process.env.MONGO_URL).then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error(" MongoDB connection error:", err));

// Handlebars setup (with json helper)
const hbs = exphbs.create({
    extname: '.hbs',
    defaultLayout: false,
    helpers: {
        removeExtension: function (filename) {
            return filename?.replace('.jpg', '');
        },
        eq: function (a, b) {
            return a === b;
        },
        json: function (context) {
            return JSON.stringify(context); //Allows raw JS alert text
        }
    },
    partialsDir: path.join(__dirname, 'views', 'partials')
});
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(clientSessions({
    cookieName: "session",
    secret: "someSecret123",
    duration: 30 * 60 * 1000,
    activeDuration: 5 * 60 * 1000
}));

// Load users
const users = JSON.parse(fs.readFileSync(path.join(__dirname, "user.json"), "utf-8"));

// Login page
app.get('/', (req, res) => {
    res.render('login', { name: "Masoumeh Hosseinnazhad" });
});

// Login handler
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!users[username]) {
        return res.render("login", { name: "Masoumeh Hosseinnazhad", error: "Not a registered username" });
    }
    if (users[username] !== password) {
        return res.render("login", { name: "Masoumeh Hosseinnazhad", error: "Invalid password" });
    }

    req.session.user = { name: "Masoumeh Hosseinnazhad", email: username };

    // Reset all STATUS to A on login
    await Gallery.updateMany({}, { $set: { STATUS: "A" } });

    res.redirect('/gallery');
});

// Gallery route
app.get('/gallery', async (req, res) => {
    if (!req.session.user) return res.redirect('/');

    const availableImages = await Gallery.find({ STATUS: "A" });
    const imageList = availableImages.map(img => img.FILENAME);

    const selectedImage =
        req.session.imageAfterCancel ||
        req.session.imageAfterBuy ||
        'Gallery.jpg';

    const selectedDoc = await Gallery.findOne({ FILENAME: selectedImage });

    const alert = req.session.alert || null;
    req.session.alert = null;
    req.session.imageAfterCancel = null;
    req.session.imageAfterBuy = null;

    res.render('index', {
        userName: req.session.user.name,
        userEmail: req.session.user.email,
        images: imageList,
        selectedImage,
        description: selectedDoc ? selectedDoc.DESCRIPTION : '',
        price: selectedDoc ? selectedDoc.PRICE : '',
        alert
    });
});

// Handle dropdown image selection
app.post('/image', async (req, res) => {
    if (!req.session.user) return res.redirect('/');

    const selectedImage = req.body.image;
    const availableImages = await Gallery.find({ STATUS: "A" });
    const imageList = availableImages.map(img => img.FILENAME);

    const selectedDoc = await Gallery.findOne({ FILENAME: selectedImage });

    res.render('index', {
        userName: req.session.user.name,
        userEmail: req.session.user.email,
        images: imageList,
        selectedImage,
        description: selectedDoc ? selectedDoc.DESCRIPTION : '',
        price: selectedDoc ? selectedDoc.PRICE : '',
        alert: null
    });
});

// Logout
app.get('/logout', (req, res) => {
    req.session.reset();
    res.redirect('/');
});

//  Mount /order routes
app.use('/order', orderRoutes);

//  Start server
app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});
