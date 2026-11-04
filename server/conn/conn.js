const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require("express");
const cors = require("cors");
const crypto = require('node:crypto')
const { URL } = require('node:url')

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
console.log()

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
  
  export function verifyShopifyAppProxy(req, res, next) {
    // Use the raw query string so duplicate parameters (like extra=1&extra=2)
    // are preserved. In Express, req.originalUrl includes the query string.
    const queryString = req.originalUrl.split("?")[1] ?? "";
    const params = new URLSearchParams(queryString);

    const signature = params.get("signature");
    if (!signature || !SHOPIFY_API_SECRET) {
      return res.status(403).send("Invalid Shopify signature");
    }

    params.delete("signature");

      // Group repeated keys, sort keys, join repeated values with commas,
      // then concatenate key=value pairs without separators.
      const grouped = new Map();
      for (const [key, value] of params) {
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key).push(value);
      }

      const message = [...grouped.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, values]) => `${key}=${values.join(",")}`)
        .join("");

      const calculated = crypto
        .createHmac("sha256", SHOPIFY_API_SECRET)
        .update(message)
        .digest("hex");

      // Compare safely, including when lengths differ.
      const suppliedBuffer = Buffer.from(signature, "hex");
      const calculatedBuffer = Buffer.from(calculated, "hex");

      if (
        suppliedBuffer.length !== calculatedBuffer.length ||
        !crypto.timingSafeEqual(suppliedBuffer, calculatedBuffer)
      ) {
        return res.status(403).send("Invalid Shopify signature");
      }

      next();
    }

  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    let database = await client.db("Prayers");
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    app.get('/:id', async (req, res, err) => {
      try {
        console.log('Received request:', req.body);
        let collection = await database.collection("AddressBookKeepers");
        let result = await collection.find().toArray();
        let matchingUser = result.find(occasion => occasion.id === req.params.id)
        if(matchingUser) {
          res.json(matchingUser.occasions)
        } else {
          res.send('I am not able to find your saved occasions.')
        }
      } catch(err) {
        console.error('Error fetching data:', err);
        res.status(500).send('Internal Server Error');
      }
    })


    app.patch('/:id', async (req, res) => {
      try {
        const collection = database.collection('AddressBookKeepers');

        const result = await collection.updateOne(
          { id: req.params.id },
          { $pull: { occasions: { occasion: req.body.occasion } } }
        );

        if (result.matchedCount === 0) {
          return res.status(404).send('Unable to find user');
        }

        return res.status(200).json({
          message: 'Occasion removed',
          modifiedCount: result.modifiedCount
        });
      } catch (err) {
        console.error('Error patching data:', err);
        return res.status(500).send('Internal Server Error');
      }
    });

    app.post('/occasions/:id', async (req, res) => {
      let collection = await database.collection("AddressBookKeepers");
      let presentOccasions = await collection.find().toArray();
      let matchingUser = presentOccasions.find(occasion => occasion.id === req.params.id)
      if(matchingUser) {
        return result = await collection.updateOne({id: req.params.id}, {$push: {occasions:  req.body}})
      } else {
        return result = await collection.insertOne({id: req.params.id, occasions:[req.body]});
      }
   
      res.send(result)
    })

    app.listen(app.get('port'), () => {
      console.log(`Server is running on port: ${PORT}`);
    });


  } finally {
    //Ensures that the client will close when you finish/error
    // await client.close();
  }
}

run().catch(console.dir);
