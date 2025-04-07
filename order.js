const express = require('express');
const router = express.Router();
const Gallery = require('./models/Gallery');

// ✅ Route to display the purchase page
router.get('/:image', async (req, res) => {
    if (!req.session.user) return res.redirect('/');

    const filename = req.params.image;

    try {
        const imageDoc = await Gallery.findOne({ FILENAME: filename });

        if (!imageDoc) {
            return res.status(404).send("Image not found.");
        }

        res.render('purchase', {
            selectedImage: imageDoc.FILENAME,
            description: imageDoc.DESCRIPTION,
            price: imageDoc.PRICE
        });
    } catch (err) {
        res.status(500).send("Error retrieving image");
    }
});

// ✅ Route to handle Buy (NO session alert here)
router.post('/buy', async (req, res) => {
    const { image } = req.body;

    try {
        await Gallery.updateOne({ FILENAME: image }, { $set: { STATUS: "S" } });
        req.session.imageAfterBuy = 'Gallery.jpg'; // No alert here
        res.redirect('/gallery');
    } catch (err) {
        res.status(500).send("Error updating image status");
    }
});

// ✅ Route to handle Cancel (with alert)
router.post('/cancel', async (req, res) => {
    const { image } = req.body;

    try {
        req.session.alert = "Maybe next time.";
        req.session.imageAfterCancel = image;
        res.redirect('/gallery');
    } catch (err) {
        res.status(500).send("Error processing cancellation");
    }
});

module.exports = router;
