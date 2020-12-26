const express = require('express');
const app = express();
const port = 3000;

const internal_encoding = 'base64';
const external_encoding = 'utf8'

const crypto = require('crypto');
const algorithm = 'aes-256-cbc';

const bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.get('/', (req, res) => {
  res.sendFile('/index.html' , { root : __dirname});
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`)
});

const notes = {};

function store_note(note) {
  const key = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const ciphertext = cipher.update(note, external_encoding, internal_encoding) + cipher.final(internal_encoding);
  const material = {
    iv: iv.toString(internal_encoding), 
    key: key.toString(internal_encoding)
  };
  notes[material.iv] = ciphertext;
  const link = Buffer.from(JSON.stringify(material)).toString(internal_encoding);
  return link;
}

function retrieve_note(link) {
  const material = JSON.parse(Buffer.from(link, encoding=internal_encoding));
  const iv = Buffer.from(material.iv, encoding=internal_encoding);
  const key = Buffer.from(material.key, encoding=internal_encoding);
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  const cyphertext = notes[material.iv];
  const plaintext = decipher.update(cyphertext, internal_encoding, external_encoding) + decipher.final(external_encoding);
  return plaintext;
}

app.post('/api/post', (req, res) => {
  const note = req.body.note;
  const link = store_note(note);
  res.send(link);
});

app.get('/api/get/:link', (req, res) => {
  const link = req.params.link;
  note = retrieve_note(link);
  res.send(note);
});

note = 'Neque porro quisquam est qui dolorem ipsum quia dolor sit amet, consectetu';
link = store_note(note);
console.log(link)
const t = retrieve_note(link);
console.log(t)