require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Shortid = require('shortid');
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
  originalUrl: String,
  shortUrl: String
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
    let findOne = await Url.findOne({shortUrl: req.params.short_url});
    if(findOne){
      res.json({original_url: findOne.originalUrl,short_url: findOne.shortUrl});
    }else{
      res.json({ error: 'invalid url' });
    }
  } catch {
    res.status(401).json({error: "server or database error"});
  }
});

app.post("/api/shorturl",async (req,res)=>{
  const url = req.body.url;
  const urlCode = Shortid.generate();
  if(ValidUrl.isWebUri(url)){
    try {
      let findOne = await Url.findOne({originalUrl: url});
      if(findOne){
        res.json({original_url: findOne.originalUrl,short_url: findOne.shortUrl});
      }else{
        let new_url = new Url({
          originalUrl: url,
          shortUrl: urlCode
        });
        await new_url.save();
        res.json({original_url: new_url.originalUrl,short_url: new_url.shortUrl});
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
