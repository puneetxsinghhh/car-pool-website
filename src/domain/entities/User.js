export default class User {
  constructor({ id = null, clerkUserId = null, name, email, role}) {
    this.id = id;
    this.clerkUserId = clerkUserId;
    this.name = name;
    this.email = email;
    this.role = role; 
  }
}
