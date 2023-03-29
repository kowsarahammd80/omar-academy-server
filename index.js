const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const multer = require("multer");

///genaral server

app.use(express.json());
app.use(cors());
app.use("/uploads", express.static("uploads"));

function veryfiyjwt(req,res,next){

  const authHeader=req.headers.authheader
  if(!authHeader){
     return res.status(403).send("unAuthorized")
  }

  const  token=authHeader.split(" ")[1]
  jwt.verify(token,process.env.JSON_WEB_TOKEN, function(err,decoded){

    if(err){
       return res.status(403).send({massage:"forbiden"})
    }
 req.decoded=decoded
 next()

  })



}




//server  video storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

app.get("/", (req, res) => {
  res.send("omar academy is going on");
});

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@softopark.ockrkce.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  /// user collection
  try {
    const userCollection = client.db("omarAcademy").collection("users");
    const academycoursCollection = client
      .db("omarAcademy")
      .collection("academycourses");

    const coursVidoscollection = client
      .db("omarAcademy")
      .collection("coursVideos");

       const ordercollection=client.db("omarAcademy").collection("coursorder")




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



    ///veryfiy jwt  


    app.get("/jwt",async(req,res)=>{

    const email=req.query.email
     const query={email:email}
     const user=await userCollection.findOne(query)
     if(user){
       const token=jwt.sign({email},process.env.JSON_WEB_TOKEN,{expiresIn:"7d"}   )
       return res.send({accessToken: token})
     }
     res.status(403).send({accessToken:"unAthourized"})
    })























    //get user info

    app.get("/userinfo", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await userCollection.findOne(query);

      res.send(result);
    });

    ////psot cours  academic cours
    app.post("/academic", async (req, res) => {
      const cours = req.body;
      const result = await academycoursCollection.insertOne(cours);
      res.send(result);
    });

    ///get   academic cours

    app.get("/getacadmic", async (req, res) => {
      const result = await academycoursCollection.find({}).toArray();
      res.send(result);
    });
    ///get academic singel cours  details
    app.get("/academic/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await academycoursCollection.findOne(query);
      res.send(result);
      console.log(result);
    });

    //post cours  videos

    app.post("/coursvideo", upload.array("videos"), function (req, res) {
      const videos = req.files.map((file) => ({
        title: file.originalname,
        url: `/uploads/${file.filename}`, // Set the file URL here
        mimetype: file.mimetype,
      }));
      const chapterName = req.body.chapterName;
      const courseId = req.body.courseId;

      coursVidoscollection.insertOne(
        { chapterName, courseId, videos },
        function (err, result) {
          if (err) throw err;

          res.send(`${result.insertedCount} videos uploaded`);
        }
      );
    });

    //get  coursvideo
    app.get("/coursvideo/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { courseId: id };
      const result = await coursVidoscollection.find(query).toArray();
      res.send(result);
    });
  
  
  
  
  ////post  order

  app.post("/order",async(req,res)=>{
     const order=req.body
     const  result =await ordercollection.insertOne(order)
     res.send(result)
  })
  
// get order

app.get("/getorder",async(req,res)=>{
  const email=req.query.email
  const query={userEmail:email}
  const result=await ordercollection.find(query).toArray()
   res.send(result)
})


  

  
  
  
  
  
  
  
  } finally {
  }
}

run().catch((err) => console.log(err));
app.use("/uploads", express.static("uploads"));
app.listen(port, (req, res) => {
  console.log(`server is running on port ${port}`);
});
