const express = require('express');
const app = express();
const port = 3000;

const crypto = require('crypto');
const algorithm = 'aes-256-cbc';
const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);
const data_iv = crypto.randomBytes(16);
const cipher = crypto.createCipheriv(algorithm, key, iv);
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

function encrypt_note(note) {
  const data_key = crypto.randomBytes(32);
  const cipher = crypto.createCipheriv(algorithm, data_key, data_iv);
  let ciphertext = cipher.update(note, 'utf8', 'hex') + cipher.final('hex');
  return {
    'data_key' : data_key.toString('hex'),
    'ciphertext' : ciphertext
  }
}

function decrypt_note(data_key) {
  const data_key_buffer = Buffer.from(data_key, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, data_key_buffer, data_iv);
  const cyphertext = notes[data_key];
  const plaintext = decipher.update(cyphertext, 'hex', 'utf8') + decipher.final('utf8');
  return plaintext;
}

app.post('/api/post', (req, res) => {
  const note = req.body.note
  const { data_key, ciphertext } = encrypt_note(note)
  notes[data_key] = ciphertext;
  res.send(data_key);
  console.log(notes)
});

app.get('/api/get/:id', (req, res) => {
  const id = req.params.id;
  note = decrypt_note(id);
  res.send(note);
});