export interface User {
    name: { title: string, first: string, last: string },
    gender: string,
    email: string,
  }

  export interface SearchUser {
    name: string,
    gender: string,
    email: string,
  }