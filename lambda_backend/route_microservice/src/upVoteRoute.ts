import { Handler } from 'aws-lambda';
import DynamoDB, { AttributeValue, UpdateItemInput } from 'aws-sdk/clients/dynamodb';
import {
  getMiddlewareAddedHandler,
  UpVoteRouteEvent,
  upVoteRouteSchema,
  JwtPayload,
  getItemFromRouteTable,
} from './common';
import jwt_decode from 'jwt-decode';
import createError from 'http-errors';

const dynamoDb = new DynamoDB.DocumentClient();

const upVoteRoute: Handler = async (event: UpVoteRouteEvent) => {
  if (!process.env['ROUTE_TABLE_NAME']) {
    throw createError(500, 'Route table name is not set');
  }
  const {
    headers: { Authorization },
    body: { username: routeOwnerUsername, createdAt },
  } = event;

  const Item = await getItemFromRouteTable(routeOwnerUsername, createdAt);

  const { username } = (await jwt_decode(Authorization.split(' ')[1])) as JwtPayload;
  const { upVotes } = Item;
  if (!upVotes.includes(username)) {
    upVotes.push(username);
    const updateItemInput: UpdateItemInput = {
      TableName: process.env['ROUTE_TABLE_NAME'],
      Key: {
        username: routeOwnerUsername as AttributeValue,
        createdAt: createdAt as AttributeValue,
      },
      UpdateExpression: 'SET upVotes = :upVotes, vote = :vote',
      ExpressionAttributeValues: {
        ':upVotes': upVotes as AttributeValue,
        ':vote': upVotes.length as AttributeValue,
      },
    };
    try {
      await dynamoDb.update(updateItemInput).promise();
    } catch (error) {
      throw createError(500, 'Error updating item :' + error.stack);
    }
  }
  return {
    statusCode: 200,
    body: JSON.stringify({ Message: 'Upvote route success' }),
  };
};

export const handler = getMiddlewareAddedHandler(upVoteRoute, upVoteRouteSchema);
