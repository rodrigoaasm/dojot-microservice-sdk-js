import * as http from 'http';
import { TokenSet } from 'openid-client';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { interceptors, interceptors } from './lib/webUtils/framework';

declare module '@dojot/microservice-sdk' {
    namespace Kafka {
        interface KafkaMessage{
            value: Buffer,
            size: number,
            topic: string,
            offset: number,
            partition:number,
            key: string,
            timestamp: number,
        }

        class Consumer{
            constructor(config: any);
            public init():void;
            public on(event: string, callback: Function): void;
            public registerCallback(topic: string, callback: Function): number;
            public unregisterCallback(register: number): void;
            public getStatus(): Promise<any>;
            public finish(): Promise<void>;
            private backoffWithRandomDelta(retries: number): number;
            private refreshSubscriptions(): void;
            private onRebalance(error:number, assignments:any): void;
            private onDate(data: KafkaMessage): void;
            private invokeInterestedCallbacksSyncCommit(data: KafkaMessage): Promise<void>;
            private invokeInterestedCallbacksAsyncCommit(data: KafkaMessage): Promise<void>;
            private resumeConsumer(): void;
        }

        class Producer{
            constructor(config: any);            
            public connect(): Promise<void>;
            public produce(topic: string, message: string, key:string, partition:number): Promise<void>;
            public disconnect(): Promise<Function>;            
            public getStatus(): Promise<{ connected: boolean, metadata: Object }>;
            private isDeliveryReportEnabled(): number;
            private static resolveOnDeliveryReport(err: Error, report: Object): void;
        }
    }

    class Logger {
        constructor(sid: string);
        public static setLevel(transport: string, level: string): void;
        public static isTransportSet(transport: string): boolean;
        public static setTransport(transport: string, config: Object): void;
        public static unsetTransport(transport: string): void;
        public static setVerbose(enable: boolean): void;
        public static getVerbose(): boolean;
        public error(message: string, metadata: Object): any;
        public warn(message: string, metadata: Object): any;
        public info(message: string, metadata: Object): any;
        public debug(message: string, metadata: Object): any;
    }

    module ConfigManager {
        function loadSettings(
            service: string,
            userConfigFile: string,
            configPath: string,
            rootPath: string
        ): void;
        function getConfig(service: string, configPath: string, rootPath: string): any;
        function transformObjectKeys (obj: Object, mapFunction: Function): Array<any>;
    }

    class ServiceStateManager {
        constructor(config: any);
        public signalReady(service: string): void;
        public signalNotReady(service: string): void;
        public isReady(): boolean;
        public registerService(service: string): void;
        public addHealthChecker(service: string, healthChecker: Function, interval: number): void;
        private updateLightshipState(): void;
        private updateState(service: string, status: boolean): void;
        private removeService(service): void;
        private removeAllServices(): void;
    }    

    module WebUtils {
        interface GenerateArgs {
            payload: Object,
            tenant: string,
            expirationSec: number,
            secret: string,
        }

        class TokenGen {
            public generate(data: GenerateArgs): Promise<string>;
        }

        interface CreateServerArgs {
            logger: Logger,
            server: any,
            routes: Array<any>,
            interceptors: Array<any>,
            errorHandlers: Array<any>,
            supportWebsockets: boolean,
            supportTrustProxy: boolean,
            catchInvalidRequest: boolean,
        }

        interface DefaultErrorHandlerArgs {
            logger: Logger,
        }  
      
        function createServer(logger: Logger, config: any): http.Server | http.Server;
        function createTokenGen(): TokenGen;

