const crypto = require('crypto');
const express = require('express');
const bodyParser = require('body-parser');
const { assert } = require('console');

const app = express();
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

const port = 3000;
app.listen(port, () => {
  console.log(`OneTimeNotes listening on port ${port}!`)
});
app.get('/', (req, res) => {
  res.sendFile('/index.html' , { root : __dirname});
});

app.post('/api/post', (req, res) => {
  const note = req.body.note;
  const link = store_note(note);
  res.send(link);
});

app.get('/api/get/:link', (req, res) => {
  const link = req.params.link;
  try {
    const note = retrieve_note(link);
    res.send(note);
  } catch (e) {
    console.error(e.message);
    res.send('Unable to retrieve this note');
  };
});

const internal_encoding = 'base64';
const external_encoding = 'utf8'
const algorithm = 'aes-256-gcm';

const link_key = crypto.randomBytes(32);
const link_iv = crypto.randomBytes(16);
const notes = {};

function encode(input) {
  return Buffer.from(input, external_encoding).toString(internal_encoding);
}

function decode(output) {
  return Buffer.from(output, internal_encoding).toString(external_encoding);
}

function encrypt(text, algorithm, key, iv) {
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const ciphertext = cipher.update(text, external_encoding, internal_encoding) 
    + cipher.final(internal_encoding);
  return ciphertext;
}

function decrypt(text, algorithm, key, iv) {
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  const plaintext = decipher.update(text, internal_encoding, external_encoding) 
    // + decipher.final(external_encoding); // works with cbc, but not gcm?
  return plaintext;
}

function store_note(note) {
  const key = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);
  const ciphertext = encrypt(note, algorithm, key, iv);
  const material = {
    key: encode(key),
    iv: encode(iv)
  };
  notes[material.iv] = ciphertext;
  const link = encode(
    encrypt(JSON.stringify(material), algorithm, link_key, link_iv)
  );
  return link;
}

function retrieve_note(link) {
  var material;
  try {
    material = JSON.parse(
      decrypt(decode(link), algorithm, link_key, link_iv)
    );
  } catch(e) {
    throw new Error(`Unable to decrypt link ${link}`);
  }
  const key = Buffer.from(material.key, internal_encoding);
  const iv = Buffer.from(material.iv, internal_encoding);
  if (material.iv in notes) {
    const cyphertext = notes[material.iv];
    const plaintext = decrypt(cyphertext, algorithm, key, iv);
    delete notes[material.iv];
    return plaintext;
  } else {
    throw new Error('This note is not indexed.');
  }; 
}

// test
const note = 'test1 test2 test3 test4 welcome to OneTimeNotes!';
console.log(note)
const link = store_note(note);
console.log(link)
const n = retrieve_note(link);
console.log(n)
assert(note == n);