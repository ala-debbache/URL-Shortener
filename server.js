require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const ValidUrl = require('valid-url');
const mongodb = require('mongodb');
const mongoose = require('mongoose');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI);
// console.log(mongoose.connection.readyState);
const { Schema } = mongoose;

const urlSchema = new Schema({
  original_url: String,
  short_url: Number
});

const Url = mongoose.model("Url",urlSchema);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.get("/api/shorturl/:short_url?",async (req,res)=>{
  try {
    let findOne = await Url.findOne({short_url: req.params.short_url});
    if(findOne){
      res.redirect(findOne.original_url);
    }else{
      res.json({ error: 'invalid url' });
    }
  } catch {
    res.status(401).json({error: "server or database error"});
  }
});

app.post("/api/shorturl",async (req,res)=>{
  const url = req.body.url;
  if(ValidUrl.isWebUri(url)){
    try {
      let findOne = await Url.findOne({original_url: url});
      if(findOne){
        res.json({original_url: findOne.original_url,short_url: findOne.short_url});
      }else{
        let count = await Url.countDocuments();
        let new_url = new Url({
          original_url: url,
          short_url: count+1
        });
        await new_url.save();
        res.json({original_url: new_url.original_url,short_url: new_url.short_url});
      }
    } catch {
      res.status(401).json({error: "server or database error"});
    }
  }else{
    res.json({ error: 'invalid url' });
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
