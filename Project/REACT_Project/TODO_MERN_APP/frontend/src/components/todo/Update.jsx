import React from "react";

const Update = ({ display }) => {
  return (
    <div className="p-5 d-flex justify-content-center align-items-center flex-column update">
      <h1>Update your Task</h1>
      <input type="text" className="todo-inputs my-4 w-100 p-3" name="" id="" />
      <textarea className="todo-inputs w-100 p-3" name="" id="" />
      <div>
        <button className="btn btn-dark my-4">UPDATE</button>
        <button className="btn btn-danger my-4 mx-3" onClick={() => display("none")}>Close</button>
      </div>
    </div>
  );
};

export default Update;
