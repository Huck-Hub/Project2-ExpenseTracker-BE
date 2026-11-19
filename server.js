var express = require("express");
var cors = require("cors");
var path = require("path");
var fs = require("fs");
require("dotenv").config({ path: "./config.env" });

// Native MongoDB driver setup
const { MongoClient, ObjectId } = require("mongodb");
const hasAtlasConfig = process.env.MONGODB_USERNAME && process.env.MONGODB_USERNAME !== "your_username";
const uri = process.env.MONGODB_PREFIX +
    process.env.MONGODB_USERNAME + ":" +
    process.env.MONGODB_PASSWORD +
    process.env.MONGODB_URL;
const client = hasAtlasConfig ? new MongoClient(uri) : null;
const db = client ? client.db(process.env.MONGODB_DB || "ExpenseTrackerDB") : null;

// Load local fallback expenses from expenses.json so the server works immediately out of the box
let localExpenses = JSON.parse(fs.readFileSync(path.resolve(__dirname, "expenses.json"), "utf8"));

var app = express();

app.use(cors());
app.use(express.json());

// Logger Middleware: logs every incoming request's HTTP method, URL, and timestamp
app.use(function(request, response, next) {
    console.log("Incoming " + request.method + " request to " + request.url + " [" + new Date().toISOString() + "]");
    next();
});

// Static File Middleware
var publicPath = path.resolve(__dirname, "staticFiles");
app.use("/images", express.static(publicPath));
app.use("/images", function(request, response) {
    response.status(404).send("Image not found!");
});

// Helper to get all expenses from MongoDB Atlas (or local fallback)
async function getAllExpenses() {
    if (db) {
        let collection = await db.collection("expenses");
        return await collection.find({}).toArray();
    }
    return localExpenses;
}

// GET /expenses: returns all expenses as JSON
app.get("/expenses", async function(request, response) {
    try {
        let results = await getAllExpenses();
        response.send(results);
    } catch (err) {
        response.send(localExpenses);
    }
});

// GET /search?q=...: full-stack search across title, category, amount, paymentMethod, and date
app.get("/search", async function(request, response) {
    let searchText = (request.query.q || "").toLowerCase();
    try {
        let allExpenses = await getAllExpenses();
        let filtered = allExpenses.filter(function(exp) {
            return String(exp.title).toLowerCase().includes(searchText) ||
                   String(exp.category).toLowerCase().includes(searchText) ||
                   String(exp.amount).toLowerCase().includes(searchText) ||
                   String(exp.paymentMethod).toLowerCase().includes(searchText) ||
                   String(exp.date).toLowerCase().includes(searchText);
        });
        response.send(filtered);
    } catch (err) {
        response.status(500).send({ error: "Search failed" });
    }
});

// POST /expenses: saves a new expense to MongoDB Atlas (and local fallback)
app.post("/expenses", async function(request, response) {
    var body = request.body;
    try {
        if (db) {
            let collection = await db.collection("expenses");
            let result = await collection.insertOne(body);
            response.send(result);
        } else {
            body._id = String(Date.now());
            localExpenses.unshift(body);
            response.send({ acknowledged: true, insertedId: body._id });
        }
    } catch (err) {
        response.status(500).send({ error: "Failed to save expense" });
    }
});

// PUT /expenses/:_id: updates any attribute of an expense (title, amount, category, paymentMethod, date, recurring)
app.put("/expenses/:_id", async function(request, response) {
    let tempid = request.params._id;
    try {
        if (db && ObjectId.isValid(tempid)) {
            let collection = await db.collection("expenses");
            const query = { _id: new ObjectId(tempid) };
            const updates = { $set: request.body };
            let result = await collection.updateOne(query, updates);
            response.send(result);
        } else {
            for (let i = 0; i < localExpenses.length; i++) {
                if (String(localExpenses[i]._id) === String(tempid) || String(localExpenses[i].id) === String(tempid)) {
                    Object.assign(localExpenses[i], request.body);
                }
            }
            response.send({ acknowledged: true, modifiedCount: 1 });
        }
    } catch (err) {
        response.status(500).send({ error: "Failed to update expense" });
    }
});

// DELETE /expenses/:_id: deletes an expense from MongoDB Atlas (or local fallback)
app.delete("/expenses/:_id", async function(request, response) {
    let tempid = request.params._id;
    try {
        if (db && ObjectId.isValid(tempid)) {
            let collection = await db.collection("expenses");
            const query = { _id: new ObjectId(tempid) };
            let result = await collection.deleteOne(query);
            response.send(result);
        } else {
            localExpenses = localExpenses.filter(function(e) {
                return String(e._id) !== String(tempid) && String(e.id) !== String(tempid);
            });
            response.send({ acknowledged: true, deletedCount: 1 });
        }
    } catch (err) {
        response.status(500).send({ error: "Failed to delete expense" });
    }
});

// Final 404 Fallback Middleware
app.use(function(request, response) {
    response.status(404).send("Page not found!");
});

const port = process.env.PORT || 3000;
app.listen(port, function() {
    console.log("Expense Tracker Backend Server started on port " + port);
});
