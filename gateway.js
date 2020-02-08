const { ApolloServer } = require('apollo-server');
const { ApolloGateway, RemoteGraphQLDataSource } = require('@apollo/gateway');

// This allows Apollo Gateway to pass the Authorization header sent from the Quality Hub Core frontend to the Core backend GraphQL endpoint
class AuthenticatedDataSource extends RemoteGraphQLDataSource {
	willSendRequest({ request, context }) {
		request.http.headers.set('Authorization', context.auth);
	}
}

// This sets up Apollo Gateway to provide a single GraphQL endpoint for the listed GraphQL endpoints
const gateway = new ApolloGateway({
	serviceList: [
		{
			name: 'core',
			url: 'https://quality-hub-core-staging.herokuapp.com',
		},
		{
			name: 'interviewQ',
			url: 'https://interview-q-staging.herokuapp.com',
		},
		{
			name: 'resumeQ',
			url: 'https://qh-resumeq-practice-01.herokuapp.com',
		},
	],
	buildService({ name, url }) {
		return new AuthenticatedDataSource({ url });
	},
});

// This sets up the Gateway server for all the various front-ends to access
(async () => {
	const { schema, executor } = await gateway.load();

	const server = new ApolloServer({
		schema,
		executor,
		introspection: true,
		playground: true,
		context: ({ req }) => {
			return { auth: req.headers.authorization };
		},
	});

	const PORT = process.env.PORT || 4000;

	server.listen(PORT, () => {
		console.log(`server is listening on ${PORT}`);
	});
})();
