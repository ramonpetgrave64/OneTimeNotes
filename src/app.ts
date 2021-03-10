import express from 'express';
import { assert } from 'console';
import path from "path";

import { InMemory } from './storage'

// configuration
const storage = new InMemory();
const port = 3000;

// server
const app = express();
app.set('view engine', 'pug')
  .set('views', path.join(__dirname, 'views'))
  .use("/css", express.static(path.join(__dirname, "../node_modules/bootstrap/dist/css")))
  .listen(port, () => {
    console.log(`OneTimeNotes listening on port ${port}!`)
  })

// api
app.post('/api/note', express.urlencoded({ extended: false }), (req, res) => {
  const link = handlePostNote(req);
  res.send(link);
});

app.get('/api/note/:link', (req, res) => {
  try {
    const note = handleGetNote(req);
    res.send(note);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// pages
app.get('/', (req, res) => {
  res.render('index')
});

app.post('/note', express.urlencoded({ extended: false }), (req, res) => {
  const link = handlePostNote(req);
  res.render('link', { link: link });
});

app.get('/note/:link', (req, res) => {
  try {
    const note = handleGetNote(req);
    res.render('note', { note: note });
  } catch (e) {
    res.status(500).render('note-error', { message: e.message });
  }
});

// handlers
function handlePostNote(req: any): string {
  const note = req.body.note;
  const noteId = storage.storeNote(note);
  const link = `${req.protocol}://${req.hostname}:${port}/note/${noteId}`;
  return link
}

function handleGetNote(req: any) {
  const link = req.params.link;
  try {
    const note = storage.retrieveNote(link);
    return note
  } catch (e) {
    console.error(e.message);
    throw new Error('Error: Unable to retrieve note');
  };
}

// test
function test() {
  const text = 'my test note';
  const backend = new InMemory();
  const link = backend.storeNote(text);
  const note = backend.retrieveNote(link);
  assert(note == text);
  console.log('test passes')
}

test();