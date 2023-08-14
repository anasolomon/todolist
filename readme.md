## Connecting Express to MongoDB
I've create a simple to do list app.  
It catches user input from a *form* throught the usage of external module **body-parser** and updates the the list using another external module called **EJS**.  
I'm created a new Schema for the item list 
```js
const itemsSchema = new mongoose.Schema({
    name: {
        type: String,
        required : [true, 'Please enter a string']
    }
});
```
I declared the mongoose model and populated it's table :
```js
const Item = mongoose.model("Item", itemsSchema);
const item1 = new Item({
    name: "Buy Cat Food",
    name: "Cook the Cat Food",
    name: "Serve my Cat the Cat Food"
})
item1.save();
```
which means i dont need to declare them as a javascript array anymore so I deleted/commented out :
```js
//const items = ["Buy Cat Food", "Cook the Cat Food", "Serve my Cat the Cat Food"];
// const workItems = [];
```
I've inserted the default items into the items table : 
```js
const defaultItems = [item1, item2, item3];
Item.insertMany(defaultItems, function(err){
      if(err){
        console.log(err)
      } else{
        console.log("Succesfully saved all the items to the todolistDB")
      }
});
```
To show the documents in my items table I used the find() function and assigned the found value 
```js
app.get("/", function(req, res){ 

    Item.find( function(err, foundItems){
        if(err){
          console.log(err);
        } else {
          mongoose.connection.close();
            res.render("list", {listTitle: "Today", newListItems: foundItems});
        }
    });
    
});
```
Updated the for loop of the `newListItems` EJS scriptlet inside of the list.ejs html.  
Now it will only display the name of an item from the table we've looped through instead of displaying the id and other data. 
```html
<% for (let i = 0; i < newListItems.length; i++) { %>
            <div class="item">
                <input type="checkbox">
                 <p><%= newListItems[i].name %></p> 
            </div>
         <% } %>
```
Decided to transform the for loop into a forEach loop for better code readibility : 
```html
<% newListItems.forEach(function(item){ %>
            <div class="item">
                <input type="checkbox">
                 <p><%= item.name %></p>
            </div>
         <% }); %>
```
To prevent the table from being populated over and over again by the same items everytime I restart my server or refresh the page I wrote an if statement that checks if the table is empty, if yes then it will insert the default items into the table else it will render/display the list page with it's EJS. I also redirected the user again to the root route so the items can be displayed proprely since you cannot render the `newListItems` twice in the same `app.get()`: 
```js
app.get("/", function(req, res){ 

    Item.find( function(err, foundItems){
        if (foundItems.length === 0){
            Item.insertMany(defaultItems, function(err){
                if(err){
                  console.log(err)
                } else{
                  console.log("Succesfully saved all the items to the todolistDB")
                }
            });
            res.redirect("/");
        } else {
            res.render("list", {listTitle: "Today", newListItems: foundItems});
        }
    });
});
```
To items to add to the list from user input in the form we need to change our old EJS code :
```js
app.post("/", function(req, res){

  const item = req.body.newItem;
    if(req.body.list === "Work"){ //Work (List)
        workItems.push(item);
        res.redirect("/work");
    } else{
            items.push(item);
        
            res.redirect("/");
    }
});
```
into this working MongoDB code : 
```js
app.post("/", function(req, res){

  const itemName = req.body.newItem;

   const item = new Item ({
        name: itemName
   });
   item.save();

   res.redirect("/");

});
```


In order to be able to delete an item when it gets checked I'm going to wrap the html checkbox element into a form so I can tap into the input's data from the form with an app.post() function.  
Because adding a submit button instead of the checkbox element would look ugly I'm going to add a little Javascript `onChange="this.form.submit()"` that gives the same purpose as the submit button to my input type in the form : 
```html
 <% newListItems.forEach(function(item){ %>
            <form action="/delete" method="POST">
               <div class="item">
                  <input type="checkbox" name="checkbox" value="<%=item._id%>" onChange="this.form.submit()">
                  <p><%= item.name %></p>
               </div>
            </form>
         <% }); %>
```

