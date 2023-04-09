const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const multer = require("multer");
 


///genaral server

//midleware
app.use(express.json());
app.use(cors());
app.use("/uploads", express.static("uploads"));


///veryf user
function veryfiyjwt(req,res,next){
  const authHeader=req.headers.authorization
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



// genaral server
app.get("/", (req, res) => {
  res.send("omar academy is going on");
});


//data base collection
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
    const  coursCollection= client
      .db("omarAcademy")
      .collection("allCours");

    const coursVidoscollection = client
      .db("omarAcademy")
      .collection("coursVideos");
       const ordercollection=client.db("omarAcademy").collection("coursorder")

 const bookscollection=client.db("omarAcademy").collection("allbooks")
 const questionbankcollection=client.db("omarAcademy").collection("questionbanks")


//make sure  veryfyAdmin  before verifyjwt 
  const veryfiyAdmin=async(req,res,next)=>{
     const decodedEmail=req.decoded.email
     const query={email:decodedEmail}
     const user=await userCollection.findOne(query)
     if(user?.role !== "admin"){
       return res.status(403).send({message:"forbiden accees"})
     }
     next()
  }
    ///veryfy Thecher

    const verifyThecher= async(req,res,next)=>{
      const decodedEmail=req.decoded.email
      const query={email:decodedEmail}
      const user=await userCollection.findOne(query)
      if(user?.role !== "admin"){
        return res.status(403).send({message:"forbiden accees"})
      }
      next()

    }
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

//make admin
app.put("/user/admin/:id", veryfiyjwt,veryfiyAdmin, async (req,res)=>{
 
  const id=req.params.id
  const filter={_id:new ObjectId(id)}
  const option ={upsert:true}
  const updateDoc={
    $set:{
      role:"admin"
    }
  }
   const result =await userCollection.updateOne(filter,updateDoc,option)
   res.send(result);
  })
  ///check admin 

  app.get("/user/admin/:email",async(req,res)=>{
     const email=req.params.email
    const query={email}
    const   user=await userCollection.findOne(query)
     res.send({isAdmin:user?.role=== "admin"})
  })
  //check Thecher 

  app.get("/user/thecher/:email",  async(req,res)=>{
    const email=req.params.email
    const query={email}
    const   user=await userCollection.findOne(query)
     res.send({isThecher:user?.role==="thecher"})
  })
///get alluser

app.get("/alluser", veryfiyjwt,veryfiyAdmin, async(req,res)=>{
 const result =await userCollection.find({}).toArray()
 res.send(result)
})

///delet user

  app.delete("/deletuser/:id", veryfiyjwt,veryfiyAdmin, async(req,res)=>{
 const  id=req.params.id
const filter={_id:new ObjectId(id)}
const result=await userCollection.deleteOne(filter)
res.send(result)
  })

   ///add  Thecher
     
    app.put("/addThecher/:email", veryfiyjwt,veryfiyAdmin, async(req,res)=>{
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
    })

   //get thecher
    app.get("/getThecher", veryfiyjwt,veryfiyAdmin , async(req,res)=>{         
       const result=await userCollection.find({role:"thecher"}).toArray()
       res.send(result)
       })
     
   /// get  all addmin 
   app.get("/getalladmin", async(req,res)=>{        
    const result=await userCollection.find({role:"admin"}).toArray()
    res.send(result)
   })
  ////post cours  
    app.post("/savecours", async (req, res) => {
      const cours = req.body;
      const result = await coursCollection.insertOne(cours);
      res.send(result);
    });
    ///get  owener  cours filter by email
    app.get("/getTheacherCours", async (req, res) => {
    const email=req.query.email
    const filter={owner:email}
    const result = await coursCollection.find(filter).toArray();
      res.send(result);
    });

//get  all cours



  //get academic cours 
  app.get("/academic/cours",async(req,res)=>{
   const filter={coursType:"Academic"}
  const  result =await coursCollection.find(filter).toArray()
  res.send(result)
  })

  //get  univesity cours
  app.get("/university/cours",async(req,res)=>{
   const filter={coursType:"universityAdmission"}
  const  result =await coursCollection.find(filter).toArray()
  res.send(result)
  })

  //
  app.get("/jobpreparetion/cours",async(req,res)=>{
   const filter={coursType:"jobpreParetion"}
  const  result =await coursCollection.find(filter).toArray()
  res.send(result)
  })



    ///get singel cours  details
    app.get("/cours/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await coursCollection.findOne(query);
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

  


    /// post  book   
   app.post("/books", upload.single("pdf"), function (req, res) {
    const pdf = {
      title: req.file.originalname,
      url: `/uploads/${req.file.filename}`, // Set the file URL here
      mimetype: req.file.mimetype,
    };
    const keyPoint = req.body.keyPoint;
    const bookType=req.body.bookType
    const bookname=req.body.bookname
    const bookprice=req.body.bookprice
    const chapters=req.body.chapters
    const authorname=req.body.authorname
    const authorimg=req.body.authorimg
    const bookimg=req.body.bookimg
    const aboutbook=req.body.aboutbook
    const owner=req.body.owner    
   bookscollection.insertOne(
      {     keyPoint, bookType,owner, bookname, bookprice,chapters, authorname,authorimg,bookimg,aboutbook,pdf },
      function (err, result) {
        if (err) throw err;
        res.send(`${result.insertedCount} PDF uploaded`);
      }
    );
  });
  //




  ///get all books 
  app.get("/books",async(req,res)=>{
    const result=await bookscollection.find({}).toArray()
    res.send(result)
  })

///get  book by owner 

 app.get("/books/owner",async(req,res)=>{
  const email=req.query.email
  const  filter={owner:email}
  const result=await bookscollection.find(filter).toArray()
  res.send(result)
 })




    /// post question 
    app.post("/questionbank", upload.single("pdf"), function (req, res) {
      const pdf = {
        title: req.file.originalname,
        url: `/uploads/${req.file.filename}`, // Set the file URL here
        mimetype: req.file.mimetype,
      };


      const owner=req.body.owner 
      const classname=req.body.classname
      const questiontype=req.body.questiontype
      const subjectname=req.body.subjectname
   console.log(classname,questiontype,subjectname)
      
    
   questionbankcollection.insertOne(
        {  classname,questiontype,subjectname ,owner ,pdf },
        function (err, result) {
          if (err) throw err;
          res.send(`${result.insertedCount} PDF uploaded`);
        }
      );
    });
    //get question  bank filter owen email




    app.get("/questionbank/owner", async(req,res)=>{
    const email=req.query.email
    const filter={owner:email}
    const result=await questionbankcollection.find(filter).toArray()
    res.send(result)
    console.log(result)
    })






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

//




} finally {
  }
}

run().catch((err) => console.log(err));
app.use("/uploads", express.static("uploads"));
app.listen(port, (req, res) => {
  console.log(`server is running on port ${port}`);
});
