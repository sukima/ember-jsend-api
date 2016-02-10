# Ember-jsend-api

[![Build Status](https://travis-ci.org/sukima/ember-jsend-api.svg?branch=master)](https://travis-ci.org/sukima/ember-jsend-api)
[![Ember Observer Score](http://emberobserver.com/badges/ember-jsend-api.svg)](http://emberobserver.com/addons/ember-jsend-api)

Got a simple app and want to have a simple backend? Find [JSON:API][1] and Ember Data too *heavy* for something simple? Here is a solution that interfaces with a **RESTful [jsend][]** API.

This addon adds the `jsend` service to interface with a CRUD backend that returns [jsend][] data. For example we might have the following API:

| Request                  | Responses                                             |
|--------------------------|-------------------------------------------------------|
| GET `/api/entities`      | 200 `{"status":"success","data":{entities:[{…},{…}]}` |
| POST `/api/entities`     | 201 `{"status":"success","data":{entity:{…}}`         |
| GET `/api/entities/1`    | 200 `{"status":"success","data":{entity:{…}}`         |
| PATCH `/api/entities/1`  | 200 `{"status":"success","data":{entity:{…}}`         |
| DELETE `/api/entities/1` | 200 `{"status":"success","data":null}`                |
| Validation Errors        | 422 `{"status":"fail","data":{"field":"message",…}}`  |
| Server Errors            | 500 `{"status":"error","message":"error message"}`    |

This addon would provide a convenient service to access these endpoints and convert the data into definable models (`Ember.Objects`).

[1]: http://jsonapi.org/
[jsend]: http://labs.omniti.com/labs/jsend

## Installation

`ember install ember-sinon-qunit`

## Usage

Inject the service into your code (for example in your router):

```javascript
import Ember from 'ember';

export default Ember.Route.extend({
  jsend: Ember.inject.service(),
  model() {
    return this.get('jsend').ajax({url: '/api/entities', method: 'GET'}, 'entities');
  }
});
```

Would make the model an array of raw objects (POJO). But wait theres more!

If you want to associate the data to your own `Ember.Object` you can use the Model specific methods. For example:

```javascript
import Ember from 'ember';

const MyModel = Ember.Object.extend({
  toJSON() {
    return this.getProperties('id', 'foo', 'bar');
  }
});
MyModel.reopenClass({
  endpoint: 'entities',
  fetchAllNode: 'entities',
  fetchNode: 'entity'
});

export default Ember.Router.extend({
  jsend: Ember.inject.service(),
  model() {
    return this.get('jsend').fetchAll(MyModel);
  }
});
```

Would make the model an array of `MyModel` objects.

**NOTE:** The jsend service *ignores* HTTP status codes even though jQuery does not. The service relies on the JSON status value (success, fail, error) to provide better errors for the ember application (validation errors, custom messages). Per the [jsend][] specs the server should provide *both*.

## Models

Models should be Ember objects and provide a `toJSON()` method which returns a JavaScript Object (POJO) in much the same way Backbone defines `toJSON`. This is the same standard that [`JSON.stringify` uses][2].

The model **class** needs three static properties which can be defined using the [`reopenClass()`][3] method.

The values are:

| Property       | Description |
|----------------|-------------|
| `endpoint`     | The path to the endpoint you want. This is prepended with the namespace and suffixed with the model's ID. |
| `fetchAllNode` | This tells when node to lookup the data from. Since [jsend][] responses return a node specific to the request. |
| `fetchNode`    | As with above this is the node use to look up an individual response. |

[2]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#toJSON()_behavior
[3]: http://emberjs.com/api/classes/Ember.CoreObject.html#method_reopenClass

## Methods

| Method                    | Description |
|---------------------------|-------------|
| `ajax(options, dataNode)` | The generic helper with no knowledge of any Models you've defined |
| `fetchAll(Model)`         | Fetch an index of resources |
| `fetch(Model, id)`        | Requests a resource by ID (The 'R' in CRUD) |
| `create(modelInstance)`   | Create a new resource (The 'C' in CRUD) |
| `update(modelInstance)`   | Update a resource (The 'U' in CRUD) |
| `delete(modelInstance)`   | Delete a resource (The 'D' in CRUD) |

## Errors

Errors are accessible through the jsend service (for example: `this.get('jsend').ValidationError`)

| Error Type        | Description |
|-------------------|-------------|
| `ValidationError` | Used to encapsulate any validation errors (when `success:fail`). The `errors` property will hold the validations data. |
| `ServerError`     | Used to encapsulate a server error (when `success:error`). |

## Collaboration

This outlines the details of collaborating on this Ember addon.

### Installation

* `git clone` this repository
* `npm install`
* `bower install`

### Running Tests

* `npm test` (Runs `ember try:testall` to test your addon against multiple Ember versions)
* `ember test`
* `ember test --server`
