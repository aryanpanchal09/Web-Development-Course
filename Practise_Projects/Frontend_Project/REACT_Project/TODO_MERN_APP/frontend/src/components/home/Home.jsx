import React from "react";
import "./Home.css";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  return (
    <div className="home d-flex justify-content-center align-items-center">
      <div className="container d-flex justify-content-center align-items-center flex-column">
        <h1 className="text-center">
          Stay Organized, <br />
          Stay Productive!
        </h1>
        <p>
          Manage your tasks effortlessly with our intuitive and <br />
          categorized to-do list.
        </p>
        <button class="home-btn p-2" onClick={() => navigate("/todo")}>
          Make Todo List
        </button>
      </div>
    </div>
  );
};

export default Home;
