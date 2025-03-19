import React from 'react';
import "./Navbar.css";
import { GiWhiteBook } from "react-icons/gi";

const Navbar = () => {
    return (
        <div>
            <nav className="navbar navbar-expand-lg">
                <div className="container">
                    <a className="navbar-brand" href="#">
                        <b><GiWhiteBook /> &nbsp; todo</b>
                    </a>
                    <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                        <span className="navbar-toggler-icon"></span>
                    </button>
                    <div className="collapse navbar-collapse" id="navbarSupportedContent">
                        <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
                            <li className="nav-item mx-1">
                                <a className="nav-link active" aria-current="page" href="#">Home</a>
                            </li>
                            <li className="nav-item mx-1">
                                <a className="nav-link active" aria-current="page" href="#">About Us</a>
                            </li>
                            <li className="nav-item mx-1">
                                <a className="nav-link active" aria-current="page" href="#">Todo</a>
                            </li>
                            <li className="nav-item mx-1">
                                <a className="nav-link active btn-nav" aria-current="page" href="#">Sign Up</a>
                            </li>
                            <li className="nav-item mx-1">
                                <a className="nav-link active btn-nav" aria-current="page" href="#">Sign In</a>
                            </li>
                            <li className="nav-item mx-1">
                                <a className="nav-link active btn-nav" aria-current="page" href="#">Logout</a>
                            </li>
                            <li className="nav-item">
                                <a className="nav-link active" aria-current="page" href="#">
                                    <img className="img-fluid user-png" src="https://www.pngitem.com/pimgs/m/24-248235_user-profile-avatar-login-account-fa-user-circle.png" alt="/" />
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>
        </div>
    );
};
export default Navbar;