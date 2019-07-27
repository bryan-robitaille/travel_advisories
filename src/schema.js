const { gql } = require("apollo-server");

const schema = gql`

type Query {
    advisories(countryName: String!, language: String!): Advisory!
}

type Advisory {
    countryName: String,
    lastUpdated: String,
    risk: String,
    safety: [String],
    entry: [String],
    health: [String],
    laws: [String],
    climate: [String],    
}
`;

module.exports ={
    schema
}