        module framework {
            function createExpress(Args: CreateServerArgs): any;
            module errorTemplate {
                function BadRequest(msg: string, detail: string): Error;
                function Unauthorized(msg: string, detail: string): Error;
                function PaymentRequired(msg: string, detail: string): Error;
                function Forbidden(msg: string, detail: string): Error;
                function NotFound(msg: string, detail: string): Error;
                function MethodNotAllowed(msg: string, detail: string): Error;
                function NotAcceptable(msg: string, detail: string): Error;
                function ProxyAuthenticationRequired(msg: string, detail: string): Error;
                function RequestTimeout(msg: string, detail: string): Error;
                function Conflict(msg: string, detail: string): Error;
                function Gone(msg: string, detail: string): Error;
                function LengthRequired(msg: string, detail: string): Error;
                function PreconditionFailed(msg: string, detail: string): Error;
                function PayloadTooLarge(msg: string, detail: string): Error;
                function URITooLong(msg: string, detail: string): Error;
                function UnsupportedMediaType(msg: string, detail: string): Error;
                function RangeNotSatisfiable(msg: string, detail: string): Error;
                function ExpectationFailed(msg: string, detail: string): Error;
                function ImATeapot(msg: string, detail: string): Error;
                function MisdirectedRequest(msg: string, detail: string): Error;
                function UnprocessableEntity(msg: string, detail: string): Error;
                function Locked(msg: string, detail: string): Error;
                function FailedDependency(msg: string, detail: string): Error;
                function UnorderedCollection(msg: string, detail: string): Error;
                function UpgradeRequired(msg: string, detail: string): Error;
                function PreconditionRequired(msg: string, detail: string): Error;
                function TooManyRequests(msg: string, detail: string): Error;
                function RequestHeaderFieldsTooLarge(msg: string, detail: string): Error;
                function UnavailableForLegalReasons(msg: string, detail: string): Error;
                function InternalServerError(msg: string, detail: string): Error;
                function NotImplemented(msg: string, detail: string): Error;
                function BadGateway(msg: string, detail: string): Error;
                function ServiceUnavailable(msg: string, detail: string): Error;
                function GatewayTimeout(msg: string, detail: string): Error;
                function HTTPVersionNotSupported(msg: string, detail: string): Error;
                function VariantAlsoNegotiates(msg: string, detail: string): Error;
                function InsufficientStorage(msg: string, detail: string): Error;
                function LoopDetected(msg: string, detail: string): Error;
                function BandwidthLimitExceeded(msg: string, detail: string): Error;
                function NotExtended(msg: string, detail: string): Error;
                function NetworkAuthenticationRequire(msg: string, detail: string): Error;
            }
            function defaultErrorHandler(args: DefaultErrorHandlerArgs): Function;

            module interceptors {
                function beaconInterceptor({
                    stateManager: ServiceStateManager,
                    logger: Logger,
                    path: string,
                }): any;                
                function jsonBodyParsingInterceptor({ config: any}): any;
                function paginateInterceptor({ limit: number, maxLimit: number, path: string }): any;
                function readinessInterceptor({
                    stateManager: ServiceStateManager, logger: Logger, path: string
                }): any;
                function requestIdInterceptor({ path: string }): any;
                function requestLogInterceptor({ logFormat: string, logger: Logger, path: string}): any
                function responseCompressInterceptor({ config: any, path: string}): any;
                function staticFileInterceptor({ baseDirectory: string, staticFilePath: string, path: string }): any;
                function tokenParsingInterceptor({ignoredPaths: string, path: string}): any;
            }
        }

        interface Credentials {
            grant_type: 'client_credentials' | 'password',
            client_id: string,
            client_secret?: string,
            username?: string,
            password?: string,
        }

        interface KeycloakClientSessionOptions {
            retryDelay: number,
        }

        class KeycloakClientSession {
            constructor(
                keycloakUrl: string,
                tenant: string,
                credentials: Credentials,
                logger: Logger,
                options: KeycloakClientSessionOptions,
            );
            public start(): Promise<any>;
            public getTokenSet(): TokenSet;
            public close(): void;
            private doAuthClient(credentials: Credentials, resolve: Function, reject: Function): void;
            private setTimeRefresh(accessTokenTimelife: number): void;
            private refresh(): void;
            
        }

        interface ConfigRetryRequest {
            attempts: number,
            retryDelay: number,
            maxNumberAttempts: number,
        }

