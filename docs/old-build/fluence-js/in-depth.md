# In-depth

## Intro

In this section we will cover the Fluence JS in-depth.

## Fluence

`@fluencelabs/fluence` exports a facade `Fluence` which provides all the needed functionality for the most uses cases. It defined 4 functions:

* `start`: Start the default peer.
* `stop`: Stops the default peer
* `getStatus`: Gets the status of the default peer. This includes connection
* `getPeer`: Gets the default Fluence Peer instance (see below)

Under the hood `Fluence` facade calls the corresponding method on the default instance of FluencePeer. This instance is passed to the Aqua-compiler generated functions by default.

## FluencePeer class

The second export `@fluencelabs/fluence` package is `FluencePeer` class. It is useful in scenarios when the application need to run several different peer at once. The overall workflow with the `FluencePeer` is the following:

1. Create an instance of the peer
2. Starting the peer
3. Using the peer in the application
4. Stopping the peer

To create a new peer simple instantiate the `FluencePeer` class:

```typescript
const peer = new FluencePeer();
```

The constructor simply creates a new object and does not initialize any workflow. The `start` function starts the Aqua VM, initializes the default call service handlers and (optionally) connect to the Fluence network. The function takes an optional object specifying additional peer configuration. On option you will be using a lot is `connectTo`. It tells the peer to connect to a relay. For example:

```typescript
await peer.star({
  connectTo: krasnodar[0],
});
```

