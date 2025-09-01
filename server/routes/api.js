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
