import React, { useState } from "react";
import "./todo.css";
import TodoCards from "./TodoCards";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Update from "./Update";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { authActions } from "../../store";
import axios from "axios";
import { useEffect } from "react";

let id = sessionStorage.getItem("id");
const Todo = () => {
  const [Inputs, setInputs] = useState({
    title: "",
    body: "",
  });
  const [Array, setArray] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      await axios
        .get(`http://localhost:1000/api/v2/getTasks/${id}`)
        .then((response) => {
          if (response.data.list) {
            setArray(response.data.list); // <-- Add this line
          }
        });
    };
    fetch();
  }, []);

  const show = () => {
    document.getElementById("textarea").style.display = "block";
  };
  const change = (e) => {
    const { name, value } = e.target;
    setInputs({ ...Inputs, [name]: value });
  };
  const submit = async () => {
    if (Inputs.title === "" || Inputs.body === "") {
      toast.error("Title or Body should not be Empty");
    } else {
      if (id) {
        await axios
          .post("http://localhost:1000/api/v2/addTask", {
            title: Inputs.title,
            body: Inputs.body,
            id: id,
          })
          .then((response) => {
            console.log(response);
          });
        setInputs({ title: "", body: "" });
        toast.success("Task Added");
      } else {
        setArray([...Array, Inputs]);
        setInputs({ title: "", body: "" });
        toast.success("Task Added");
        toast.error("Task not added! Please SignUp");
      }
    }
  };
  const del = (id) => {
    Array.splice(id, 1);
    setArray([...Array]);
  };
  const dis = (value) => {
    document.getElementById("todo-update").style.display = value;
  };
  return (
    <>
      <div className='todo'>
        <ToastContainer />
        <div className='todo-main container d-flex justify-content-center align-items-center my-4 flex-column'>
          <div className='d-flex flex-column todo-inputs-div w-50 p-1'>
            <input
              type='text'
              placeholder='TITLE'
              className='my-2 p-2 todo-inputs'
              onClick={show}
              name='title'
              value={Inputs.title}
              onChange={change}
            />
            <textarea
              id='textarea'
              type='text'
              placeholder='BODY'
              name='body'
              className='p-2 todo-inputs'
              value={Inputs.body}
              onChange={change}
            />
          </div>
          <div className='w-50 d-flex justify-content-end my-3'>
            <button className='home-btn px-2 py-1' onClick={submit}>
              Add
            </button>
          </div>
        </div>
        <div className='todo-body'>
          <div className='container-fluid'>
            <div className='row'>
              {Array &&
                Array.map((item, index) => (
                  <div className='col-lg-3 col-10 mx-5 my-2' key={index}>
                    <TodoCards
                      title={item.title}
                      body={item.body}
                      id={index}
                      delid={del}
                      display={dis}
                    />
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
      <div className='todo-update' id='todo-update'>
        <div className='container update'>
          <Update display={dis} />
        </div>
      </div>
    </>
  );
};

export default Todo;