connects to the first node of the Krasnodar network. You can find the officially maintained list networks in the `@fluencelabs/fluence-network-environment` package. The full list of supported options is described in the [API reference](https://fluence.one/fluence-js/)

```typescript
await peer.stop();
```

## Using multiple peers in one application

The peer by itself does not do any useful work. You should take advantage of functions generated by the Aqua compiler.

If your application needs several peers, you should create a separate `FluencePeer` instance for each of them. The generated functions accept the peer as the first argument. For example:

```typescript
import { FluencePeer } from "@fluencelabs/fluence";
import {
  registerSomeService,
  someCallableFunction,
} from "./_aqua/someFunction";

async function main() {
  const peer1 = new FluencePeer();
  const peer2 = new FluencePeer();

  // Don't forget to initialize peers
  await peer1.start({
    connectTo: relay,
  });
  await peer2.start({
    connectTo: relay,
  });

  // ... more application logic

  //        Pass the peer as the first argument
  //                   ||
  //                   \/
  registerSomeService(peer1, {
    handler: async (str) => {
      console.log("Called service on peer 1: " str);
    },
  });

  //        Pass the peer as the first argument
  //                   ||
  //                   \/
  registerSomeService(peer2, {
    handler: async (str) => {
      console.log("Called service on peer 2: " str);
    },
  });

  //                Pass the peer as the first argument
  //                           ||
  //                           \/
  await someCallableFunction(peer1, arg1, arg2, arg3);


  await peer1.stop();
  await peer2.stop();
}

// ... more application logic
```

It is possible to combine usage of the default peer with another one. Pay close attention to which peer you are calling the functions against.

```typescript
  // Registering handler for the default peerS
  registerSomeService({
    handler: async (str) => {
      console.log("Called against the default peer: " str);
    },
  });

  //            Pay close attention to this
  //                       ||
  //                       \/
  registerSomeService(someOtherPeer, {
    handler: async (str) => {
      console.log("Called against the peer named someOtherPeer: " str);
    },
  });
```

## Understanding the Aqua compiler output

Aqua compiler emits TypeScript or JavaScript which in turn can be called from a js-based environment. The compiler outputs code for the following entities:

1. Exported `func` declarations are turned into callable async functions
2. Exported `service` declarations are turned into functions which register callback handler in a typed manner
3. For every exported `service` the compiler generated it's interface under the name `{serviceName}Def`

### Function definitions

For every exported function definition in aqua the compiler generated two overloads. One accepting the `FluencePeer` instance as the first argument, and one without it. Otherwise arguments are the same and correspond to the arguments of aqua functions. The last argument is always an optional config object with the following properties:

* `ttl`: Optional parameter which specify TTL (time to live) of particle with execution logic for the function

The return type is always a promise of the aqua function return type. If the function does not return anything, the return type will be `Promise<void>`.

Consider the following example:

```aqua
func myFunc(arg0: string, arg1: string):
    -- implementation
```

The compiler will generate the following overloads:

```typescript
export async function myFunc(
  arg0: string,
  arg1: string,
  config?: { ttl?: number }
): Promise<void>;

export async function callMeBack(
  peer: FluencePeer,
  arg0: string,
  arg1: string,
  config?: { ttl?: number }
): Promise<void>;
```

### Service definitions

```aqua
service ServiceName:
    -- service interface
```

For every exported `service` declaration the compiler will generate two entities: service interface under the name `{serviceName}Def` and a function named `register{serviceName}` with several overloads. First let's describe the most complete one using the following example:

```typescript
export interface ServiceNameDef {
  //... service function definitions
}

export function registerServiceName(
  peer: FluencePeer,
  serviceId: string,
  service: ServiceNameDef
): void;
```

* `peer` - the Fluence Peer instance where the handler should be registered. The peer can be omitted. In that case the default Fluence Peer will be used instead
* `serviceId` - the name of the service id. If the service was defined with the default service id in aqua code, this argument can be omitted.
* `service` - the handler for the service.

Depending on whether or not the services was defined with the default id the number of overloads will be different. In the case it **is defined**, there would be four overloads:

```typescript
// (1)
export function registerServiceName(
  //
  service: ServiceNameDef
): void;

// (2)
export function registerServiceName(
  serviceId: string,
  service: ServiceNameDef
): void;

// (3)
export function registerServiceName(
  peer: FluencePeer,
  service: ServiceNameDef
): void;

// (4)
export function registerServiceName(
  peer: FluencePeer,
  serviceId: string,
  service: ServiceNameDef
): void;
```

1. Uses default Fluence Peer and the default id taken from aqua definition
2. Uses default Fluence Peer and specifies the service id explicitly
3. The default id is taken from aqua definition. The peer is specified explicitly
4. Specifying both peer and the service id.

If the default id **is not defined** in aqua code the overloads will exclude ones without service id:

```typescript
// (1)
export function registerServiceName(
  serviceId: string,
  service: ServiceNameDef
): void;

// (2)
export function registerServiceName(
  peer: FluencePeer,
  serviceId: string,
  service: ServiceNameDef
): void;
```

1. Uses default Fluence Peer and specifies the service id explicitly
2. Specifying both peer and the service id.

### Service interface

The service interface type follows closely the definition in aqua code. It has the form of the object which keys correspond to the names of service members and the values are functions of the type translated from aqua definition (see [Type conversion](#type-conversion)). For example, for the following aqua definition:

```aqua
service Calc("calc"):
    add(n: f32)
    subtract(n: f32)
    multiply(n: f32)
    divide(n: f32)
    reset()
    getResult() -> f32
```

The typescript interface will be:

```typescript
export interface CalcDef {
  add: (n: number, callParams: CallParams<"n">) => void | Promise<void>;
  subtract: (n: number, callParams: CallParams<"n">) => void | Promise<void>;
  multiply: (n: number, callParams: CallParams<"n">) => void | Promise<void>;
  divide: (n: number, callParams: CallParams<"n">) => void | Promise<void>;
  reset: (callParams: CallParams<null>) => void | Promise<void>;
  getResult: (callParams: CallParams<null>) => number | Promise<number>;
}
```

`CallParams` will be described later in the section

### Type conversion

Basic types conversion is pretty much straightforward:

* `string` is converted to `string` in typescript
* `bool` is converted to `boolean` in typescript
* All number types (`u8`, `u16`, `u32`, `u64`, `s8`, `s16`, `s32`, `s64`, `f32`, `f64`) are converted to `number` in typescript

Arrow types translate to functions in typescript which have their arguments translated to typescript types. In addition to arguments defined in aqua, typescript counterparts have an additional argument for call params. For the majority of use cases this parameter is not needed and can be omitted.

The type conversion works the same way for `service` and `func` definitions. For example a `func` with a callback might look like this:

```aqua
func callMeBack(callback: string, i32 -> ()):
    callback("hello, world", 42)
```

The type for `callback` argument will be:

```typescript
callback: (arg0: string, arg1: number, callParams: CallParams<'arg0' | 'arg1'>) => void | Promise<void>,
```

For the service definitions arguments are named (see calc example above)

### Using asynchronous code in callbacks

Typescript code generated by Aqua compiler has two scenarios where a user should specify a callback function. These are services and callback arguments of function in aqua. If you look at the return type of the generated function you will see a union of callback return type and the promise with this type, e.g `string | Promise<string>`. Fluence-js supports both sync and async version of callbacks and figures out which one is used under the hood. The callback be made asynchronous like any other function in javascript: either return a Promise or mark it with async keyword to take advantage of async-await pattern.

For example:

```aqua
func withCallback(callback: string -> ()):
  callback()

service MyService:
  callMe(string)
```

Here we are returning a promise

```typescript
registerMyService({
  callMe: (arg): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log("I'm running 3 seconds after call");
        resolve();
      }, 3000);
    });
  },
});
```

And here we are using async-await pattern

```typescript
await withCallback(async (arg) => {
  const data = await getStuffFromDatabase(arg);
  console.log("");
});
```

### Call params and tetraplets

Each service call is accompanied by additional information specific to Fluence Protocol. Including `initPeerId` - the peer which initiated the particle execution, particle signature and most importantly security tetraplets. All this data is contained inside the last `callParams` argument in every generated function definition. These data is passed to the handler on each function call can be used in the application.

Tetraplets have the form of:

```typescript
{
  argName0: SecurityTetraplet[],
  argName1: SecurityTetraplet[],
  // ...
}
```

To learn more about tetraplets and application security see [Security](docs/build/security.md)

To see full specification of `CallParams` type see [API reference](https://fluence.one/fluence-js/)

## Signing service

Signing service is useful when you want to sign arbitrary data and pass it further inside a single aqua script. Signing service allows to restrict its usage for security reasons: e.g you don't want to sign anything except it comes from a trusted source. The aqua side API is the following:

```aqua
data SignResult:
    -- Was call successful or not
    success: bool
    -- Error message. Will be null if the call is successful
    error: ?string
    -- Signature as byte array. Will be null if the call is not successful
    signature: ?[]u8

-- Available only on FluenceJS peers
-- The service can also be resolved by it's host peer id
service Sig("sig"):
    -- Signs data with the private key used by signing service.
    -- Depending on implementation the service might check call params to restrict usage for security reasons.
    -- By default signing service is only allowed to be used on the same peer the particle was initiated
    -- and accepts data only from the following sources:
    --   trust-graph.get_trust_bytes
    --   trust-graph.get_revocation_bytes
    --   registry.get_key_bytes
    --   registry.get_record_bytes
    --   registry.get_host_record_bytes
    -- Argument: data - byte array to sign
    -- Returns: signature as SignResult structure
    sign(data: []u8) -> SignResult

    -- Given the data and signature both as byte arrays, returns true if the signature is correct, false otherwise.
    verify(signature: []u8, data: []u8) -> bool

    -- Gets service's public key.
    get_pub_key() -> string
```

FluenceJS ships the service implementation as the JavaScript class:

```typescript
/**
 * Whether signing operation is allowed or not.
 * Implemented as a predicate of CallParams.
 */
export type SigSecurityGuard = (params: CallParams<"data">) => boolean;

export class Sig implements SigDef {
  private _keyPair: KeyPair;

  constructor(keyPair: KeyPair) {
    this._keyPair = keyPair;
  }

  /**
   * Security guard predicate
   */
  securityGuard: SigSecurityGuard;

  /**
   * Gets the public key of KeyPair. Required by aqua
   */
  get_pub_key() {
    // implementation omitted
  }

  /**
   * Signs the data using key pair's private key. Required by aqua
   */
  async sign(
    data: number[],
    callParams: CallParams<"data">
   ): Promise<SignResult> {
     // implementation omitted
  }

  /**
   * Verifies the signature. Required by aqua
   */
  verify(signature: number[], data: number[]): Promise<boolean> {
    // implementation omitted
  }
}
```

`securityGuard` specifies the way the `sign` method checks where the incoming data is allowed to be signed or not. It accepts one argument: call params (see "Call params and tetraplets") and must return either true or false. Any predicate can be specified. Also, FluenceJS is shipped with a set of useful predicates:

```typescript
/**
 * Only allow calls when tetraplet for 'data' argument satisfies the predicate
 */
export const allowTetraplet = (pred: (tetraplet: SecurityTetraplet) => boolean): SigSecurityGuard => {/*...*/};

/**
 * Only allow data which comes from the specified serviceId and fnName
 */
export const allowServiceFn = (serviceId: string, fnName: string): SigSecurityGuard => {/*...*/};

/**
 * Only allow data originated from the specified json_path
 */
export const allowExactJsonPath = (jsonPath: string): SigSecurityGuard => {/*...*/};

/**
 * Only allow signing when particle is initiated at the specified peer
 */
export const allowOnlyParticleOriginatedAt = (peerId: PeerIdB58): SigSecurityGuard => {/*...*/};

/**
 * Only allow signing when all of the predicates are satisfied.
 * Useful for predicates reuse
 */
export const and = (...predicates: SigSecurityGuard[]): SigSecurityGuard => {/*...*/};

/**
 * Only allow signing when any of the predicates are satisfied.
 * Useful for predicates reuse
 */
export const or = (...predicates: SigSecurityGuard[]): SigSecurityGuard => {/*...*/};
};
```

Predicates as well as the `Sig` definition can be found in `@fluencelabs/fluence/dist/services`

`Sig` class is accompanied by `registerSig` which allows registering different signing services with different keys. The mechanism is exactly the same as with ordinary aqua services e.g:

```typescript
// create a key per from pk bytes
const customKeyPair = await KeyPair.fromEd25519SK(pkBytes);

// create a signing service with the specific key pair
const customSig = new Sig(customKeyPair);

// restrict sign usage to our needs
customSig.securityGuard = allowServiceFn("my_service", "my_function");

// register the service. Please note, that service id ("CustomSig" here) has to be specified.
registerSig("CustomSig", customSig);
```

for a [non-default peer](in-depth.md#using-multiple-peers-in-one-application), the instance has to be specified:

```typescript
const peer = new FluencePeer();
await peer.start();

// ...

registerSig(peer, "CustomSig", customSig);
```

`FluencePeer` ships with the default signing service implementation, registered with id "Sig". Is is useful to work with TrustGraph and Registry API. The default implementation has the following restrictions on the `sign` operation:

* Only allowed to be used on the same peer the particle was initiated
* Restricts data to following services:
  * trust-graph.get\_trust\_bytes
  * trust-graph.get\_revocation\_bytes
  * registry.get\_key\_bytes
  * registry.get\_record\_bytes
  * Argument: data - byte array to sign

The default signing service class can be accessed in the following way:

```typescript
// for default FluencePeer:
const sig = Fluence.getPeer().getServices().sig;

// for non-default FluencePeer:
// const peer = FluencePeer();
// await peer.start()
const sig = peer.getServices().sig;

// change securityGuard for the default service:
sig.securityGuard = or(
  sig.securityGuard,
  allowServiceFn("my_service", "my_function")
);
```

## Using Marine services in Fluence JS

Fluence JS can host Marine services with Marine JS. Currently only pure single-module services are supported.

Before registering the service corresponding WASM file must be loaded. Fluence JS package exports three helper functions for that.

#### loadWasmFromFileSystem

Loads the WASM file from file system. It accepts the path to the file and returns buffer compatible with `FluencePeer` API.

This function can only be used in nodejs. Trying to call it inside browser will result throw an error.

**loadWasmFromNpmPackage**

Locates WASM file in the specified npm package and loads it. The function accepts two arguments:

* Name of npm package
* Path to WASM file relative to the npm package

This function can only be used in nodejs. Trying to call it inside browser will result throw an error.

#### loadWasmFromServer

Loads WASM file from the service hosting the application. It accepts the file path on server and returns buffer compatible with `FluencePeer` API.

:::info
The function will try load file into SharedArrayBuffer if the site is cross-origin isolated.

Otherwise the return value fall backs to Buffer which is less performant but is still compatible with `FluencePeer API`.

We strongly recommend to set-up cross-origin headers. For more details see: See  [MDN page](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer#security_requirements) for more info
:::

This function can only be used in browser. Trying to call it inside nodejs will result throw an error.

### Registering services in FluencePeer

After the file has been loaded it can be registered in `FluencePeer`. To do so use `registerMarineService function.`

To remove service use `registerMarineService` function.

You can pick any unique service id. Once the service has been registered it can be referred in aqua code by the specified id

For example:

```typescript
import { Fluence, loadWasmFromFileSystem } from '@fluencelabs/fluence';

async function main()
    await Fluence.start({connectTo: relay});

    const path = path.join(__dirname, './service.wasm');
    const service = await loadWasmFromFileSystem(path);

    // to register service
    await Fluence.registerMarineService(service, 'my_service_id');
    
    // to remove service
    Fluence.removeMarineService('my_service_id');
}
```

See [https://github.com/fluencelabs/marine-js-demo](https://github.com/fluencelabs/marine-js-demo) for a complete demo.