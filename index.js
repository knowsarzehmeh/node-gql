import { loadFiles } from "@graphql-tools/load-files";
import { createServer, createPubSub } from "graphql-yoga";
import { uuid } from "uuidv4";

import Subscription from "./src/resolvers/subscription";
import { data } from "./src/datastore";

const pubSub = createPubSub();

// Resolver for Queries

const resolvers = {
  Query: {
    hello: () => {
      return "Hello World";
    },
    product: () => {
      return {
        id: 1,
        title: "Nike Footwear",
        price: 23.5,
        releaseYear: 2022,
        rating: 4.5,
        inStock: true,
      };
    },
    greeting: (parent, args, ctx, info) => {
      if (args && args.name) return args.name;
    },
    me: (_, args) => {
      if (args) {
        const me = data.users.find((user) => user.id === +args.id);
        if (!me) return "User not found!";
        return me;
      }
    },
    users: () => {
      return data.users;
    },
    posts: () => {
      return data.posts;
    },
  },
  Mutation: {
    createUser(parent, args, ctx, info) {
      const emailTaken = data.users.some(
        (user) => user.email.toLowerCase() === args.email.toLowerCase()
      );
      if (emailTaken) throw new Error("Email already exist");
      const newUser = {
        id: uuid(),
        name: args.name,
        email: args.email,
        age: args.age,
      };
      data.users.push(newUser);

      return newUser;
    },
    createPost(parent, args, ctx, info) {
      const userExists = data.users.some((user) => user.id === args.author);
      if (!userExists) {
        throw new Error("User not found");
      }
      const post = {
        id: uuid(),
        title: args.title,
        body: args.body,
        published: args.published,
        author: args.author,
      };
      posts.push(post);
      return post;
    },
    deleteUser(parent, args, ctx, info) {
      let comments;
      const userIndex = data.users.findIndex((user) => user.id === args.id);
      if (userIndex === -1) {
        throw new Error("User not found");
      }
      const deletedUsers = data.users.splice(userIndex, 1);
      posts = data.posts.filter((post) => {
        const match = post.author === args.id;
        if (match) {
          comments = comments.filter((comment) => comment.post !== post.id);
        }

        return !match;
      });

      comments = comments.filter((comment) => comment.author !== args.id);

      return deletedUsers[0];
    },

    updateUser(parent, args, { db }, info) {
      const { id, data } = args;
      const user = db.users.find((user) => user.id === id);
      if (!user) {
        throw new Error("User not found");
      }

      if (typeof data.email === "string") {
        const emailTaken = db.users.some((user) => user.email === data.email);

        if (emailTaken) {
          throw new Error("Email taken");
        }
        user.email = data.email;
      }

      if (typeof data.name === "string") {
        user.name = data.name;
      }

      if (typeof data.age !== "undefined") {
        user.age = data.age;
      }
      return user;
    },
  },
  Subscription,
  Post: {
    author: (parent, args, ctx, info) => {
      return data.users.find((user) => user.id === parent.author);
    },
  },
  User: {
    posts: (parent, args, ctx, info) => {
      return data.posts.filter((post) => post.author === parent.id);
    },
  },
};

async function main() {
  const server = createServer({
    schema: {
      typeDefs: await loadFiles("./src/typeDefs/*.graphql"),
      resolvers,
    },
    context: {
      db: data,
      pubSub,
    },
  });

  server.start(() => {
    console.log("The server is up");
  });
}

main();
