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


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
    // API to update a task's "done" field to true
    app.patch('/completetask/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          done: true
        }
      }
      const result = await Taskcollections.updateOne(filter, updateDoc)
      res.send(result)
    })
    // --------------admin delete task--------------// 
    app.delete('/deletetask/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await Taskcollections.deleteOne(query);
      res.send(result);
    });


    
    // API to update user coin field 
    app.patch('/updateuserpoints', async (req, res) => {
      const email = req.body.email;
      const points = req.body.points;
      const filter = { email: email };
      const updateDoc = {
        $inc: { QumvaPoints: points }
      };
      const result = await usercollections.updateOne(filter, updateDoc);
      res.send(result);
    });




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


    // ---------------------Transfer Point System----------------//
    app.get('/checkpoints/:email', async (req, res) => {
      const email = req.params.email;
      const user = await usercollections.findOne({ email: email });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.send({ QumvaPoints : user.QumvaPoints });
    });

    app.patch('/transferpoints', async (req, res) => {
      const { fromEmail, toEmail, QumvaPoints } = req.body;

      // Ensure minimum transfer amount
      if (QumvaPoints < 20) {
        return res.status(400).json({ error: 'Minimum transfer amount is 20 points' });
      }

      const fromUser = await usercollections.findOne({ email: fromEmail });
      const toUser = await usercollections.findOne({ email: toEmail });

      if (!fromUser) {
        return res.status(404).json({ error: 'Sender not found' });
      }

      if (!toUser) {
        return res.status(404).json({ error: 'Recipient not found' });
      }

      if (fromUser.QumvaPoints <= 10 || fromUser.QumvaPoints < QumvaPoints) {
        return res.status(400).json({ error: 'Insufficient points to transfer' });
      }

      // Deduct points from sender
      const updateFromUser = {
        $inc: { QumvaPoints: - QumvaPoints }
      };
      await usercollections.updateOne({ email: fromEmail }, updateFromUser);

      // Add points to recipient
      const updateToUser = {
        $inc: { QumvaPoints: QumvaPoints }
      };
      await usercollections.updateOne({ email: toEmail }, updateToUser);

      res.send({ message: 'Points transferred successfully' });
    });

    //-----------------------------------------------------------//








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