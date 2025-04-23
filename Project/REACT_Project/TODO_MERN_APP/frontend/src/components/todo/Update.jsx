import React from "react";

const Update = () => {
  return (
    <div className="p-5 d-flex justify-content-center align-items-center flex-column update">
      <h1>Update your Task</h1>
      <input type="text" className="todo-inputs my-4 w-100 p-3" name="" id="" />
      <textarea className="todo-inputs w-100 p-3" name="" id="" />
      <button className="btn btn-dark my-4">UPDATE</button>
    </div>
  );
};

export default Update;
