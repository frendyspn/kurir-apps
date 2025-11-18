const jwt = require("jsonwebtoken");
const fs = require("fs");

const serviceAccount = JSON.parse(
  fs.readFileSync("./service-account.json", "utf8")
);

const iat = Math.floor(Date.now() / 1000);
const exp = iat + 3600;

const payload = {
  iss: serviceAccount.client_email,
  sub: serviceAccount.client_email,
  aud: "https://oauth2.googleapis.com/token",
  iat,
  exp,
  scope: "https://www.googleapis.com/auth/firebase.messaging",
};

const token = jwt.sign(payload, serviceAccount.private_key, {
  algorithm: "RS256",
});

console.log(token);