Will be using the Mongoose API method deleteOne.  
You can also use the [findByIdAndRemove()](https://mongoosejs.com/docs/api/model.html#Model.findByIdAndRemove()) method if you want.
```js
// app.post THAT PROCESSES LOGIC WHEN A REQUEST TO /delete GETS TRIGGERED
app.post("/delete", function(req, res){
    // VALUE OF checkbox FROM form ASSIGNED TO checkedItemId
    const checkedItemId = req.body.checkbox;

    //MongoDB deleteOne() FUNCTION GETS EXECUTED TO DELETE ITEM WITH _id EQUAL TO checkedItemId
    Item.deleteOne({ _id: checkedItemId}, function(err){
    if(err){
        console.log(err);
    } else {
        console.log("Succesfully deleted the document");
        //REDIRECT/REFRESH TO PAGE DISPLAYING items
        res.redirect("/");
    }
    });
});
```


  
## Creating Dynamic Lists
Making a new schema for a new table called List that will be associated with the Item table and will store the custom user inpputed list name in `name` and store the defaultItems array in itemsSchema.
```js
const listSchema = new mongoose.Schema({
    name: String,
    items: [itemsSchema]
});
const List = mongoose.model("List", listSchema);
```
In the code above I have declared `items` as an **array** data type because I already know that I want to store the default documents which are stored in `defaultItems` which is an array and to make this relationship between Tables I put in the `itemsSchema` belonging to the Item table.  


To store a string entered after our root route at the end of the url I used Express' property "\:listName" and tapped into that information through `req.params.listName`.  
I stored the user entered name to a constant called `customListName`.  
I created a new document for the table List in which : 
 1. I passed `customListName`'s value to the document's name property;
 2. I passed the values from `defaultItems`'s array to the document's property 'items';
 3. saved the newly created document.
```js
app.get("/:listName", function(req, res){
    const customListName = req.params.listName;

    const list = new List ({
    name: customListName,
    items: defaultItems
    });
    list.save();
});
```
The issue with that code is that everytime I would enter a new page name it would be saved again every single time.   
To fix it I made an if statement that checks if the list name entered already exists and if it does it will display the list page and if it doesn't then it will get created.  
I used the `find()` mongoose API method  : 
```js
app.get("/:customListName", function(req, res){
 // STORES THE NAME USER ENTERED FROM req.params.listName TO customListName
    const customListName = req.params.customListName;

  //FIND ONE DOCUMENT FROM List TABLE WITH PROPERTY name == customListName
  //PUT INSIDE foundList IF QUERY IS TRUE
    List.findOne({ name: customListName}, function(err, foundList){
        if(!err){
         //IF foundList ISNT EMPTY (IF EMPTY IT WILL EQUAL TO False)
           if(!foundList){
            console.log("Doesn't exist");
        // POPULATING THE List TABLE WITH name EQUAL TO customListName AND FOR items WE PUT THE DEFAULT defaultItems
            const list = new List ({
            name: customListName,
            items: defaultItems
            });
            list.save();
            res.redirect("/" + customListName); 
           }
           else{
            console.log("Exist");
          //RENDER THE list.ejs PAGE WITH listTitle SET TO foudList.name AND newListItems SET TO foundList.items
            res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
           }
        }
    });
});
```
The code above:
 - Stores the name the user has entered at the end of the root route url by using Express' `req.params` and stores it inside of a constant `customListName`
 - Uses `findOne()` mongoose method to find a document that has property name the same as `customListName` (user entered name), if the query will be equal to true then the document will be stored inside of `foundList` if not then `foundList` will be set equal to False by default
 - If there are no errors and the `foundList` is False it console logs *"Doesn't exist"* and it creates a new document for the table 'List' with property `name = customListName` and `items = defaultItems`. It also saves the new document and redirects the user back to the app.get "\:customListName" to refresh and display the new data.
 - If there are no erros and the `foundList` is not equal to False then it will render our list.ejs page with EJS properties `listTitle = foundList.name` and `newListItems = foudnList.items`.  

## Adding to do list items to New Lists
To add items specifically only to the newly create list page I :
 - passed the value of the current page name to the "+" submit button so when the user clicks it I get back as a value of + button which page they are on 
```html
<button type="submit" name="list" value=<%=listTitle %>>+</button>
```
The "+" submit button is inside of a form that has `action = "/"` to the root route. Therefore the code to be edited is in the `app.post("/")` : 
```js
app.post("/", function (req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    if (listName === "Today") {
        item.save();
        res.redirect("/");
    } else {
        List.foundOne({ name: listName }, function (err, foundList) {
            if (!err) {
                foundList.items.push(item);
                foundList.save();
                res.redirect("/" + listName);
            }
        })
    }
});
```
Explanation of the code above : 
 - We are saving the name of the page the user is currently in the moment they click on the "+" submit button to add a new item
   - There is an existing Document inside of the List table already with the page's name. If we tap into the page's name we can use it to make changes to that Document as well since they share the same name
 - We are creating a document that stores the newly entered to do list item inside of a new Document called item inside of the Item table
 - We are checking to see If the newly entered to do list item matches the word "Today", if it does that means we are in the "Today" list and all we want to do at that point is to save the new Document and redirect the user to the `app.post("/")` to render the new items onto the `list.ejs` page
 - Else it will try to find one Document that matches the page's name and pass it's value in a object we called `foundList`. 
   - We push the newly created `item` Document into the Document that resides inside the List table that has the page's name and we are going to store it inside of it's array `items` property which has a relationship with the Item table and accepts it's Documents.
   - Finally we save the changes for this Document with the page's name and redirect the user towards the app.get("/:customListName") which will be the name of the page they have entered

## Deleting to do list Items From the New Lists
The form that we are using for crossing off an item from the list redirects to the app.post("/delete") and the submit button that triggers this is the checkbox the user clicks to cross off an item. That checkbox already has a value therefore we cannot give it more. In this case we'll be using an [hidden input](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/hidden) that will carry the page's name :  
```html
 <% newListItems.forEach(function(item){ %>
         <form action="/delete" method="POST">
            <div class="item">
               <input type="checkbox" name="checkbox" value="<%=item._id%>" onChange="this.form.submit()">
               <p>
                  <%= item.name %>
               </p>
            </div>
            <input type="hidden" name="listName" value="<%=listTitle%>"> </input>
         </form>
         <% }); %>
```
To delete an item from the List table it will be harder because each of it's Documents has a schema with an array. To find an item in those arrays easily we can use the MongoDB's [$pull](https://www.mongodb.com/docs/manual/reference/operator/update/pull/) property :  
```js
app.post("/delete", function (req, res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
        Item.deleteOne({ _id: checkedItemId }, function (err) {
            if (!err) {
                console.log("Succesfully deleted the document");
                res.redirect("/");
            }
        });
    } else {
        List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } }, function (err, foundList) {
            if (!err) {
                res.redirect("/" + listName);
            }
        });
    }
});
```
In this updated code version of the `app.post` for the /delete route we : 
 - Store the checkbox's value (item being crossed's id) and put it in the checkedItemId constant;
 - Store the hitten input's value (current page's name) and store it in listName;
 - We check to see if the page's name corrisponds to "Today"
   - If yes then we trigger the deleteOne() method which targets the Item table and deletes the Document whose id corrisponds to checkedItemId
   - User gets redirected to the root route
 - Else we use the `findOneAndUpdate()` method which targets the **`List`** table and finds the Documents whose `name` corrisponds to `listName` and through the use of the MongoDB operator `$pull` we find the        specific item from the `items` array and delete it. Then our List table gets updated. If no error found then user gets redirected to his `app.get("/:customListName")`


