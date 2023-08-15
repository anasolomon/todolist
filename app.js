//REQUIRING MODULES
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require("lodash");
require('dotenv').config();
const PORT = process.env.PORT || 3030;


const app = express();
//USING EJS TO RENDER PAGES
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
//FOR LOADING ALL LOCAL FILES FROM ONE PLACE
app.use(express.static("public"));

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:0.0.0.0/todolistDB', { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });

// DECLARING SCHEMA FOR THE Items TABLE
const itemsSchema = new mongoose.Schema({
    name: String
});
// DECLARING SCHEMA FOR THE List TABLE
const listSchema = new mongoose.Schema({
    name: String,
    items: [itemsSchema]
});

// DECLARING THE ITEM MODEL (ASSIGNING IT THE ITEM SCHEMA)
const Item = mongoose.model("Item", itemsSchema);
const List = mongoose.model("List", listSchema);

// CREATING DOCUMENTS FOR THE Item TABLE
const item1 = new Item({
    name: "Welcome to your todolist!"
});
const item2 = new Item({
    name: "Hit the + button to add a new item."
});
const item3 = new Item({
    name: "<-- Hit this to delete an item."
});
// INSERTING THE DOCUMENTS INTO AN ARRAY CALLED defaultItems
const defaultItems = [item1, item2, item3];


//RENDERS THE list.ejs - IF Item TABLE EMPTY THEN INSERTS DEFAULT DOCUMENTS AND REDIRECTS TO "/" TO REFRESH DATA - IF NOT EMPTY THEN JUST DISPLAY DATA AS IT IS
app.get("/", function (req, res) {
    //find() FOR THE Item TABLE. WILL FIND ALL THE DOCUMENTS IN THE Item TABLE AND STORE THEM IN THE ARRAY foundItems
    Item.find({}, function (err, foundItems) {
        // IF foundItems FROM Item TABLE IS EQUAL TO 0 (EMPTY) THEN EXECUTE insertMany() METHOD
        if (foundItems.length === 0) {
            //INSERTS THE defaultItems ARRAY CONTAINING THE DEFAULT DOCUMENTS INTO THE Item TABLE
            Item.insertMany(defaultItems, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Succesfully saved the default items to the todolistDB");
                }
            });
            // MUST REDIRECT USER TO ROOT ROUTE TO REFRESH/RENDER CHANGES IN THE DISPLAYED DATA IN list.ejs
            res.redirect("/");
        } else {
            // RENDERS THE list.ejs PAGE WITH EJS SCRIPTLETS listTitle = "Today" AND newListItems = foundItems
            res.render("list", { listTitle: "Today", newListItems: foundItems });
        }
    });
});

// CATCHES USER INPUTTED STRING AND STORES IT IN Item TABLE AS A NEW DOCUMENT - REDIRECTS USER TO ROOT ROUTE - GETS TRIGGERED ONLY IF SUBMIT BUTTON CLICKED IN "/" HTML POST FORM
app.post("/", function (req, res) {
    // STORES (LIST'S) INPUT ITEM AFTER "+" BUTTON SUBMIT IS CLICKED 
    const itemName = req.body.newItem;
    // STORES PAGE'S NAME AFTER "+" BUTTON SUBMIT IS CLICKED
    const listName = req.body.list;

    //CREATES A NEW DOCUMENT WITH PROPERTY name EQUAL TO itemName (ENTERED LIST ITEM) INTO Item TABLE
    const item = new Item({
        name: itemName
    });

    if (listName === "Today") {
        // SAVES THAT ROW INTO THE TABLE
        item.save();
        //REDIRECTS USER TO ROOT ROUTE TO REFRESH/RENDER list.ejs
        res.redirect("/");
    } else {
        // FINDS ONE ITEM FROM List TABLE WITH PAGE'S NAME AND STORES IT IN foundList
        List.findOne({ name: listName }, function (err, foundList) {
            if (!err) {
                // FOUND PAGE NAME DOT (PROPERTY) items (List TABLE) GETS NEW ENTERED LIST ITEM PUSHED IN ARRAY items
                foundList.items.push(item);
                // SAVE NEW DOCUMENT
                foundList.save();
                res.redirect("/" + listName);
            }
        })
    }
});


// app.post THAT PROCESSES LOGIC WHEN A REQUEST TO /delete GETS TRIGGERED FROM A POST HTML FORM - CHECKED ITEM GETS DELETED FROM Item TABLE
app.post("/delete", function (req, res) {
    // VALUE OF checkbox FROM FROM EJS PROPERTY newListItems._id IN FORM ASSIGNED TO checkedItemId VARIABLE 
    const checkedItemId = req.body.checkbox;
    // VALUE OF HIDDEN INPUT THAT HOLDS THE PAGE'S NAME
    const listName = req.body.listName;

    if (listName === "Today") {
        // MongoDB deleteOne() FUNCTION GETS EXECUTED TO DELETE ITEM WITH _id EQUAL TO checkedItemId
        Item.deleteOne({ _id: checkedItemId }, function (err) {
            if (!err) {
                console.log("Succesfully deleted the document");
                // RENDER list.ejs TO REFRESH IT'S DISPLAYED VALUES
                res.redirect("/");
            }
        });
    } else {
        // FIND ONE AND UPDATE - FIND THE DOCUMENT INSIDE OF List TABLE WITH name OF listName AND PULLS THE ONE VARIABLE FROM ARRAY items THAT HAS id OF checkedItemId , DELETES AND UPDATES IT - GIVE THIS FOUND DOCUMENT TO foundList
        List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } }, function (err, foundList) {
            if (!err) {
                res.redirect("/" + listName);
            }
        });
    }
});


// REDIRECTS TO PAGE THAT USER ENTERED AT END OF ROOT ROUTE URL PATH - CHECKS IF ENTERED LIST NAME EXISTS, IF NOT THEN CREATES DOCUMENT FOR THAT LIST WITH DEFAULT ITEMS IN IT - ELSE IT RENDERS THE list.ejs PAGE
app.get("/:customListName", function (req, res) {
    // STORES THE NAME USER ENTERED FROM req.params.listName TO customListName
    const customListName = _.capitalize(req.params.customListName);

    // FIND ONE DOCUMENT FROM List TABLE WITH PROPERTY name == customListName
    // PUT INSIDE foundList IF QUERY IS TRUE
    List.findOne({ name: customListName }, function (err, foundList) {
        if (!err) {
            // IF foundList IS EMPTY (IF EMPTY IT WILL EQUAL TO False)
            if (foundList) {
                //RENDER THE list.ejs PAGE WITH listTitle SET TO foudList.name AND newListItems SET TO foundList.items
                res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
            } else {
                // POPULATING THE List TABLE WITH name EQUAL TO customListName AND FOR items WE PUT THE DEFAULT defaultItems
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                // REDIRECTS THE USER TO THIS app.get TO REFRESH THE DATA
                res.redirect("/" + customListName);
            }
        }
    });
});


app.listen(PORT, () => {
    console.log(`server started on port ${PORT}`);
  });