        class DojotClientHttp {
            constructor({
                defaultClientOptions: AxiosRequestConfig,
                logger: Logger,
                defaultRetryDelay: number,
                defaultMaxNumberAttempts: number,
            });
            public request( 
                options: AxiosRequestConfig, 
                retryDelay: number, 
                maxNumberAttempts: number
            ): Promise<AxiosResponse>;
            private retry(
                requestError: Error,
                options: AxiosRequestConfig,
                resolve: Function,
                reject: Function,
                previousConfigAndStatus: ConfigRetryRequest,
            ): void;
            private doRequest(
                options: AxiosRequestConfig,
                resolve: Function,
                reject: Function,
                configRetryRequest: ConfigRetryRequest
            ): void;
        }

        class SecretFileHandler {
            constructor(config: any, logger: Logger);
            public handleCollection(keyPaths: Array<string>, dirPath: string): Promise<void>;
            public handle(keyPath: string, dirPath: string): Promise<void>;
            private static splitPath(field: string): Array<string>;
            private getEnv(field: string): any;
            private setEnv(field: string, value: any);
        }
    }

    module LocalPersistence {

        type OperationType = 'put' | 'del';

        interface Operation {
            type: OperationType,
            key: any,
            value?: any,
        }

        interface Batch {
            config: any,
            operations: Array<Operation>,
        }

        interface LevelConfig{
            type: 'dynamic' | 'static',  
            source?: string, 
            name?: string, 
            options: any,
        }

        interface PropConfig {
            type: 'dynamic' | 'static', 
            source: string, 
        }

        interface EntryConfig {
            key: PropConfig,
            value: PropConfig
        }

        interface EntryData {
            key: any,
            value: any,
        }

        interface FrameConfig {
            level: number,
            pair: EntryConfig,
        }

        interface InputConfig {
            levels: LevelConfig,
            frame: FrameConfig,
        }

        interface OptionsCallback {
            transformCallback: Function,
            filterCallback: Function,
        }

        class LocalPersistenceManager{
            constructor(logger: Logger, readInMemory: boolean, databasePath: string);
            public init(): Promise<void>;
            public static copyLevel(originLevel: any, targetLevel: any): Promise<void>;
            private copyLevelsToMemory(): void;
            public initializeLevel(sublevel: string, options: any): Promise<Array<any>>;
            public initializeDiskLevel(sublevel: string, options: any): Promise<any>;
            public getDiskLevel(sublevel: string): Promise<any>;
            public getMemoryLevel(sublevel: string): Promise<any>;
            public executeBatchForLevels(operationsForLevel: Map<string, Batch>): Promise<void>; 
            public put(sublevel: string, key: any, value: any): Promise<any>;   
            public del(sublevel: string, key: any): Promise<void>;
            public getInDisk(sublevel: string, key: any): Promise<any>;
            public getInMemory(sublevel: string, key: any): Promise<any>;
            public get(sublevel: string, key: any): Promise<any>;
            public createKeyStreamInMemory(sublevel: string): Promise<NodeJS.ReadStream>;  
            public createValueStreamInMemory(sublevel: string): Promise<NodeJS.ReadStream>;
            public createStreamInMemory(sublevel: string): Promise<NodeJS.ReadStream>;  
            public createKeyStreamInDisk(sublevel: string): Promise<NodeJS.ReadStream>;  
            public createValueStreamInDisk(sublevel: string): Promise<NodeJS.ReadStream>;  
            public createStreamInDisk(sublevel: string): Promise<NodeJS.ReadStream>;
            public createKeyStream(sublevel: string): Promise<NodeJS.ReadStream>;  
            public createValueStream(sublevel: string): Promise<NodeJS.ReadStream>;  
            public createStream(sublevel: string): Promise<NodeJS.ReadStream>;  
            public clear(sublevelName: string): Promise<void>;
            public clearAll(): Promise<void>;
            public close(): Promise<void>;          
        }

        class InputPersister {
            constructor(
                localPersistenceManager: LocalPersistenceManager,
                config: InputConfig
            );
            public dispatch(payload: any, operationType: OperationType): Promise<void>;
            public getDispatchCallback( 
                operationType: OperationType,
                errorCallback: Function,
                {
                    transformCallback,
                    filterCallback,
                }
            ): Function;
            private static get(field: string, target: Object): any;
            private prepareLevel(levelConfig: LevelConfig, payload: any): LevelConfig | null;
            private extractData(frame: FrameConfig, payload: any): EntryData;
            
        }
    }
}