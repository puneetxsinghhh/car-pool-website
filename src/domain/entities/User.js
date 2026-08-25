export default class User {
  constructor({ id = null, name, email, role}) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.role = role; 
  }
}