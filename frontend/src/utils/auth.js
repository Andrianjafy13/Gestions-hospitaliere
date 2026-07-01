const AUTH_STORAGE_KEYS = [
  "token",
  "accessToken",
  "jwt",
  "authToken",
  "role",
  "userId",
  "userNom",
  "userPrenom",
  "photoProfil",
  "medecinId",
  "medecinPrenom",
  "infirmierId",
  "infirmierNom",
  "pharmatieId",
  "pharmaNom",
  "receptionnisteId",
  "receptNom",
];

export function clearAuthSession() {
  AUTH_STORAGE_KEYS.forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
}

export function logout(navigate) {
  clearAuthSession();
  navigate("/", { replace: true });
}

export function isAuthenticated() {
  return Boolean(localStorage.getItem("token") && localStorage.getItem("userId"));
}

export function getUserRole() {
  return localStorage.getItem("role");
}
