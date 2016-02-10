import Ember from 'ember';
import { moduleFor } from 'ember-qunit';
import sinon from 'sinon';
import test from 'dummy/tests/ember-sinon-qunit/test';

const MockModel = Ember.Object.extend({
  toJSON() {}
});

MockModel.reopenClass({
  endpoint: 'test-endpoint',
  fetchAllNode: 'test-fetchAll',
  fetchNode: 'test-fetch'
});

moduleFor('service:jsend', 'jsend Service', {
  needs: ['config:environment']
});

test('#ajax proxies arguments to jQuery ajax()', function (assert) {
  const ajaxRequest = {url: 'foo', method: 'GET'};
  const response = {status: 'success', data: null};
  const ajaxStub = this.stub(Ember.$, 'ajax')
    .returns(Ember.RSVP.resolve(response));

  assert.expect(1);
  return this.subject().ajax(ajaxRequest).then(() => {
    sinon.assert.calledWith(ajaxStub, sinon.match(ajaxRequest));
  });
});

test('#ajax on success resolves to dataNode', function (assert) {
  const ajaxRequest = {url: 'foo', method: 'GET'};
  const expected = {bar: 'bar'};
  const response = {status: 'success', data: {foo: expected}};
  this.stub(Ember.$, 'ajax').returns(Ember.RSVP.resolve(response));

  assert.expect(1);
  return this.subject().ajax(ajaxRequest, 'foo').then(actual => {
    assert.deepEqual(actual, expected, 'expected response to return dataNode');
  });
});

test('#ajax on failure rejects with ValidationError', function (assert) {
  const ajaxRequest = {url: 'foo', method: 'POST', data: null};
  const responseText = JSON.stringify({status: 'fail', data: {foo: 'bar'}});
  const jsend = this.subject();
  this.stub(Ember.$, 'ajax').returns(Ember.RSVP.reject({responseText}));

  assert.expect(2);
  return jsend.ajax(ajaxRequest, 'foo')
    .then(() => assert.ok(false, 'expected promise to be rejected'))
    .catch(error => {
      assert.ok(error instanceof jsend.ValidationError, 'expected error to be a ValidationError');
      assert.equal(error.errors.foo, 'bar', 'expected error.errors to have data from response');
    });
});

test('#ajax on error rejects with ServerError', function (assert) {
  const ajaxRequest = {url: 'foo', method: 'POST', data: null};
  const responseText = JSON.stringify({status: 'error', message: 'foobar'});
  const jsend = this.subject();
  this.stub(Ember.$, 'ajax').returns(Ember.RSVP.reject({responseText}));

  assert.expect(1);
  return jsend.ajax(ajaxRequest, 'foo')
    .then(() => assert.ok(false, 'expected promise to be rejected'))
    .catch(error => {
      assert.ok(error instanceof jsend.ServerError, 'expected error to be a ServerError');
    });
});

test('#fetchAll resolves to an array of MockModels', function (assert) {
  const ajaxRequest = {url: 'test-namespace/test-endpoint'};
  const response = [{id: 1, foo: 'bar'}];
  const jsend = this.subject({namespace: 'test-namespace'});
  const ajaxStub = this.stub(jsend, 'ajax')
    .returns(Ember.RSVP.resolve(response));

  assert.expect(2);
  return jsend.fetchAll(MockModel).then(result => {
    sinon.assert.calledWith(ajaxStub, sinon.match(ajaxRequest), 'test-fetchAll');
    assert.ok(result[0] instanceof MockModel, 'expected result to be a MockModel');
  });
});

test('#fetch resolves to a MockModel', function (assert) {
  const ajaxRequest = {url: 'test-namespace/test-endpoint/1'};
  const response = {id: 1, foo: 'bar'};
  const jsend = this.subject({namespace: 'test-namespace'});
  const ajaxStub = this.stub(jsend, 'ajax')
    .returns(Ember.RSVP.resolve(response));

  assert.expect(2);
  return jsend.fetch(MockModel, 1).then(result => {
    sinon.assert.calledWith(ajaxStub, sinon.match(ajaxRequest), 'test-fetch');
    assert.ok(result instanceof MockModel, 'expected result to be a MockModel');
  });
});

test('#create sends a POST request', function (assert) {
  const ajaxRequest = {url: 'test-namespace/test-endpoint', method: 'POST'};
  const response = {id: 1, foo: 'bar'};
  const jsend = this.subject({namespace: 'test-namespace'});
  const ajaxStub = this.stub(jsend, 'ajax')
    .returns(Ember.RSVP.resolve(response));

  assert.expect(1);
  return jsend.create(MockModel.create()).then(() => {
    sinon.assert.calledWith(ajaxStub, sinon.match(ajaxRequest), 'test-fetch');
  });
});

test('#update sends a PATCH request', function (assert) {
  const ajaxRequest = {url: 'test-namespace/test-endpoint/1', method: 'PATCH'};
  const response = {id: 1, foo: 'bar'};
  const jsend = this.subject({namespace: 'test-namespace'});
  const ajaxStub = this.stub(jsend, 'ajax')
    .returns(Ember.RSVP.resolve(response));

  assert.expect(1);
  return jsend.update(MockModel.create({id: 1})).then(() => {
    sinon.assert.calledWith(ajaxStub, sinon.match(ajaxRequest), 'test-fetch');
  });
});

test('#delete sends a DELETE request', function (assert) {
  const ajaxRequest = {url: 'test-namespace/test-endpoint/1', method: 'DELETE'};
  const response = null;
  const jsend = this.subject({namespace: 'test-namespace'});
  const ajaxStub = this.stub(jsend, 'ajax')
    .returns(Ember.RSVP.resolve(response));

  assert.expect(1);
  return jsend.delete(MockModel.create({id: 1})).then(() => {
    sinon.assert.calledWith(ajaxStub, sinon.match(ajaxRequest));
  });
});
