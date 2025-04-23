import React from "react";

const TodoCards = ({title, body}) => {
  return (
    <div className="p-3 todo-card">
        <div>
            <h5>Heading</h5>
            <p className="todo-card-p">
              {body.split("", 77)}...
            </p>
        </div>
        <div>
        <MdDelete />
        </div>
    </div>
  );
};

export default TodoCards;
