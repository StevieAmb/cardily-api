const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require("express");
const cors = require("cors");

const dotenv = require('dotenv');
dotenv.config();

const app = express();

app.use(cors()); 
app.use(express.json());

// Global error handling
app.use(function (err, req, res, next) {
  console.log(`Error message: ${err.message}`);
  console.log(`Request body: ${JSON.stringify(req.body)}`);
  console.error(err);
  res.status(err.statusCode || 500).send('Internal Server Error');
});

const PORT = process.env.PORT

app.set('port', PORT || 3001);

const uri = `mongodb+srv://sambroise_db_user:${process.env.MONGODB_PW}@unfoldingpathsprayerwal.k6eqjcr.mongodb.net/?appName=UnfoldingPathsPrayerWall`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
    useUnifiedTopology: true
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    let database = await client.db("Prayers");
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    app.get('/', async (req, res, err) => {
      try {
        console.log('Received request:', req.body);
        let collection = await database.collection("AddressBookKeepers");
        let result = await collection.find().toArray();
        res.json(result)
      } catch(err) {
        console.error('Error fetching data:', err);
        res.status(500).send('Internal Server Error');
      }
    })

    app.post('/occasions', async (req, res) => {
      console.log('Received request:', req.body);
      let collection = await database.collection("AddressBookKeepers");
      let result = await collection.insertOne(req.body);
      res.send(result)
    })

    app.listen(app.get('port'), () => {
      console.log(`Server is running on port: ${PORT}`);
    });


  } finally {
    //Ensures that the client will close when you finish/error
    await client.close();
  }
}

run().catch(console.dir);


//PSEUDOCODE

//The post request takes in the customer ID, and then posts the data with that
//customer ID. When the user wants to add something to their address book, the
//API needs to... find the user's customer ID, and then update the ARRAY section
//of the data. Match the ID to one in the database, and then update
//the array. So the user is connected to the DB, and they made one post.
//They go to post again... If they go to post again, the post method needs to
//check their idea, so there needs to be an if statement that checks if their id
//exists (in the post method) and if it does, it just needs to push the data into the 
//array. Outside of the if statement, it posts the ID and the array of info.

//Does it need to iterate through every customer in the collection to find
//the ID? So there needs to be an iterator method. Maybe a .find() iterator
//To find the ID, and then if it's true, then push the data into the occasion array


//The get request needs to take in the ID, too, so it knows which one to get? Or it gets all of them
//And then the filtering happens on the front end?