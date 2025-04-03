import React from 'react';
import "./signup.css";
import HeadingComp from './HeadingComp';

const Signup = () => {
  return (
    <div className="signup">
        <div className="container">
            <div className="row">
                <div className="col-lg-8 column d-flex justify-content-center align-items-center">
                    <div className="d-flex flex-column w-100 p-5">
                        <input 
                            className="p-2 my-3 input-signup"
                            type="email"
                            name="email"
                            placeholder="Enter your Email"
                        />
                        <input 
                            className="p-2 my-3 input-signup"
                            type="username"
                            name="username"
                            placeholder="Enter your Username"
                        />
                        <input 
                            className="p-2 my-3 input-signup"
                            type="password"
                            name="password"
                            placeholder="Enter your Password"
                        />
                        <button className="btn-signup p-2">Sign Up</button>
                    </div>
                </div>
                <div className="col-lg-4 column d-flex justify-content-center align-items-center">
                    <HeadingComp first="Sign" second="Up" />
                </div>
            </div>
        </div>
    </div>
  );
};

export default Signup;
