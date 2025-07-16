// src/App.js
import React, { useState } from "react";
import "./App.css";

function App() {
  const [task, setTask] = useState("");
  const [todos, setTodos] = useState([]);

  const addTask = () => {
    if (task.trim() === "") return;
    setTodos([...todos, task]);
    setTask("");
  };

  const deleteTask = (index) => {
    const newTodos = todos.filter((_, i) => i !== index);
    setTodos(newTodos);
  };

  return (
    <div className='App'>
      <h1>Simple ToDo App</h1>
      <div>
        <input
          type='text'
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder='Enter a task'
        />
        <button onClick={addTask}>Add</button>
      </div>
      <ul>
        {todos.map((item, index) => (
          <li key={index}>
            {item}
            <button onClick={() => deleteTask(index)}>❌</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
