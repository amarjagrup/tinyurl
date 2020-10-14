//lines 2 to 15 allow the use of packages. 
const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
dotenv.config();
const port = process.env.PORT || 3000;
const app = express();
const MongoClient = require('mongodb').MongoClient;
const url = "mongodb+srv://"+`${process.env.UNAME}`+":user@cluster0.dmjg9.gcp.mongodb.net/"
+`${process.env.DATABASE}`+"?retryWrites=true&w=majority";
const multer  = require('multer');
const shortid = require("shortid");
const ejs = require('ejs');
//set the template engine to ejs
app.set('view engine', 'ejs');

app.use(express.static( path.join(__dirname, "/public")));

mongoose.connect(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('MongoDB Connected…')
})
.catch(err => console.log(err))

// const client = new MongoClient(url, { useNewUrlParser: true });
// client.connect(err => {
//   const collection = client.db("Url").collection("TinyUrl");
//   // perform actions on the collection object
//   client.close();
// });

//multer needs somewhere to store the images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, path.join(__dirname, 'public/uploads/'));
  },
  // this part keeps the orginal filename
  filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname));

  }
});

//upload a single image
const upload = multer({
  storage: storage,
  limits:{fileSize: 10000000},
  fileFilter: function(req, file, cb){
    const filetypes = /jpeg|jpg|png|gif|svg|heic|heif|webp|pdf/;
    // Check ext
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime
    const mimetype = filetypes.test(file.mimetype);
  
    if(mimetype && extname){
      return cb(null,true);
    } else {
      cb('Error: wrong file !');
    }
  }
}).single('img');


//loads index.ejs
app.get('/', (req, res) => {

  res.render('index.ejs');
});

//when upload button is hit the tinyurl and image is displayed. 
app.post('/upload', (req, res) => {
  upload(req, res, (err) => {
    if(err){
      res.render('index', {
        msg: err
      });
    } else {
      if(req.file == undefined){
        res.render('index', {
          msg: 'Error: No File Selected!'
        });
      } else {
        const userId = shortid.generate(req.file.path); 

        const img= {
          contentType: req.file.mimetype,
          originalname: req.file.originalname,
          path: req.file.path,
          tinyUrl:userId
        };
        console.log(img)
        //add data to database
        MongoClient.connect(url, {useUnifiedTopology: true}, function(err, client) {
          const db = client.db('url');
           db.collection("TinyUrl").insertOne(img, function(err, res) {
          if (err) throw err 
          client.close();
           })
        })
        
        const str = JSON.stringify(img)
        const val = JSON.parse(str)
        console.log(req.file.filename)
        res.render('index', {
          msg: 'File Uploaded!',
          file:`uploads/${req.file.filename}`,
          msg2: "orginal url is ",
          val2: `${val['path']}`,
          val: `${val['tinyUrl']}`,
          msg3: 'Tiny url is '
        });
      }
    }
  });
});
app.listen(port,() => console.log(`Listening on port ${port}...`))
