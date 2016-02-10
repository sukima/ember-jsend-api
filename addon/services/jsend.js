import Ember from 'ember';

class ValidationError extends Error {
  constructor(errors) {
    super();
    this.name = 'ValidationError';
    this.errors = errors;
  }
  get message() {
    return Object.keys(this.errors).map(key => this.errors[key]).join(', ');
  }
}

class ServerError extends Error {
  constructor(message) {
    super();
    this.name = 'ServerError';
    this.message = message;
  }
}

function getDataFromResponse(nodePath='.') {
  return function(response) {
    switch (response.status) {
      case 'success': return Ember.get(response.data || {}, nodePath);
      case 'fail': throw new ValidationError(response.data);
      default: throw new ServerError(response.message);
    }
  };
}

function parseErrorResponse(jxhr) {
  try {
    return JSON.parse(jxhr.responseText);
  } catch (e) {
    throw jxhr;
  }
}

function mapToModelObject(Model) {
  return function(data) {
    return Model.create(data);
  };
}

function urlFor(parts) {
  return Ember.A(parts).compact().join('/');
}

export default Ember.Service.extend({
  ValidationError, ServerError,

  namespace: Ember.computed(function () {
    let config;
    if (Ember.getOwner) {
      config = Ember.getOwner(this).resolveRegistration('config:environment');
    } else {
      config = this.container.lookupFactory('config:environment');
    }
    return config.jsendApiNamespace || '';
  }),

  ajax({url, method, data}, dataNode) {
    method = method || 'GET';
    return Ember.RSVP.resolve(Ember.$.ajax({url, method, data}))
      .catch(parseErrorResponse)
      .then(getDataFromResponse(dataNode));
  },

  fetchAll(Model) {
    const url = urlFor([this.get('namespace'), Model.endpoint]);
    return this.ajax({url}, Model.fetchAllNode)
      .then(data => data.map(mapToModelObject(Model)));
  },

  fetch(Model, id) {
    const url = urlFor([this.get('namespace'), Model.endpoint, id]);
    return this.ajax({url}, Model.fetchNode)
      .then(mapToModelObject(Model));
  },

  create(model) {
    const Model = model.constructor;
    const url = urlFor([this.get('namespace'), Model.endpoint]);
    const data = model.toJSON();
    return this.ajax({url, method: 'POST', data}, Model.fetchNode);
  },

  update(model) {
    const Model = model.constructor;
    const url = urlFor([this.get('namespace'), Model.endpoint, model.get('id')]);
    const data = model.toJSON();
    return this.ajax({url, method: 'PATCH', data}, Model.fetchNode);
  },

  delete(model) {
    const Model = model.constructor;
    const url = urlFor([this.get('namespace'), Model.endpoint, model.get('id')]);
    return this.ajax({url, method: 'DELETE'});
  }
});
