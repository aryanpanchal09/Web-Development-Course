// models/note.js
const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/notes.json');

function getAllNotes() {
  const data = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(data);
}

// Similar functions: getNote(id), addNote(note), updateNote(id, newNote), deleteNote(id)

module.exports = { getAllNotes /* ...other exports */ };
