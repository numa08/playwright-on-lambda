import * as path from 'node:path';
import { CfnOutput, Duration, Stack, type StackProps } from 'aws-cdk-lib';
import * as assets from 'aws-cdk-lib/aws-ecr-assets';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import {
  Code,
  FunctionUrlAuthType,
  Handler,
  HttpMethod,
  InvokeMode,
  Function as LambdaFunction,
  Runtime,
} from 'aws-cdk-lib/aws-lambda';
import type { Construct } from 'constructs';

export class PlaywrightOnLambdaStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const lambdaRole = new Role(this, 'LambdaExecutionRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
      // inlinePolicies: {
      //   DynamoDBAccess: new iam.PolicyDocument({
      //     statements: [
      //       new iam.PolicyStatement({
      //         effect: iam.Effect.ALLOW,
      //         actions: [
      //           'dynamodb:GetItem',
      //           'dynamodb:PutItem',
      //           'dynamodb:UpdateItem',
      //           'dynamodb:DeleteItem',
      //           'dynamodb:Query',
      //           'dynamodb:Scan',
      //         ],
      //         resources: [sessionTable.tableArn],
      //       }),
      //     ],
      //   }),
      // },
    });
    // Lambda関数の作成（Asset Imageを使用してデプロイ時に自動ビルド）
    const lambdaFunction = new LambdaFunction(this, 'DenoLambdaFunction', {
      code: Code.fromAssetImage(path.join(__dirname, '..', 'lambda'), {
        // Dockerfileの場所を指定（lambdaディレクトリ内）
        file: 'Dockerfile',
        // ビルド時の引数（必要に応じて）
        buildArgs: {
          DENO_VERSION: '1.47.0',
          LAMBDA_ADAPTER_VERSION: '0.9.1',
        },
        // プラットフォーム指定（Apple Silicon Mac対応）
        platform: assets.Platform.LINUX_AMD64,
      }),
      handler: Handler.FROM_IMAGE,
      runtime: Runtime.FROM_IMAGE,
      role: lambdaRole,
      timeout: Duration.seconds(30),
      memorySize: 2048,
      environment: {
        LOG_LEVEL: 'INFO',
        AWS_LWA_INVOKE_MODE: 'response_stream',
        AWS_LWA_PORT: '8000',
      },
    });
    const functionUrl = lambdaFunction.addFunctionUrl({
      authType: FunctionUrlAuthType.NONE,
      cors: {
        allowedOrigins: ['*'],
        allowedMethods: [HttpMethod.ALL],
        allowedHeaders: ['*'],
        maxAge: Duration.days(1),
      },
      invokeMode: InvokeMode.RESPONSE_STREAM, // ストリーミングレスポンス
    });
    new CfnOutput(this, 'FunctionUrl', {
      value: functionUrl.url,
      description: 'Function URL',
    });
    new CfnOutput(this, 'FunctionName', {
      value: lambdaFunction.functionName,
      description: 'Function Name',
    });
  }
}
