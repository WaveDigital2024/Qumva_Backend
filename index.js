const express = require('express')
const app = express()
const port = process.env.PORT || 5000;
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config()
// middleware
app.use(cors({
  origin: 'http://localhost:5173'
}))
app.use(express.json())


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.6rjuyq3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
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
    const postcollections = database.collection("Posts");
    const otpCollection = database.collection("otps");


    console.log('Email user:', process.env.EMAIL_USER);
    console.log('Email pass:', process.env.EMAIL_PASS);

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
    app.delete('/deletepost/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await postcollections.deleteOne(query);
      res.send(result);
    });

    // ---------admin powers end-----------//

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

      res.send({ QumvaPoints: user.QumvaPoints });
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


    // -------Post Api---------------//
    app.get('/posts', async (req, res) => {
      const cursor = postcollections.find()
      const result = await cursor.toArray();
      res.send(result)
    })


    // ---------------------------------- Otp Verification Code-----------------//
    // OTP email sender function
    const sendOtp = (email, otp) => {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        secure : true ,
        port : 465,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your Qumva OTP Code',
        text: `Your OTP code is ${otp}`
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
    };

    // Register route
    app.post('/register', async (req, res) => {
      const { email, name } = req.body;
      try {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await usercollections.insertOne({ email,name, userRole: 'user', userType: 'notverified', QumvaPoints: 0 });
        await otpCollection.insertOne({ email, otp, createdAt: new Date() });
        sendOtp(email, otp);
        res.status(200).json({ message: 'User registered successfully, OTP sent to email' });
      } catch (error) {
        res.status(500).json({ error: 'Error registering user' });
      }
    });

    // Verify OTP route
    app.post('/verify-otp', async (req, res) => {
      const { email, otp } = req.body;
      try {
        const otpRecord = await otpCollection.findOne({ email, otp });
        if (!otpRecord) {
          return res.status(400).json({ error: 'Invalid OTP' });
        }
        const otpAge = (new Date() - new Date(otpRecord.createdAt)) / 1000 / 60;
        if (otpAge > 5) {
          return res.status(400).json({ error: 'OTP expired' });
        }
        await usercollections.updateOne({ email }, { $set: { userType: 'verified' } });
        await otpCollection.deleteOne({ email, otp });
        res.status(200).json({ message: 'User verified successfully' });
      } catch (error) {
        res.status(500).json({ error: 'Error verifying OTP' });
      }
    });




    // ------------------------------------------------------------------------------------------

    app.post('/google-login', async (req, res) => {
      const { email, name } = req.body;

      try {
        let user = await usercollections.findOne({ email });

        if (!user) {
          user = {
            email,
            name,
            userRole: 'user',
            userType: 'verified',
            QumvaPoints: 0,
            goldcoins: 0
          };
          await usercollections.insertOne(user);
        } else {
          await usercollections.updateOne({ email }, { $set: { userType: 'verified' } });
        }

        res.status(200).json({ message: 'Login successful', user });
      } catch (error) {
        res.status(500).json({ error: 'Error logging in with Google' });
      }
    });
    // ------------------------------------------------Otp Verification Code Ends--------------------//

     // ---------------ADMIN---------------//
     app.get('/admin', async (req, res) => {
      // prodcut info
      const cursor1 =usercollections.find()
      const user = await cursor1.toArray();
      const usercount = user.length
      //review info
      const cursor2 = Taskcollections.find()
      const task = await cursor2.toArray();
      const taskcount = task.length
      //user info
      const cursor3 = postcollections.find()
      const posts = await cursor3.toArray();
      const postscount = posts.length
      
      const Allinfo = {usercount  , taskcount , postscount }
      res.send(Allinfo)
    })
    //-----------------Admin Add Posts----------//
    app.post('/addposts', async (req, res) => {
      const post = req.body;
      const result = await postcollections.insertOne(post);
      res.send(result)
    })
    app.post('/addtask', async (req, res) => {
      const post = req.body;
      const result = await Taskcollections.insertOne(post);
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