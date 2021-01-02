import express from 'express';
import bodyParser from 'body-parser';
import { assert } from 'console';

import { InMemory } from './storage'


const storage = new InMemory();
const port = 3000;

const app = express();
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.listen(port, () => {
  console.log(`OneTimeNotes listening on port ${port}!`)
});

app.get('/', (req, res) => {
  res.sendFile('/assets/index.html', { root: __dirname });
});

app.post('/api/post', (req, res) => {
  const note = req.body.note;
  const link = storage.storeNote(note);
  res.send(link);
});

app.get('/api/get/:link', (req, res) => {
  const link = req.params.link;
  try {
    const note = storage.retrieveNote(link);
    res.send(note);
  } catch (e) {
    console.error(e.message);
    res.send('Unable to retrieve this note');
  };
});


// test
const note = 'It WooRRksSS!';
console.log(note)
const backend = new InMemory();
const link = backend.storeNote(note);
console.log(link)
const n = backend.retrieveNote(link);
// console.log(n)
assert(note == n);