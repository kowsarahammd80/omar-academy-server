const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");

///genaral server

app.use(express.json());
app.use(cors());

//genaral server

app.get("/", (req, res) => {
  res.send("omar academy is going on");
});

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@softopark.ockrkce.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  /// user collection
  const userCollection = await client.db("omarAcademy").collection("users");

  //save-user
  app.put("/user/:email", async (req, res) => {
    const email = req.params.email;
    const information = req.body;
    const filteredUsers = { email: email };
    const option = { upsert: true };
    const upddoc = {
      $set: information,
    };

    const result = await userCollection.updateOne(
      filteredUsers,
      upddoc,
      option
    );

    res.send(result);
  });

  // update user profile

  app.put("/profile/:email", async (req, res) => {
    const email = req.params.email;
    const profilePhoto = req.body;
    const filteredUsers = { email: email };
    const option = { upsert: true };
    const upddoc = {
      $set: profilePhoto,
    };
    const result = await userCollection.updateOne(
      filteredUsers,
      upddoc,
      option
    );
    console.log(result);

    res.send(result);
  });

  //get user info

  app.get("/userinfo", async (req, res) => {
    const email = req.query.email;
    const query = { email: email };
    const result = await userCollection.findOne(query);

    res.send(result);
  });

  ////psot cours

  const academycoursCollection = client
    .db("omarAcademy")
    .collection("academycourses");

  app.post("/courses", async (req, res) => {
    const cours = req.body;
    const result = await academycoursCollection.insertOne(cours);
    res.send(result);
  });

  ///get   course

  app.get("/getcourse", async (req, res) => {
    const result = await academycoursCollection.find({}).toArray();
    res.send(result);
  });
}







run().catch((err) => console.log(err));

app.listen(port, (req, res) => {
  console.log(`server is running on port ${port}`);
});
