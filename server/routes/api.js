const express = require('express');
const router = express.Router();

// Import Models
const Client = require('../models/Client');
const Invoice = require('../models/Invoice');
const LorryReceipt = require('../models/LorryReceipt');
const Expense = require('../models/Expense');
const Payment = require('../models/Payment');

// Helper to convert mongoose docs to plain objects and rename _id to id
const toClientJSON = (doc) => {
    const obj = doc.toObject();
    obj.id = obj._id.toString();
    delete obj._id;
    delete obj.__v;
    if(obj.lrDetails) {
        obj.lrDetails = obj.lrDetails.map(d => {
            d.id = d._id.toString();
            delete d._id;
            return d;
        })
    }
    if(obj.goods) {
        obj.goods = obj.goods.map(g => {
            g.id = g._id.toString();
            delete g._id;
            return g;
        })
    }
    return obj;
};

// GET ALL APP DATA
router.get('/data', async (req, res) => {
    try {
        const [clients, invoices, lrs, expenses, payments] = await Promise.all([
            Client.find().sort({ _id: -1 }),
            Invoice.find().sort({ _id: -1 }),
            LorryReceipt.find().sort({ _id: -1 }),
            Expense.find().sort({ _id: -1 }),
            Payment.find().sort({ _id: -1 }),
        ]);

        res.json({
            clients: clients.map(toClientJSON),
            invoices: invoices.map(toClientJSON),
            lrs: lrs.map(toClientJSON),
            expenses: expenses.map(toClientJSON),
            payments: payments.map(toClientJSON),
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});


// CLIENTS
router.post('/clients', async (req, res) => {
    try {
        const { id, ...clientData } = req.body;
        let client;
        if (id) {
            client = await Client.findByIdAndUpdate(id, clientData, { new: true });
        } else {
            client = new Client(clientData);
            await client.save();
        }
        res.status(201).json(toClientJSON(client));
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/clients/:id', async (req, res) => {
    try {
        await Client.findByIdAndDelete(req.params.id);
        res.json({ message: 'Client deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// LORRY RECEIPTS
router.post('/lrs', async (req, res) => {
    try {
        const { id, ...lrData } = req.body;
        let lr;
        if (id) {
            lr = await LorryReceipt.findByIdAndUpdate(id, lrData, { new: true });
        } else {
            lr = new LorryReceipt(lrData);
            await lr.save();
        }
        res.status(201).json(toClientJSON(lr));
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/lrs/:id', async (req, res) => {
    try {
        await LorryReceipt.findByIdAndDelete(req.params.id);
        res.json({ message: 'Lorry Receipt deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- LR PHASE TRANSITIONS ---

// Dispatch
router.post('/lrs/:id/dispatch', async (req, res) => {
    try {
        const { vehicle_number, driver_name } = req.body;
        const lr = await LorryReceipt.findByIdAndUpdate(
            req.params.id,
            {
                $set: {
                    status: 'Dispatched',
                    vehicle_number,
                    driver_name,
                    dispatch_time: new Date(),
                }
            },
            { new: true }
        );
        if (!lr) return res.status(404).json({ message: 'LR not found' });
        res.json(toClientJSON(lr));
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update Transit
router.post('/lrs/:id/update-transit', async (req, res) => {
    try {
        const { location } = req.body;
        const lr = await LorryReceipt.findByIdAndUpdate(
            req.params.id,
            {
                $set: {
                    status: 'In Transit',
                    current_location: location,
                },
                $push: {
                    transit_updates: { location: location, timestamp: new Date() }
                }
            },
            { new: true }
        );
        if (!lr) return res.status(404).json({ message: 'LR not found' });
        res.json(toClientJSON(lr));
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Deliver
router.post('/lrs/:id/deliver', async (req, res) => {
    try {
        const { proof_of_delivery } = req.body; // Assuming POD is a string path for now
        const lr = await LorryReceipt.findByIdAndUpdate(
            req.params.id,
            {
                $set: {
                    status: 'Delivered',
                    proof_of_delivery,
                    delivery_time: new Date(),
                }
            },
            { new: true }
        );
        if (!lr) return res.status(404).json({ message: 'LR not found' });
        res.json(toClientJSON(lr));
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Close
router.post('/lrs/:id/close', async (req, res) => {
    try {
        const lr = await LorryReceipt.findByIdAndUpdate(
            req.params.id,
            {
                $set: {
                    status: 'Closed',
                    closure_time: new Date(),
                }
            },
            { new: true }
        );
        if (!lr) return res.status(404).json({ message: 'LR not found' });
        res.json(toClientJSON(lr));
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

const PDFDocument = require('pdfkit');

router.get('/lrs/:id/pdf/booking', async (req, res) => {
    try {
        const lr = await LorryReceipt.findById(req.params.id);
        if (!lr) {
            return res.status(404).send('Lorry Receipt not found');
        }

        const doc = new PDFDocument({ margin: 50 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=LR_Booking_${lr.lr_number}.pdf`);

        doc.pipe(res);

        // Header
        doc.fontSize(20).text('Lorry Receipt (Booking Phase)', { align: 'center' });
        doc.moveDown();

        // LR Details
        doc.fontSize(12);
        doc.text(`LR Number: ${lr.lr_number}`, { continued: true });
        doc.text(`Booking Date: ${new Date(lr.booking_time).toLocaleDateString('en-GB')}`, { align: 'right' });

        doc.moveDown();

        // Consignor & Consignee
        doc.text('Consignor:', { underline: true });
        doc.text(lr.consignor_name);
        doc.moveDown();
        doc.text('Consignee:', { underline: true });
        doc.text(lr.consignee_name);

        doc.moveDown();

        // Origin & Destination
        doc.text(`Origin: ${lr.origin_location}`);
        doc.text(`Destination: ${lr.destination_location}`);

        doc.moveDown();

        // Goods Details
        doc.text('Goods Details:', { underline: true });
        doc.text(lr.goods_description);
        doc.text(`Quantity: ${lr.quantity}`);
        doc.text(`Weight: ${lr.weight} kg`);

        doc.moveDown();

        // Freight
        if (!lr.hide_freight_in_pdf) {
            doc.text(`Freight Type: ${lr.freight_type}`);
            doc.text(`Freight Amount: ${lr.freight_amount}`);
        }

        // Footer
        doc.fontSize(10).text('Generated by TranspoTruck', 50, 725, {
            align: 'center',
            width: 500,
        });

        doc.end();

    } catch (err) {
        console.error('Error generating PDF:', err);
        res.status(500).send('Error generating PDF');
    }
});

router.get('/lrs/:id/pdf/dispatch', async (req, res) => {
    try {
        const lr = await LorryReceipt.findById(req.params.id);
        if (!lr) return res.status(404).send('LR not found');

        const doc = new PDFDocument({ margin: 50 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=LR_Dispatch_${lr.lr_number}.pdf`);
        doc.pipe(res);

        doc.fontSize(20).text('Lorry Receipt (Dispatch Phase)', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12);
        doc.text(`LR Number: ${lr.lr_number}`);
        doc.text(`Dispatch Date: ${lr.dispatch_time ? new Date(lr.dispatch_time).toLocaleDateString('en-GB') : 'N/A'}`);
        doc.moveDown();
        doc.text(`Vehicle Number: ${lr.vehicle_number}`);
        doc.text(`Driver Name: ${lr.driver_name}`);
        doc.moveDown();
        doc.text('Consignor:', { underline: true }).text(lr.consignor_name);
        doc.moveDown();
        doc.text('Consignee:', { underline: true }).text(lr.consignee_name);

        if (!lr.hide_freight_in_pdf) {
            doc.moveDown();
            doc.text(`Freight Amount: ${lr.freight_amount}`);
        }

        doc.end();
    } catch (err) {
        res.status(500).send('Error generating PDF');
    }
});

router.get('/lrs/:id/pdf/closure', async (req, res) => {
    try {
        const lr = await LorryReceipt.findById(req.params.id);
        if (!lr) return res.status(404).send('LR not found');

        const doc = new PDFDocument({ margin: 50 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=LR_Closure_${lr.lr_number}.pdf`);
        doc.pipe(res);

        doc.fontSize(20).text('Lorry Receipt (Final Summary)', { align: 'center' });
        doc.moveDown();

        // --- Booking Info ---
        doc.fontSize(14).text('Booking Details', { underline: true });
        doc.fontSize(10)
           .text(`LR Number: ${lr.lr_number}`)
           .text(`Booking Date: ${new Date(lr.booking_time).toLocaleString('en-GB')}`)
           .text(`From: ${lr.origin_location} To: ${lr.destination_location}`)
           .text(`Consignor: ${lr.consignor_name}`)
           .text(`Consignee: ${lr.consignee_name}`)
           .text(`Goods: ${lr.goods_description} (${lr.quantity} pcs, ${lr.weight} kg)`);

        if (!lr.hide_freight_in_pdf) {
            doc.text(`Freight Type: ${lr.freight_type}`);
            doc.text(`Freight Amount: ${lr.freight_amount}`);
        }
        doc.moveDown();

        // --- Dispatch Info ---
        doc.fontSize(14).text('Dispatch Details', { underline: true });
        doc.fontSize(10)
           .text(`Dispatch Date: ${lr.dispatch_time ? new Date(lr.dispatch_time).toLocaleString('en-GB') : 'N/A'}`)
           .text(`Vehicle: ${lr.vehicle_number || 'N/A'}`)
           .text(`Driver: ${lr.driver_name || 'N/A'}`);
        doc.moveDown();

        // --- Transit History ---
        if(lr.transit_updates && lr.transit_updates.length > 0) {
            doc.fontSize(14).text('Transit History', { underline: true });
            lr.transit_updates.forEach(update => {
                 doc.fontSize(10).text(`- ${update.location} at ${new Date(update.timestamp).toLocaleString('en-GB')}`);
            });
            doc.moveDown();
        }

        // --- Delivery Info ---
        doc.fontSize(14).text('Delivery Details', { underline: true });
        doc.fontSize(10)
           .text(`Delivery Date: ${lr.delivery_time ? new Date(lr.delivery_time).toLocaleString('en-GB') : 'N/A'}`)
           .text(`Proof of Delivery: ${lr.proof_of_delivery || 'N/A'}`);
        doc.moveDown();

        doc.fontSize(10).text(`Closed on: ${lr.closure_time ? new Date(lr.closure_time).toLocaleString('en-GB') : 'N/A'}`);

        doc.end();
    } catch (err) {
        res.status(500).send('Error generating PDF');
    }
});


// INVOICES
router.post('/invoices', async (req, res) => {
    try {
        // Mongoose doesn't have an "upsert" that works well with our custom 'id' field, so we check existence manually.
        const existingInvoice = await Invoice.findOne({ id: req.body.id });

        let savedInvoice;
        if (existingInvoice) {
            savedInvoice = await Invoice.findByIdAndUpdate(existingInvoice._id, req.body, { new: true });
        } else {
            const newInvoice = new Invoice(req.body);
            savedInvoice = await newInvoice.save();
        }

        // Mark associated LRs as 'Billed'
        const billedLrIds = savedInvoice.lrDetails.map(d => d.id);
        await LorryReceipt.updateMany({ _id: { $in: billedLrIds } }, { $set: { status: 'Billed' } });
        
        const updatedLrs = await LorryReceipt.find({ _id: { $in: billedLrIds } });

        res.status(201).json({ 
            updatedInvoice: toClientJSON(savedInvoice),
            updatedLrs: updatedLrs.map(toClientJSON),
        });
    } catch (err) {
        console.error("Error saving invoice:", err);
        res.status(400).json({ message: err.message });
    }
});

router.delete('/invoices/:id', async (req, res) => {
    try {
        const invoiceToDelete = await Invoice.findOne({ id: req.params.id });
        if (!invoiceToDelete) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        // Revert associated LRs to 'Un-Billed'
        const lrIdsToRevert = invoiceToDelete.lrDetails.map(d => d.id);
        await LorryReceipt.updateMany({ _id: { $in: lrIdsToRevert } }, { $set: { status: 'Un-Billed' } });
        
        const updatedLrs = await LorryReceipt.find({ _id: { $in: lrIdsToRevert } });
        
        await Invoice.findByIdAndDelete(invoiceToDelete._id);

        res.json({ 
            message: 'Invoice deleted',
            updatedLrs: updatedLrs.map(toClientJSON),
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// EXPENSES
router.post('/expenses', async (req, res) => {
    try {
        const { id, ...expenseData } = req.body;
        let expense;
        if (id) {
            expense = await Expense.findByIdAndUpdate(id, expenseData, { new: true });
        } else {
            expense = new Expense(expenseData);
            await expense.save();
        }
        res.status(201).json(toClientJSON(expense));
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/expenses/:id', async (req, res) => {
    try {
        await Expense.findByIdAndDelete(req.params.id);
        res.json({ message: 'Expense deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// PAYMENTS
router.post('/payments', async (req, res) => {
    try {
        const payment = new Payment(req.body);
        await payment.save();
        res.status(201).json(toClientJSON(payment));
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
