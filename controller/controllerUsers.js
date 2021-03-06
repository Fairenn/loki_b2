const model = require('../model/users');
const controller = {};
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();


function generateAccessToken(email) {
  return jwt.sign(email, process.env.TOKEN_SECRET, { expiresIn: "1d" });
}

controller.retrieveAll = async function(req, res){
    try{
        await model.findAll().then((result) => {
            if(result.length > 0){
                res.status(200).json({
                    message: 'data user berhasil didapatkan',
                    data: result
                })
            }else{
                res.status(200).json({
                    message: 'data tidak ada',
                    data: []
                })
            }
        })
    }catch(error){
        res.status(404).json({
            message: error,
        })
    }
}

controller.register = async function (req, res) {
    const { name, email, password, role } = req.body;
    const salt = await bcrypt.genSalt();
    const hashPassword = await bcrypt.hash(password, salt);
  
    const emailExist = await model.findOne({ where: { email: req.body.email } });
    if (emailExist) return res.status(400).send("Email sudah dipakai");
  
    try {
      await model.create({
        name: name,
        email: email,
        password: hashPassword,
        type: role,
      });
      res.redirect("/auth/login");
    } catch (error) {
      console.log(error);
    }
  
    //redirect ke halaman login
  };  

  controller.tampillogin = async function (req, res) {
    const role = req.cookies.role;
    if (role == "D" || role == "T") return res.redirect('/');
    
    res.render("auth-login");
  }
  
  controller.login = async function (req, res) {
    //Cek email
    const user = await model.findOne({ where: { email: req.body.email } });
    if (!user) return res.status(400).send("Pengguna tidak ditemukan");
  
    //Cek Password
    const validPass = await bcrypt.compare(req.body.password, user.password);
    if (!validPass) return res.status(400).send("Password Salah");
  
    const nama = user.name;
    const email = user.email;
    const role = user.type;
  
    const token = generateAccessToken({ email: email });
  
    await model.update(
      { remember_token: token },
      {
        where: { email: req.body.email },
      }
    );
  
    res
      .cookie("token", token, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
      })
      .cookie("role", role, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
      })
      .cookie("nama", nama, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
      })
      // .json({token})
      .redirect("/dashboardDosen");
  
  };

module.exports = controller;