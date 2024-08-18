const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const model = require("./user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
var nodemailer = require('nodemailer');

app.use(cors());
app.use(express.json());

const dotenv = require('dotenv');
dotenv.config();

mongoose
    .connect(process.env.MONGODB, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => console.log("Mongodb Connected..."))
    .catch((err) => console.error(err));


app.get("/", async (req,res)=>{
  res.send( {advertisement : "Submitted and coded by Deepa Nandhini.M, you may send mail to my email address which is Deepa@1998"});
});

app.post("/api/register", async (req, res) => {
  const newPassword = await bcrypt.hash(req.body.password, 10);
  try {
    const user = await model.create({
      name: req.body.name,
      email: req.body.email,
      password: newPassword,
    });

    res.json({ status: "ok" });
  } catch (err) {
    res.json({ status: "Duplicate Email", error:err });
  }
});

app.post("/api/login", async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const user = await model.findOne({ email: email });

  const isPasswordValid = await bcrypt.compare(password, user.password);
  console.log(isPasswordValid);
  if (isPasswordValid) {
    const token = await jwt.sign(
      { email: user.email, name: user.name },
      "secret123"
    );

    res.json({ status: "ok", token: token });
  } else {
    res.json({ status: "Wrong Email or Password" });
  }
});

app.post("/api/dashboard", async (req, res) => {
  const token = req.headers["x-access-token"];
  const goal = req.body.tempGoal;

  const isTokenValid = await jwt.verify(token, "secret123");
  const email = isTokenValid.email;

  if (isTokenValid) {
    await model.updateOne({ email: email }, { $set: { goal: goal } });

    res.json({ status: "ok" });
  } else {
    res.json({ status: "Invalid Token" });
  }
});

app.get("/api/dashboard", async (req, res) => {
  const token = req.headers["x-access-token"];
  const isValidToken = await jwt.verify(token, "secret123");

  if (isValidToken) {
    const email = isValidToken.email;
    const user = await model.findOne({ email: email });
    res.json({ status: "ok", goal: user.goal });
  } else {
    res.json("Invalid Token");
  }
});

app.post("/api/sendMail", async (req, res) => {
  try {
    var transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAILID,
        pass: process.env.EMAILPASSWORD
      }
    });
    var mailOptions = {
      from: process.env.EMAILID,
      to: req.body.mail_to,
      subject: req.body.mail_subject,
      text: req.body.mail_message
    };
    
    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        res.json({ status: "fail" });
        console.log(error);
      } else {
        res.json({ status: "ok" });
        console.log('Email sent: ' + info.response);
      }
    });
  } catch (err) {
    console.log(err)
    res.json({ status: "Could not send mail", error:err });
  }
});

app.listen("1337", () => console.log("Server started on port 1337"));