The only issue with this code left is that if we enter a new list called "Home" then it will be a completely different list than lower case "home". To fix this we'll be installing the `lodash` [package](https://lodash.com/docs/4.17.15). Specifically the [capitalize()](https://lodash.com/docs/4.17.15#capitalize) function from lodash which capitalizes the first letter of a word and lower cases the rest : 
```js
const checkedItemId = _capitalize(req.body.checkbox);
```





















## What I learned
You can specify for a certain CSS rule to apply only to a html element that has a specific class name like this
```css
form.item {
  text-align: center;
  margin-left: 20px;
}
```
This CSS rule will only apply to a form with the class of item. 

<hr>

You can only use the res.render() only once per app.get or app.post so in order to update/render the page when a certain block of code is done modifying already existing data and you wish for it to be updated on the res.render page too then you have to redirect the user from the page affecting the data to the a block of code where res.render() with the ejs page displaying that information. :
```js
app.get("/", function(req, res){ 

    Item.find( function(err, foundItems){
        if (foundItems.length === 0){
            Item.insertMany(defaultItems, function(err){
                if(err){
                  console.log(err)
                } else{
                  console.log("Succesfully saved all the items to the todolistDB")
                }
            });
            res.redirect("/");
        } else {
            res.render("list", {listTitle: "Today", newListItems: foundItems});
        }
    });
});
```
In the code above the rendered page "list".ejs will only display one time when the user goes in the root route of our server. The dynamic data "newListItems" will change in case our if statement is true. If we do not redirect to the root route again then the data for "newListItems" will be updated and stored in memory but will not be displayed on the "list".ejs page.  

