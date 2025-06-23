import React from "react";
import "./Navbar.css";
import { GiWhiteBook } from "react-icons/gi";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { authActions } from "../../store";
import { RiContactsBook2Fill } from "react-icons/ri";

const Navbar = () => {
  const isLoggedIn = useSelector((state) => state.isLoggedIn);
  const dispatch = useDispatch();
  const logout = () => {
    sessionStorage.clear("id");
    dispatch(authActions.logout());
  };
  return (
    <div>
      <nav className="navbar navbar-expand-lg">
        <div className="container">
          <Link className="navbar-brand" to="/">
            <b>
              <GiWhiteBook /> &nbsp; todo
            </b>
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarSupportedContent"
            aria-controls="navbarSupportedContent"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarSupportedContent">
            <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
              <li className="nav-item mx-1">
                <Link className="nav-link active" aria-current="page" to="/">
                  Home
                </Link>
              </li>
              <li className="nav-item mx-1">
                <Link
                  className="nav-link active"
                  aria-current="page"
                  to="/about"
                >
                  About Us
                </Link>
              </li>
              <li className="nav-item mx-1">
                <Link
                  className="nav-link active"
                  aria-current="page"
                  to="/todo"
                >
                  Todo
                </Link>
              </li>
              {!isLoggedIn && (
                <>
                  <div className="d-flex">
                    <li className="nav-item mx-1">
                      <Link
                        className="nav-link active btn-nav p-2"
                        aria-current="page"
                        to="/signup"
                      >
                        Sign Up
                      </Link>
                    </li>
                  </div>
                  <div className="d-flex my-lg-0 my-2">
                    <li className="nav-item mx-1">
                      <Link
                        className="nav-link active btn-nav p-2"
                        aria-current="page"
                        to="/signin"
                      >
                        Sign In
                      </Link>
                    </li>
                  </div>
                </>
              )}
              {isLoggedIn && (
                <div className="d-flex">
                  <li className="nav-item mx-1" onClick={logout}>
                    <Link
                      className="nav-link active btn-nav p-2"
                      aria-current="page"
                      to="#"
                    >
                      Log Out
                    </Link>
                  </li>
                </div>
              )}
              <li className="nav-item">
                <Link className="nav-link active" aria-current="page" to="#">
                  <img
                    className="img-fluid user-png"
                    src="https://www.pngitem.com/pimgs/m/24-248235_user-profile-avatar-login-account-fa-user-circle.png"
                    alt="/"
                  />
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </div>
  );
};
export default Navbar;
