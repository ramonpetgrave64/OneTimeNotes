const express = require('express');
const app = express();
const port = 3000;

const internal_encoding = 'base64';
const external_encoding = 'utf'

const crypto = require('crypto');
const algorithm = 'aes-256-cbc';
// const key = crypto.randomBytes(32);
// const iv = crypto.randomBytes(16);
const data_iv = crypto.randomBytes(16);
// const cipher = crypto.createCipheriv(algorithm, key, iv);
// let encrypted = cipher.update('1234567890123401234567', 'utf8', 'hex');
// console.log(key, iv);
// console.log(cipher);
// console.log(encrypted);
// encrypted += cipher.final('hex');
// console.log(encrypted);
// const decipher = crypto.createDecipheriv(algorithm, key, iv);
// let decrypted = decipher.update(encrypted, 'hex', 'utf8');
// console.log(decrypted);
// decrypted += decipher.final('utf8');
// console.log(decrypted)

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

function get_encrypted_note(note) {
  const data_key = crypto.randomBytes(32);
  const data_iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, data_key, data_iv);
  let ciphertext = cipher.update(note, external_encoding, internal_encoding) + cipher.final(internal_encoding);
  return {
    iv : data_iv.toString(internal_encoding),
    key : data_key.toString(internal_encoding),
    ciphertext : ciphertext,
  }
}

function get_decrypted_note(data_key) {
  const data_key_buffer = Buffer.from(data_key, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, data_key_buffer, data_iv);
  const cyphertext = notes[data_key];
  const plaintext = decipher.update(cyphertext, 'hex', 'utf8') + decipher.final('utf8');
  return plaintext;
}

function store_note(note) {
  const key = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);
  console.log(iv)
  console.log(key)

  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const ciphertext = cipher.update(note, external_encoding, internal_encoding) + cipher.final(internal_encoding);
  const material = {
    iv: iv.toString(internal_encoding), 
    key: key.toString(internal_encoding)
  };
  notes[material.iv] = ciphertext;
  console.log(material);
  const link = Buffer.from(JSON.stringify(material)).toString(internal_encoding);
  return link;
}

function retrieve_note(link) {
  const material = JSON.parse(Buffer.from(link, encoding=internal_encoding));
  console.log(material);
  const iv = Buffer.from(material.iv, encoding=internal_encoding);
  console.log(iv)
  const key = Buffer.from(material.key, encoding=internal_encoding);
  console.log(key)
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  const cyphertext = notes[material.iv];
  console.log(cyphertext)
  const plaintext = decipher.update(cyphertext, internal_encoding, external_encoding) + decipher.final(external_encoding);
  return plaintext;
}

app.post('/api/post', (req, res) => {
  const note = req.body.note;
  link = store_note(note);
  res.send(note);
});

app.get('/api/get/:id', (req, res) => {
  const id = req.params.id;
  note = get_decrypted_note(id);
  res.send(note);
});

// note = '';
// link = store_note(note);
// console.log(notes)
// const t = retrieve_note(link);
// console.log(t)