// controllers/notesController.js
const { getAllNotes } = require('../models/note');
const getNotes = (req, res) => {
  const notes = getAllNotes();
  res.json(notes);
};
// ...existing code...
const getNote = (req, res) => {
  // implement logic
  res.json({}); // placeholder
};

const createNote = (req, res) => {
  // implement logic
  res.status(201).json({}); // placeholder
};

const updateNote = (req, res) => {
  // implement logic
  res.json({}); // placeholder
};

const deleteNote = (req, res) => {
  // implement logic
  res.status(204).end(); // placeholder
};

module.exports = { getNotes, getNote, createNote, updateNote, deleteNote };
