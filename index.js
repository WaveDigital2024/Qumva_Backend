const express = require('express')
const app = express()
const port = process.env.PORT || 5000;
const cors = require('cors');
require('dotenv').config()
// middleware
app.use(cors({
  origin: 'http://localhost:5173'
}))
app.use(express.json())


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://dataAdmin:ayon1234@cluster0.6rjuyq3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// mongodb+srv://dataAdmin:ayon1234@cluster0.6rjuyq3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const database = client.db("QumvaDB");
    const Taskcollections = database.collection("QumvaTasks");
    const usercollections = database.collection("Gameusers");
   
    //apis
    //userReviewGetAPI
    // Games Collections Api
    app.get('/tasks', async (req, res) => {
      const cursor = Taskcollections.find()
      const result = await cursor.toArray();
      res.send(result)
    })
   
    


   

    app.post('/users', async (req, res) => {
      const user = req.body
      const query = { email: user.email }
      const existingUser = await usercollections.findOne(query)
      if (existingUser) {
        return res.send({ message: 'user already exist', insertedId: null })
      }
      const result = await usercollections.insertOne(user)
      res.send(result)
    })
    // all users for admin
    app.get('/users', async (req, res) => {
      const cursor = usercollections.find()
      const result = await cursor.toArray();
      res.send(result)

    })
    //single user
    app.get('/users/:id', async (req, res) => {
      const email = req.params.id
      const query = { email: email };
      const user = await usercollections.find(query).toArray();
      res.send(user)

    })
    // update user make admin
    app.patch('/users/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          userRole: 'admin'
        }
      }
      const result = await usercollections.updateOne(filter, updateDoc)
      res.send(result)
    })

  

   
  
  


    
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Qumva Coin Project server is running')
})

app.listen(port, () => {
  console.log(`Server is running on ${port}`)
})  