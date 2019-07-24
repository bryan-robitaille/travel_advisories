const { ApolloServer, makeExecutableSchema } = require("apollo-server");
const Model= require("./schema");
const Query = require("../resolvers/resolver");

const resolvers = {
    Query
}

const schema = makeExecutableSchema({
    typeDefs: Model.schema,
    resolvers
})

const server = new ApolloServer({schema, tracing: true});

server.listen().then(({ url }) => {
    console.log(`🚀  Server ready at ${url}`);
  });