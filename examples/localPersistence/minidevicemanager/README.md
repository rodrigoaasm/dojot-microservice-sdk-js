# Example of the core local persistence module features

This example simulates a miniature dojot device manager service to show the main features of the local persistence module.

# Integration to Kafka Consumer

After starting the LocalPersistenceManager and InputPersistent, a dispatchCallback is generated which is registered as a listener of a topic.

For dispatchCallback generation, a filterCallback is defined to allow only device creation messages and a transformationCallback to transform text data into JSON.

```js
// Starting listen
consumer.init().then(() => {

    // The target kafka topic, it could be a String or a RegExp
    const topic = 'admin.dojot.device-manager.device';

    // Callback to notify dispatch success or failure.
    // Note: This callback will not be executed, because the kafka consumer will enter
    // an ack callback in the dispatch callback.
    const errorCallback = () => {};

    // Callback to transform the payload before the dispatches.
    const transformCallback = (data) => {
      const { value: payload } = data;
      return JSON.parse(payload.toString());
    };

    // Callback to filter the dispatches.
    const filterCallback = (data) => data.event === 'create';

    // Gererate dispath callback
    const dispatchCallback = inputPersister.getDispatchCallback(
      InputPersisterArgs.INSERT_OPERATION,
      errorCallback,
      {
        transformCallback,
        filterCallback,
      },
    );

    // Register callback for processing incoming data
    consumer.registerCallback(topic, dispatchCallback);
})
```

As kafka consumer reports an ack callback as an error callback for the registered callback, the errorCallback in getDispatchCallback() is an empty function.

# Integration to REST API

## Dispatch route

Expects to receive a json payload in the request body and dispatches it directly with the method dispath()

### **Request**

`POST /dispatch`

### **Response**

1. 
```
HTTP/1.1 201 OK
Content-Type: application/json
```
2. 
```
HTTP/1.1 500 Internal Server Error
Content-Type: application/json

{ 
    error : string
}

```

## Query route

Retrieves an entry data with the method get.

### **Request**

`GET /level/:level/key/:key`

**Params**
```
level: string
key: string
```

### **Response**

1. 
```
HTTP/1.1 200 OK
Content-Type: application/json

{
    result: any
}

```
2.
```
HTTP/1.1 404 Not Found
Content-Type: application/json
```

## Exclusion route

Deletes an entry data with the method del.

### **Request**

`DELETE /level/:level/key/:key`

**Params**
```
level: string
key: string
```

### **Response**

1. 
```
HTTP/1.1 200 OK
Content-Type: application/json

{
    result: any
}

```
2.
```
HTTP/1.1 404 Not Found
Content-Type: application/json

{ 
    error : string
}
```