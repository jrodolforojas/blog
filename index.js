import { gql, ApolloServer } from 'apollo-server'
import { articles } from './test-data.js'
import { getVideos } from './services/notion.js'
import 'dotenv/config'

const typeDefs = gql`
  enum Format {
    VERTICAL
    HORIZONTAL
  }
  type Video {
    id: ID!
    title: String!
    platform: [String]!
    tags: [String]!
    publishedAt: String
    link: String!
    description: String
    thumbnail: String
  }

  type Article {
    id: ID!
    title: String!
    tags: [String]!
    content: String!
    publishedAt: String!
  }

  type Query {
    videos(format: Format): [Video]!
    articles: [Article]!
  }
`

const resolvers = {
  Query: {
    videos: async (root, args) => {
      const { format } = args
      const notionVideos = await getVideos()
      if (!format) {
        return notionVideos.results.map((video) => (
          {
            id: video.id,
            title: video.properties.Name.title[0].text.content,
            platform: video.properties.Platform.multi_select.map((p) => p.name),
            tags: video.properties.Tags.multi_select.map((t) => t.name),
            publishedAt: video.properties['Publish Date']?.date?.start,
            thumbnail: video.cover?.file.url
          }))
      }

      return notionVideos.results
        .map((video) => (
          {
            id: video.id,
            title: video.properties.Name.title[0].text.content,
            platform: video.properties.Platform.multi_select.map((p) => p.name),
            tags: video.properties.Tags.multi_select.map((t) => t.name),
            publishedAt: video.properties['Publish Date']?.date?.start,
            thumbnail: video.cover?.file.url
          }))
        .filter((video) =>
          format === 'VERTICAL'
            ? !video.platform.includes('Youtube')
            : video.platform.includes('Youtube'))
    },
    articles: () => articles
  }
}

const server = new ApolloServer({ typeDefs, resolvers })

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`)
})
