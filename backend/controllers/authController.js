import User from "../models/Users.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// code pour l'inscription
export const register = async (req, res) => {

  try {

    const { nom, prenom, email, password, role } = req.body;

    if (!nom || !prenom || !email || !password || !role) {
      return res.status(400).json({
        message: "Tous les champs sont obligatoires"
      });
    }

    const existUser = await User.findOne({
      where: { email }
    });

    if (existUser) {
      return res.status(400).json({
        message: "Cet email existe déjà"
      });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      nom,
      prenom,
      email,
      password: hash,
      role
    });

    res.status(201).json({
      message: "Utilisateur bien inscrit",
      user
    });

  } catch (error) {

    console.error(error);   // IMPORTANT pour voir l'erreur

    res.status(500).json({
      message: "Erreur serveur"
    });

  }
};


export const login = async (req, res) => {

    try {

      const { email, password } = req.body;

      const user = await User.findOne({
        where: { email }
      });

      if (!user) {
        return res.status(404).json({
        message: "Utilisateur non trouvé"
      });
      }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({
      message: "Mot de passe incorrect"
      });
    }

    const token = jwt.sign(
    {
      id: user.id,
      role: user.role
    },
      "SECRET_KEY",
      { expiresIn: "1d" }
    );

    res.json({
      message: "Connexion réussie",
      token,
      user: {
      id: user.id,
      name: user.name,
      prenom: user.prenom,
      role: user.role
      }
    });

    } catch (error) {

      console.log(error); // important pour debug

      res.status(500).json({
      message: "Erreur serveur"
    });

    }

};