<hr>

You can add `onChange="this.form.submit()"` to any input types in the html form and they will serve as the submit button when clicked. 
```js
<input type="checkbox" onChange="this.form.submit()">
```

<hr>

When you only have one item to save into a table it's more convinient to just use `item_name.save();`.  
When you have multiple ones it's more convinient to use "insertMany()". Note how in `app.post` we use `item_name.save()` because every new item gets automatically created individually. 
```js
app.post("/", function(req, res){
  // USER ENTERED LIST ITEM THROUGH THE HTML FORM COUGHT WITH body-parser'S METHODS
  const itemName = req.body.newItem;

  //CREATE A NEW ROW WITH PROPERTY name EQUAL TO itemName
   const item = new Item ({
        name: itemName
   });
   // SAVE THAT ROW INTO THE TABLE
   item.save();

   //REDIRECT USER TO ROOT ROUTE TO REFRESH/RENDER list.ejs
   res.redirect("/");
});
```
Meanwhile for the first 3 default items' insertion into the Table I used the `insertMany()` method. 
```js
const item1 = new Item({
    name: "Welcome to your todolist!"
});
const item2 = new Item({
    name: "Hit the + button to add a new item."
});
const item3 = new Item({
    name: "<-- Hit this to delete an item."
});
// INSERTING THE ITEMS INTO AN ARRAY
const defaultItems = [item1, item2, item3];


app.get("/", function(req, res){ 

    //find() FOR foundItems. WILL LOOK THROUGH THE DOCUMENTS IN Item table
    Item.find({}, function(err, foundItems){
        // IF foundItems from Item's IS EQUAL TO 0 (EMPTY) THEN EXECUTE insertMany() METHOD
        if (foundItems.length === 0){
            //INSERTS THE defaultItems ARRAY CONTAINING THE DEFAULT ITEMS INTO THE TABLE
            Item.insertMany(defaultItems, function(err){
                if(err){
                  console.log(err)
                } else{
                  console.log("Succesfully saved the default items to the todolistDB")
                }
            });
            // MUST REDIRECT USER TO REFRESH/RENDER THE DATA
            res.redirect("/");
        } else {
            // RENDERS THE list.ejs PAGE WITH SCRIPTLETS listTitle EQUAL TO "Today" AND 
            //newListItems EQUAL TO foundItems
            res.render("list", {listTitle: "Today", newListItems: foundItems});
        }
    });
});
```
<hr>

With body-parser always use `console.log(req.body)` on a new `app.post` trying to access information from a html form to see what is being submitted and it's attributes in detail, this way you know what you can tap into to manipulate that piece of data.  

<hr>

Table.find({}, function(err, itemsFound){}); gives back an array of itemsFound but Table.findOne({}, function(err, itemFound){}); gives only one document back in "itemFound"

<hr>

Use the [$pull](https://www.mongodb.com/docs/manual/reference/operator/update/pull/) (MongoDB operator) to find a specific item from an array and delete it:
```js
$pull: { items: { _id: checkedItemId } }
```

<hr>

You can use the `lodash` package's [capitalize()](https://lodash.com/docs/4.17.15#capitalize) function to force a string to have it's first letter capitalized and the following letters lower case no matter what it used to be before.