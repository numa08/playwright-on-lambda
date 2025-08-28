#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { PlaywrightOnLambdaStack } from '../lib/playwright-on-lambda-stack';

const app = new cdk.App({});
new PlaywrightOnLambdaStack(app, 'PlaywrightOnLambdaStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'ap-northeast-1',
  },
});
